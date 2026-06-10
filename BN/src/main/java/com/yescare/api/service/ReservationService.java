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
import java.time.format.DateTimeFormatter;
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
    private final KakaoAlimtalkService kakaoAlimtalkService;

    @Transactional
    public Long createReservation(String email, ReservationRequest request) {

        // 예약 시간 정책(09:00 ~ 18:00, 10분 단위) 백엔드 2차 검증
        LocalTime reqTime = request.getReservationTime().toLocalTime();
        if (reqTime.isBefore(LocalTime.of(9, 0)) || reqTime.isAfter(LocalTime.of(18, 0))) {
            throw new IllegalArgumentException("예약 시간은 오전 09:00 부터 오후 18:00 사이만 가능합니다.");
        }
        if (reqTime.getMinute() % 10 != 0) {
            throw new IllegalArgumentException("예약 시간은 10분 단위로만 설정할 수 있습니다.");
        }

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

        // 알림톡 발송
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH:mm");

        kakaoAlimtalkService.sendReservationComplete(
                member.getPhoneNumber(),
                request.getPatientName(),
                request.getReservationTime().format(formatter),
                request.getHospitalName()
        );
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

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH:mm");

        kakaoAlimtalkService.sendManagerAssigned(
                reservation.getMember().getPhoneNumber(),
                reservation.getPatientName(),
                manager.getName(),
                reservation.getReservationTime().format(formatter)
        );
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

        LocalDateTime targetStart = reservation.getReservationTime();
        String dayOfWeekKor = getKoreanDayOfWeek(targetStart.getDayOfWeek());
        LocalTime targetTime = targetStart.toLocalTime();

        // LocalDateTime 기반으로 수학적 오차(자정 넘김) 원천 차단
        int estimatedHours = (reservation.getCategory() != null && reservation.getCategory().contains("정밀")) ? 5 : 3;
        LocalDateTime targetEnd = targetStart.plusHours(estimatedHours);

        List<Manager> allManagers = managerRepository.findAll();
        List<Map<String, Object>> resultList = new ArrayList<>();

        LocalDateTime startOfDay = targetStart.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = targetStart.toLocalDate().atTime(23, 59, 59);

        System.out.println("=== 🔍 매니저 배정 필터링 시작 (예약번호: " + reservationId + ") ===");

        for (Manager manager : allManagers) {
            Member member = manager.getMember();
            String managerName = member.getName() + "(ID:" + member.getId() + ")";

            if (!member.isActive()) continue;
            if (member.getRole() != Role.MANAGER && !member.getRole().name().contains("MANAGER")) continue;
            if (reservation.getMember().getId().equals(member.getId())) continue;

            String availDays = manager.getAvailableDays();
            if (availDays != null && !availDays.trim().isEmpty() && !availDays.contains(dayOfWeekKor)) continue;

            if (!isWithinAvailableTime(manager.getAvailableTime(), targetTime, targetEnd.toLocalTime())) continue;

            // 일단 그날 스케줄 전부 다 가져옴
            List<Reservation> dailySchedules = reservationRepository.findManagerDailySchedules(
                    member, startOfDay, endOfDay
            );

            boolean isOverlapping = false;
            for (Reservation schedule : dailySchedules) {
                // 핵심: 취소된 예약이거나, 지금 배정하려고 열어둔 '바로 그 예약'이면 겹침 검사 패스!
                if (schedule.getStatus() == ReservationStatus.CANCELLED || schedule.getId().equals(reservationId)) {
                    continue;
                }

                LocalDateTime existStart = schedule.getReservationTime();
                int existHours = (schedule.getCategory() != null && schedule.getCategory().contains("정밀")) ? 5 : 3;
                LocalDateTime existEnd = existStart.plusHours(existHours);

                // 완벽한 시간 교집합(Overlap) 수학 공식 적용
                if (targetStart.isBefore(existEnd) && targetEnd.isAfter(existStart)) {
                    System.out.println("❌ " + managerName + " 제외: 기존 일정과 겹침 (" + existStart.toLocalTime() + " ~ " + existEnd.toLocalTime() + ")");
                    isOverlapping = true;
                    break;
                }
            }

            if (isOverlapping) continue;

            System.out.println("✅ " + managerName + " -> 배정 가능 (시간 겹침 없음)");

            Map<String, Object> managerData = new HashMap<>();
            managerData.put("id", member.getId());
            managerData.put("name", member.getName());
            managerData.put("email", member.getEmail());
            managerData.put("availableDays", manager.getAvailableDays() == null ? "상시" : manager.getAvailableDays());
            managerData.put("availableTime", manager.getAvailableTime() == null ? "상시" : manager.getAvailableTime());
            managerData.put("role", member.getRole().name());

            resultList.add(managerData);
        }

        return resultList;
    }

    private boolean isWithinAvailableTime(String availableTimeStr, LocalTime targetTime, LocalTime targetEndTime) {
        if (availableTimeStr == null || availableTimeStr.trim().isEmpty() || !availableTimeStr.contains("~")) {
            return true;
        }
        try {
            String[] times = availableTimeStr.split("~");
            LocalTime startWork = LocalTime.parse(times[0].trim());
            LocalTime endWork = LocalTime.parse(times[1].trim());

            return !targetTime.isBefore(startWork) && !targetEndTime.isAfter(endWork);
        } catch (Exception e) {
            return true;
        }
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

    // 엑셀 다운로드용 전체 데이터 조회 (페이징 없음)
    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservationsForExcel(String keyword, String status) {
        ReservationStatus enumStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            enumStatus = ReservationStatus.valueOf(status);
        }

        // 기존 페이징 검색 메서드(searchByKeywordAndStatus)를 그대로 재활용하되,
        // Pageable.unpaged()를 넘겨서 10개씩 자르지 않고 조건에 맞는 전체 데이터를 가져옵니다.
        // (만약 JPA 버전 문제로 unpaged() 에러가 난다면 PageRequest.of(0, Integer.MAX_VALUE) 로 변경하세요)
        Page<Reservation> reservations = reservationRepository.searchByKeywordAndStatus(keyword, enumStatus, Pageable.unpaged());

        // Page 객체에서 내용물만 꺼내서 List로 반환
        return reservations.getContent().stream()
                .map(ReservationResponse::new)
                .collect(Collectors.toList());
    }
}