package com.yescare.api.service;

import com.yescare.api.domain.*;
import com.yescare.api.dto.AdminReservationUpdateRequest;
import com.yescare.api.dto.ReservationRequest;
import com.yescare.api.dto.ReservationResponse;
import com.yescare.api.dto.ReviewResponse;
import com.yescare.api.repository.ManagerRepository;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.repository.ReservationRepository;
import com.yescare.api.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final MemberRepository memberRepository;
    private final ReviewRepository reviewRepository;
    private final ManagerRepository managerRepository;

    @Transactional
    public Long createReservation(String email, ReservationRequest request) {

        // 1. ID가 아니라 '이메일'로 안전하게 진짜 회원을 찾습니다.
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        // 2. 중복 예약 검증
        boolean isDuplicate = reservationRepository.existsByMemberAndReservationTime(
                member, request.getReservationTime()
        );
        if (isDuplicate) {
            throw new IllegalStateException("해당 시간에 이미 예약된 내역이 존재합니다.");
        }

        // 3. 저장 진행
        Reservation newReservation = Reservation.builder()
                .patientName(request.getPatientName())
                .patientPhone(request.getPatientPhone())
                .hospitalName(request.getHospitalName())
                .reservationTime(request.getReservationTime())
                .guardianName(request.getGuardianName())
                .guardianPhone(request.getGuardianPhone())
                .memo(request.getMemo())
                .detailedContent(request.getDetailedContent())
                .doctorInquiry(request.getDoctorInquiry())
                .member(member)
                .requirements(request.getRequirements())
                .category(request.getCategory())
                .meetingPoint(request.getMeetingPoint())
                .transportation(request.getTransportation())
                .mobility(request.getMobility())
                .status(ReservationStatus.WAITING)
                .build();

        reservationRepository.save(newReservation);
        return newReservation.getId();
    }

    /**
     * 전체 예약 목록 조회 기능
     */
    // 조회만 하는 기능이므로 readOnly = true를 주면 DB 성능이 훨씬 좋아집니다!
    @Transactional(readOnly = true)
    public Page<ReservationResponse> getAllReservations(Pageable pageable) {
        // DB에서 10개씩 잘라서 가져온 뒤 Response DTO로 변환합니다.
        return reservationRepository.findAll(pageable)
                .map(ReservationResponse::new);
    }

    /**
     * 예약 상태 변경 기능
     */
    @Transactional
    public void updateReservationStatus(Long id, String newStatus) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 예약입니다. (ID: " + id + ")"));

        // String으로 들어온 상태값을 Enum으로 변환해서 업데이트
        reservation.updateStatus(ReservationStatus.valueOf(newStatus));
    }

    /**
     * 예약 취소(삭제) 기능
     */
    @Transactional // DB 데이터를 건드리는 작업이므로 필수!
    public void deleteReservation(Long id) {

        // 1. 지울 예약이 DB에 존재하는지 확인합니다.
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 예약입니다. (ID: " + id + ")"));

        // 2. 찾아온 예약을 DB에서 완전히 삭제합니다.
        reservationRepository.delete(reservation);
    }

    /**
     * 내 예약 목록 조회 (마이페이지)
     */
    @Transactional(readOnly = true)
    public List<ReservationResponse> getMyReservations(String email) {

        // 1. 방금 만든 리모컨 버튼으로 내 이메일에 해당하는 예약만 DB에서 싹 긁어옵니다.
        List<Reservation> myReservations = reservationRepository.findByMemberEmail(email);

        // 2. 프론트엔드용 상자(Response DTO)에 예쁘게 옮겨 담아서 반환합니다.
        return myReservations.stream()
                .map(ReservationResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void assignManagerByAdmin(Long reservationId, String managerEmail) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 예약입니다."));

        Member manager = memberRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new IllegalArgumentException("매니저 정보를 찾을 수 없습니다. (이메일 확인 필요)"));

        // 대기 중인 상태에서만 배정 가능하도록 체크
        if (reservation.getStatus() != ReservationStatus.WAITING) {
            throw new IllegalStateException("매칭 대기 중인 예약만 매니저를 배정할 수 있습니다.");
        }

        // 최종 배정 직전에 한 번 더 검증!
        if (reservation.getMember().getId().equals(manager.getId())) {
            throw new IllegalArgumentException("본인이 신청한 예약은 직접 배정받을 수 없습니다.");
        }

        // 매니저 배정 및 상태 변경 (CONFIRMED)
        reservation.assignManager(manager);
        reservation.updateStatus(ReservationStatus.CONFIRMED);
    }

    // 관리자 전용 매니저 강제 배정 취소 로직
    @Transactional
    public void cancelManagerAssignByAdmin(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 예약입니다."));

        // 예약 확정(CONFIRMED) 상태인 경우에만 취소 가능하도록 체크
        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("예약 확정(배정 완료) 상태인 건만 배정을 취소할 수 있습니다.");
        }

        // 매니저 배정 해제 (null 처리) 및 상태를 다시 대기(WAITING)로 변경
        reservation.assignManager(null);
        reservation.updateStatus(ReservationStatus.WAITING);
    }

    @Transactional
    public void editReservation(Long id, String email, ReservationRequest request) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));

        // 본인 확인
        if (!reservation.getMember().getEmail().equals(email)) {
            throw new IllegalStateException("본인의 예약만 수정할 수 있습니다.");
        }
        // 매칭 대기 상태인지 확인
        if (reservation.getStatus() != ReservationStatus.WAITING) {
            throw new IllegalStateException("매칭 대기 상태에서만 수정할 수 있습니다.");
        }
        reservation.updateDetails(
                request.getHospitalName(),
                request.getReservationTime(),
                request.getRequirements(),
                request.getDetailedContent(),
                request.getDoctorInquiry(),
                request.getMeetingPoint(),
                request.getTransportation(),
                request.getMobility()
        );
    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservationDetail(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 예약을 찾을 수 없습니다. (ID: " + id + ")"));

        return new ReservationResponse(reservation);
    }

    // 매칭 대기 중인(WAITING) 예약만 조회
    @Transactional(readOnly = true)
    public List<ReservationResponse> getWaitingReservations() {
        return reservationRepository.findByStatus(ReservationStatus.WAITING).stream()
                .map(ReservationResponse::new)
                .collect(Collectors.toList());
    }

    // 특정 매니저에게 배정된 내역만 조회
    @Transactional(readOnly = true)
    public List<ReservationResponse> getManagerSchedules(String email) {
        return reservationRepository.findByManagerEmail(email).stream()
                .map(ReservationResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void createProxyReservation(Long originalId, Map<String, String> data) {
        Reservation old = reservationRepository.findById(originalId)
                .orElseThrow(() -> new IllegalArgumentException("원본 예약을 찾을 수 없습니다."));

        // 1. 원본 예약 버튼을 '신청 완료'로 잠금 처리!
        old.setHasProxy(true);

        // 2. 팝업에서 건너온 데이터를 조합하여 새 예약 생성
        Reservation newRes = Reservation.builder()
                .member(old.getMember())
                .patientName(old.getPatientName())
                .patientPhone(old.getPatientPhone())

                .hospitalName(data.get("hospitalName"))
                .reservationTime(LocalDateTime.parse(data.get("reservationTime")))
                .category(data.get("category"))
                .guardianName(data.get("guardianName"))
                .guardianPhone(data.get("guardianPhone"))
                .meetingPoint(data.get("meetingPoint"))
                .transportation(data.get("transportation"))
                .mobility(data.get("mobility"))
                .requirements(data.get("requirements"))
                .detailedContent(data.get("detailedContent"))
                .doctorInquiry(data.get("doctorInquiry"))

                // 재방문 회차 저장 및 메모 조합
                .revisitCount(data.get("revisitCount"))
                .memo("[매니저 대리 신청 - " + data.get("revisitCount") + "] " + data.get("memo"))
                .status(ReservationStatus.WAITING)
                .build();

        reservationRepository.save(newRes);
    }

    @Transactional
    public void addReview(Long reservationId, int rating, String comment) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));

        if (reservation.getStatus() != ReservationStatus.COMPLETED) {
            throw new IllegalStateException("동행이 완료된 건만 리뷰 작성이 가능합니다.");
        }

        Review review = Review.builder()
                .reservation(reservation)
                .rating(rating)
                .comment(comment)
                .build();
        reviewRepository.save(review);
    }

    // TO-BE: searchReservations 메서드를 아래와 같이 수정하여 String -> Enum 변환 적용
    @Transactional(readOnly = true)
    public Page<ReservationResponse> searchReservations(String keyword, String status, Pageable pageable) {
        // 프론트에서 온 String 상태값을 Enum으로 변환
        ReservationStatus enumStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            enumStatus = ReservationStatus.valueOf(status);
        }

        // Repository 쿼리 호출 시 변환된 enumStatus 전달
        Page<Reservation> reservations = reservationRepository.searchByKeywordAndStatus(keyword, enumStatus, pageable);
        return reservations.map(ReservationResponse::new);
    }

    // 어드민용 전체 리뷰 조회 (페이징)
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        // ReviewRepository가 없다면 상단에 주입(DI) 받아야 합니다: private final ReviewRepository reviewRepository;
        return reviewRepository.findAll(pageable).map(ReviewResponse::new);
    }

    // 어드민용 리뷰 삭제
    @Transactional
    public void deleteReview(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableManagersForReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));

        LocalDateTime resTime = reservation.getReservationTime();
        String dayOfWeekKor = getKoreanDayOfWeek(resTime.getDayOfWeek()); // 월, 화, 수...
        LocalTime time = resTime.toLocalTime();

        // Member가 아닌 Manager(매니저 상세 정보) 엔티티를 기준으로 조회합니다.
        List<Manager> allManagers = managerRepository.findAll();
        List<Map<String, Object>> availableManagers = new ArrayList<>();

        for (Manager manager : allManagers) {
            // 1) 요일 체크
            if (manager.getAvailableDays() == null || !manager.getAvailableDays().contains(dayOfWeekKor)) {
                continue;
            }

            // 예약 신청자의 Member ID와 매니저의 Member ID가 같다면 목록에서 제외!
            if (reservation.getMember().getId().equals(manager.getMember().getId())) {
                continue;
            }

            // 2) 시간 체크
            if (!isWithinAvailableTime(manager.getAvailableTime(), time)) {
                continue;
            }

            Member member = manager.getMember();

            // 계정 정지 상태
            if (!member.isActive()) {
                continue;
            }

            // 권한 한 번 더 안전하게 체크 (Enum 객체이므로 .name() 또는 == 사용)
            if (member.getRole() != Role.MANAGER && !member.getRole().name().contains("MANAGER")) {
                continue;
            }

            // 3) 중복 스케줄 체크 (Member 기준으로 확인)
            LocalDateTime startTime = resTime.minusHours(2);
            LocalDateTime endTime = resTime.plusHours(2);
            if (reservationRepository.existsConflictingReservation(member, startTime, endTime)) {
                continue;
            }

            // 프론트엔드(ManagerListModalContent.tsx)가 요구하는 필드명에 맞춰 조립
            Map<String, Object> managerData = new HashMap<>();
            managerData.put("id", member.getId());
            managerData.put("name", member.getName());
            managerData.put("email", member.getEmail());
            managerData.put("availableDays", manager.getAvailableDays());
            managerData.put("availableTime", manager.getAvailableTime());
            managerData.put("role", member.getRole().name());

            availableManagers.add(managerData);
        }

        return availableManagers;
    }

    // 요일 한글 변환 헬퍼 메서드
    private String getKoreanDayOfWeek(DayOfWeek dayOfWeek) {
        switch (dayOfWeek) {
            case MONDAY:
                return "월";
            case TUESDAY:
                return "화";
            case WEDNESDAY:
                return "수";
            case THURSDAY:
                return "목";
            case FRIDAY:
                return "금";
            case SATURDAY:
                return "토";
            case SUNDAY:
                return "일";
            default:
                return "";
        }
    }

    // 시간 범위 체크 헬퍼 메서드 (availableTime 포맷이 "09:00~18:00" 형태라고 가정)
    private boolean isWithinAvailableTime(String availableTimeStr, LocalTime targetTime) {
        if (availableTimeStr == null || !availableTimeStr.contains("~")) return false;
        try {
            String[] times = availableTimeStr.split("~");
            LocalTime startWork = LocalTime.parse(times[0].trim());
            LocalTime endWork = LocalTime.parse(times[1].trim());

            // 타겟 시간이 시작 시간과 종료 시간 사이인지 확인 (시작시간 포함, 종료시간 이전)
            return !targetTime.isBefore(startWork) && targetTime.isBefore(endWork);
        } catch (Exception e) {
            return true; // 파싱 실패 시 일단 필터링에서 제외하지 않음 (유연한 대처)
        }
    }

    // 예약 수정
    @Transactional
    public void updateReservationByAdmin(Long reservationId, AdminReservationUpdateRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 예약입니다."));

        reservation.updateDetails(
                request.getHospitalName(),
                request.getReservationTime(),
                request.getRequirements(),
                request.getDetailedContent(),
                request.getDoctorInquiry(),
                request.getMeetingPoint(),
                request.getTransportation(),
                request.getMobility()
        );
    }
}