package com.yescare.api.config;

import com.yescare.api.domain.*;
import com.yescare.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class TestDataInit implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final ManagerRepository managerRepository;
    private final ReservationRepository reservationRepository;
    private final ReportRepository reportRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 방어 로직: 이미 데이터가 있으면 중복 생성하지 않음
        if (memberRepository.findByEmail("admin@yescare.com").isPresent()) {
            return;
        }

        String defaultPw = passwordEncoder.encode("1234");

        // ==========================================
        // 1. 최고 관리자 및 고객 생성 (서울/대구 주소 다각화)
        // ==========================================

        // [최고 관리자]
        Member admin = createMember("admin@yescare.com", defaultPw, "최고관리자", "01099999999", Role.ADMIN, "LOCAL",
                "06236", "서울 강남구 테헤란로 123", "관리자 오피스 4층");

        // [서울 지역 고객]
        Member seoulUser1 = createMember("seoul_user1@yescare.com", defaultPw, "김서울", "01011112222", Role.USER, "LOCAL",
                "06241", "서울 강남구 역삼로 456", "역삼아파트 101동 203호");
        Member seoulUser2 = createMember("seoul_user2@yescare.com", defaultPw, "박마포", "01055556666", Role.USER, "LOCAL",
                "04144", "서울 마포구 백범로 789", "공덕래미안 202동 1501호");

        // [대구 지역 고객]
        Member daeguUser1 = createMember("patience_park@naver.com", defaultPw, "이수성", "01077771111", Role.USER, "LOCAL",
                "42123", "대구 수성구 달구벌대로 1234", "수성롯데캐슬 105동 802호");
        Member yoonUser = createMember("shth15926@gmail.com", passwordEncoder.encode("shth1234!!"), "윤태현", "01088107708", Role.USER, "LOCAL",
                "42482", "대구 남구 월배로 지하 501", "102동"); // 윤태현님 기존 데이터 유지

        // [카카오 가입 고객 테스트용]
        Member kakaoUser = createMember("kakao_test@kakao.com", defaultPw, "카카오유저", "01000000000", Role.USER, "KAKAO",
                "12345", "카카오시 판교구 카카오로 1", "판교아지트");

        // ==========================================
        // 2. 매니저 계정 생성 (서울/대구 지역 분리)
        // ==========================================

        // [서울 활동 매니저]
        // [서울 활동 매니저]
        Manager seoulManager1 = createManager("seoul_m1@yescare.com", defaultPw, "이베테랑", "01033334444",
                "서울 대형병원 길라잡이입니다.", "대학병원 5년 경력", "요양보호사 1급", "월, 수, 금", "09:00 - 18:00",
                "05555", "서울 송파구 올림픽로 111", "잠실동", Role.MANAGER_PRO, Manager.ManagerType.PRO); // PRO 매니저

        Manager seoulManager2 = createManager("seoul_m2@yescare.com", defaultPw, "최친절", "01044445555",
                "어르신을 부모님처럼 모십니다.", "동행 서비스 3년", "요양보호사, CPR 수료", "화, 목, 토", "08:00 - 15:00",
                "03111", "서울 종로구 율곡로 222", "혜화동", Role.MANAGER_FREE, Manager.ManagerType.FREE); // FREE 매니저

// [대구 활동 매니저]
        Manager daeguManager1 = createManager("daegu_m1@yescare.com", defaultPw, "김대구", "01077778888",
                "경북대/영남대병원 행정 완벽 지원!", "병원 원무과 7년", "병원행정사, 사회복지사", "월, 화, 수, 목, 금", "10:00 - 19:00",
                "41911", "대구 중구 국채보상로 333", "동인동", Role.MANAGER_PRO, Manager.ManagerType.PRO); // PRO 매니저

        Manager daeguManager2 = createManager("daegu_m2@yescare.com", defaultPw, "박케어", "01088889999",
                "안전하고 편안한 이동을 책임집니다.", "재활병원 4년", "물리치료사 면허증", "평일 주말 무관", "09:00 - 17:00",
                "42722", "대구 달서구 상화로 444", "상인동", Role.MANAGER_FREE, Manager.ManagerType.FREE); // FREE 매니저

        // ==========================================
        // 3. 예약 데이터 시뮬레이션 (매출 통계 및 페이징 고도화)
        // ==========================================
        LocalDateTime now = LocalDateTime.now();

        // 🟢 [매칭 대기 건들 - 선입금만 발생]
        saveRes(seoulUser1, "서울대학교병원", now.plusDays(1), "일반 진료", ReservationStatus.WAITING, null, 44000, 0, null);
        saveRes(daeguUser1, "계명대학교 동산병원", now.plusDays(2), "정밀 검사", ReservationStatus.WAITING, null, 66000, 0, null);
        saveRes(yoonUser, "경북대학교병원", now.plusDays(3), "처방약 대리수령", ReservationStatus.WAITING, null, 44000, 0, null);

        // 🔵 [예약 확정 건들 - 매니저 매칭 완료]
        saveRes(seoulUser2, "신촌세브란스병원", now.plusDays(2), "항암 치료", ReservationStatus.CONFIRMED, seoulManager1, 44000, 0, null);
        saveRes(daeguUser1, "대구가톨릭대학교병원", now.plusHours(2), "정기 검진", ReservationStatus.CONFIRMED, daeguManager1, 66000, 0, null);
        saveRes(yoonUser, "영남대학교병원", now.plusDays(5), "재활 치료", ReservationStatus.CONFIRMED, daeguManager2, 88000, 0, null);

        // 🔴 [취소 건들 - 환불/위약금 처리 이력]
        saveRes(seoulUser1, "한양대학교병원", now.minusDays(5), "치과 진료", ReservationStatus.CANCELLED, seoulManager2, 44000, 0, null);
        saveRes(yoonUser, "파티마병원", now.minusDays(10), "내과 진료", ReservationStatus.CANCELLED, null, 44000, 0, null);

        // ⚫ [이용 완료 및 리뷰 세트 - 대시보드 매출 차트에 그려질 핵심 데이터]
        Reservation comp1 = saveRes(seoulUser1, "서울아산병원", now.minusDays(1), "수면 내시경", ReservationStatus.COMPLETED, seoulManager1, 66000, 11000, "동행 시간 1시간 초과");
        saveReview(comp1, 5, "매니저님이 검사 끝날 때까지 문 앞에서 기다려주셔서 감동이었어요.");

        Reservation comp2 = saveRes(seoulUser2, "삼성서울병원", now.minusDays(2), "당뇨 수치 확인", ReservationStatus.COMPLETED, seoulManager2, 44000, 0, null);
        saveReview(comp2, 4, "설명을 꼼꼼하게 메모해주셔서 의사 선생님 말씀을 다 이해했네요.");

        Reservation comp3 = saveRes(daeguUser1, "경북대학교병원", now.minusDays(3), "MRI 촬영", ReservationStatus.COMPLETED, daeguManager1, 88000, 22000, "대기 시간 지연 및 원내 이동 지원 추가");
        saveReview(comp3, 5, "큰 병원이라 길 찾기 어려웠는데 매니저님 덕분에 수월했어요.");

        Reservation comp4 = saveRes(yoonUser, "영남대학교병원", now.minusDays(5), "정형외과 외진", ReservationStatus.COMPLETED, daeguManager2, 44000, 5500, "현장 약국 동행 추가");
        saveReview(comp4, 5, "다리가 불편했는데 택시 승하차까지 너무 잘 도와주셨습니다.");

        // [대량 페이징 및 매출 집계 테스트용 - 최근 30일간의 더미 데이터 생성]
        for (int i = 6; i <= 25; i++) {
            // 서울/대구 번갈아가며 생성
            boolean isSeoul = (i % 2 == 0);
            Member targetUser = isSeoul ? seoulUser1 : daeguUser1;
            Manager targetManager = isSeoul ? seoulManager1 : daeguManager2;
            String targetHospital = isSeoul ? "강남세브란스병원" : "대구의료원";

            // 3번에 1번 꼴로 추가 요금 발생 시뮬레이션
            int extraFee = (i % 3 == 0) ? 11000 : 0;
            String extraReason = (i % 3 == 0) ? "원무과 수납 지연으로 인한 시간 초과" : null;

            saveRes(targetUser, targetHospital, now.minusDays(i), "정기 외래 진료", ReservationStatus.COMPLETED, targetManager, 44000, extraFee, extraReason);
        }

        System.out.println("✅ [YesCare] 대구/서울 지역별 데이터 및 어드민 매출 대시보드 테스트 환경 구축 완료!");
    }

    // 편의 메서드: 회원 생성 (지역 맞춤 주소 파라미터 추가)
    private Member createMember(String email, String pw, String name, String phone, Role role, String provider,
                                String zipCode, String address, String detailAddress) {
        Member m = Member.builder()
                .email(email)
                .password(pw)
                .name(name)
                .phoneNumber(phone)
                .guardianName(name + " 보호자")
                .guardianPhone("01088887777")
                .zipCode(zipCode)
                .address(address)
                .detailAddress(detailAddress)
                .role(role)
                .provider(provider)
                .build();
        return memberRepository.save(m);
    }

    // 편의 메서드: 매니저 생성 (지역 맞춤 주소 파라미터 추가)
    private Manager createManager(String email, String pw, String name, String phone, String intro, String career, String cert, String days, String time,
                                  String zipCode, String address, String detailAddress, Role role, Manager.ManagerType type) {
        Member m = createMember(email, pw, name, phone, role, "LOCAL", zipCode, address, detailAddress);
        Manager manager = Manager.builder()
                .member(m)
                .introduction(intro)
                .career(career)
                .certifications(cert)
                .availableDays(days)
                .availableTime(time)
                .managerType(type)
                .build();
        return managerRepository.save(manager);
    }

    // 편의 메서드: 예약 저장 (매출 통계용 요금 데이터 및 지역 맞춤 미팅 주소 연동)
    private Reservation saveRes(Member user, String hospital, LocalDateTime time, String cat, ReservationStatus status, Manager manager,
                                Integer baseFee, Integer extraChargeAmount, String extraChargeReason) {
        Reservation res = Reservation.builder()
                .member(user)
                .patientName(user.getName())
                .patientPhone(user.getPhoneNumber())
                .guardianName(user.getGuardianName())
                .guardianPhone(user.getGuardianPhone())
                .hospitalName(hospital)
                .reservationTime(time)
                .category(cat)
                .status(status)
                .meetingType("자택")
                .meetingAddress(user.getAddress() != null ? user.getAddress() : "주소 없음")
                .meetingDetailAddress(user.getDetailAddress() != null ? user.getDetailAddress() : "자택 앞")
                .transportation("일반 택시 결제 요청")
                .mobility("독립 보행 가능 (약간의 부축 필요)")
                .requirements("병원 원무과 접수 시 보호자 대리 사인 부탁드립니다. 낙상에 주의해 주세요.")
                .detailedContent("- 정기 진료 및 검사 진행 예정\n- 진료 전 금식 상태 유지 확인 필요")
                .doctorInquiry("최근 약 복용 후 소화 불량 증상이 있는지 여쭤봐 주세요.")
                .baseFee(baseFee)
                .extraChargeAmount(extraChargeAmount)
                .extraChargeReason(extraChargeReason)
                .build();

        if (manager != null) {
            res.assignManager(manager.getMember());
        }

        res.updateStatus(status);
        return reservationRepository.save(res);
    }

    private void saveReview(Reservation res, int rating, String comment) {
        reviewRepository.save(Review.builder().reservation(res).rating(rating).comment(comment).build());
    }
}