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
        // 1. 최고 관리자 및 일반 고객 생성 (보호자 및 주소 정보 추가)
        // ==========================================

        // [최고 관리자]
        Member admin = createMember("admin@yescare.com", defaultPw, "최고관리자", "01099999999", Role.ADMIN, "LOCAL");

        // [일반 고객들 - LOCAL]
        Member user1 = createMember("test_user@yescare.com", defaultPw, "김테스트", "01011112222", Role.USER, "LOCAL");
        Member user2 = createMember("new_user@yescare.com", defaultPw, "이단골", "01055556666", Role.USER, "LOCAL");
        Member user3 = createMember("patience_park@naver.com", defaultPw, "박환자", "01077771111", Role.USER, "LOCAL");

        // [카카오 가입 고객 테스트용]
        Member kakaoUser = createMember("kakao_test@kakao.com", defaultPw, "카카오유저", "01000000000", Role.USER, "KAKAO");

        // [윤태현님 데이터]
        Member yoonUser = Member.builder()
                .email("shth15926@gmail.com")
                .password(passwordEncoder.encode("shth1234!!"))
                .name("윤태현")
                .phoneNumber("01088107708")
                .guardianName("윤보호자")
                .guardianPhone("01034563456")
                .zipCode("42482")
                .address("대구 남구 월배로 지하 501")
                .detailAddress("102동")
                .role(Role.USER)
                .provider("LOCAL")
                .build();
        memberRepository.save(yoonUser);

        // ==========================================
        // 2. 매니저 계정 생성 (풍부한 프로필)
        // ==========================================
        Manager m1 = createManager("manager1@yescare.com", defaultPw, "이매니저", "01033334444",
                "베테랑 간호조무사 출신입니다.", "대학병원 5년 경력", "요양보호사 1급, 간호조무사", "월, 수, 금", "09:00 - 18:00");

        Manager m2 = createManager("manager2@yescare.com", defaultPw, "박동행", "01044445555",
                "친절한 미소로 모십니다.", "동행 서비스 3년", "요양보호사, CPR 수료", "화, 목, 토", "08:00 - 15:00");

        Manager m3 = createManager("manager3@yescare.com", defaultPw, "김케어", "01077778888",
                "행정 업무 완벽 지원!", "병원 원무과 7년", "병원행정사, 사회복지사", "월, 화, 수, 목, 금", "10:00 - 19:00");

        // ==========================================
        // 3. 예약 데이터 시뮬레이션 (3단 UI 연동 상세 기본정보 추가)
        // ==========================================
        LocalDateTime now = LocalDateTime.now();

        // [매칭 대기 건들]
        saveRes(user1, "서울대병원", now.plusDays(1), "일반 진료", ReservationStatus.WAITING, null);
        saveRes(user2, "분당서울대병원", now.plusDays(2), "정밀 검사", ReservationStatus.WAITING, null);
        saveRes(yoonUser, "경북대병원", now.plusDays(3), "처방약 대리수령", ReservationStatus.WAITING, null);
        saveRes(user3, "삼성서울병원", now.plusDays(5), "일반 진료", ReservationStatus.WAITING, null);

        // [예약 확정 건들 -> 대시보드에서 '케어 리포트 작성' 버튼이 뜨는 핵심 타겟]
        saveRes(user1, "세브란스병원", now.plusDays(2), "항암 치료", ReservationStatus.CONFIRMED, m1);
        saveRes(user2, "고대구로병원", now.plusHours(2), "정기 검진", ReservationStatus.CONFIRMED, m3);
        saveRes(yoonUser, "영남대병원", now.plusDays(10), "재활 치료", ReservationStatus.CONFIRMED, m2);

        // [취소 건들]
        saveRes(user1, "한양대병원", now.minusDays(5), "치과 진료", ReservationStatus.CANCELLED, null);

        // [이용 완료 및 리뷰 세트]
        // 💡 중요: 리포트 최초 작성 테스트를 방해하지 않도록 saveReport()는 과감히 제외했습니다.
        // 현재 이 상태로 두면 대시보드 완료 탭에서 [케어 리포트 작성] 버튼이 깔끔하게 노출됩니다.
        Reservation comp1 = saveRes(user1, "아산현대병원", now.minusDays(1), "수면 내시경", ReservationStatus.COMPLETED, m1);
        saveReview(comp1, 5, "매니저님이 검사 끝날 때까지 문 앞에서 기다려주셔서 감동이었어요.");

        Reservation comp2 = saveRes(user2, "분당제생병원", now.minusDays(2), "당뇨 수치 확인", ReservationStatus.COMPLETED, m3);
        saveReview(comp2, 4, "설명을 꼼꼼하게 메모해주셔서 의사 선생님 말씀을 다 이해했네요.");

        // [대량 페이징 테스트용 추가 데이터]
        for (int i = 1; i <= 8; i++) {
            saveRes(user3, "종합병원 " + i, now.minusDays(10 + i), "정기 검진", ReservationStatus.COMPLETED, m2);
        }

        System.out.println("✅ [YesCare] 보호자/주소/예약 상세정보가 완벽히 포함된 런칭 데이터 초기화 완료!");
    }

    // 편의 메서드: 회원 생성 (기본 주소 및 보호자 정보 일괄 자동 세팅)
    private Member createMember(String email, String pw, String name, String phone, Role role, String provider) {
        Member m = Member.builder()
                .email(email)
                .password(pw)
                .name(name)
                .phoneNumber(phone)
                .guardianName(name + "보호자")
                .guardianPhone("01088887777")
                .zipCode("12345")
                .address("서울시 강남구 테헤란로 123")
                .detailAddress("예스빌딩 4층")
                .role(role)
                .provider(provider)
                .build();
        return memberRepository.save(m);
    }

    // 편의 메서드: 매니저 생성
    private Manager createManager(String email, String pw, String name, String phone, String intro, String career, String cert, String days, String time) {
        Member m = createMember(email, pw, name, phone, Role.MANAGER, "LOCAL");
        Manager manager = Manager.builder()
                .member(m).introduction(intro).career(career).certifications(cert)
                .availableDays(days).availableTime(time).build();
        return managerRepository.save(manager);
    }

    // 편의 메서드: 예약 저장 (3단 UI 고도화 데이터 탑재)
    private Reservation saveRes(Member user, String hospital, LocalDateTime time, String cat, ReservationStatus status, Manager manager) {
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

                // 프론트엔드 3단 UI(회색, 파란색, 주황색) 및 카카오맵 연동을 위한 상세 데이터 픽스
                .meetingType("자택")
                .meetingAddress(user.getAddress() != null ? user.getAddress() : "주소 없음")
                .meetingDetailAddress("자택 앞") // 기존에 /// 앞에 있던 상세 설명을 여기에 배치
                .transportation("일반 택시 결제 요청")
                .mobility("독립 보행 가능 (약간의 부축 필요)")
                .requirements("병원 원무과 접수 시 보호자 대리 사인 부탁드립니다. 낙상에 주의해 주세요.")
                .detailedContent("- 정기 혈액 검사 진행 예정\n- 진료 전 8시간 금식 상태 유지 확인 필요")
                .doctorInquiry("최근 처방받은 약을 드신 후 간헐적인 어지러움증이 생기셨는데 약물 부작용 가능성이 있는지 여쭤봐 주세요.")
                .build();

        if (manager != null) res.assignManager(manager.getMember());
        return reservationRepository.save(res);
    }

    private void saveReview(Reservation res, int rating, String comment) {
        reviewRepository.save(Review.builder().reservation(res).rating(rating).comment(comment).build());
    }
}