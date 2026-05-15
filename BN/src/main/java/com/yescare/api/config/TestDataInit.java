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
        // 1. 최고 관리자 및 일반 고객 생성
        // ==========================================

        // [최고 관리자]
        Member admin = createMember("admin@yescare.com", defaultPw, "최고관리자", "010-9999-9999", Role.ADMIN, "LOCAL");

        // [일반 고객들 - LOCAL]
        Member user1 = createMember("test_user@yescare.com", defaultPw, "김테스트", "010-1111-2222", Role.USER, "LOCAL");
        Member user2 = createMember("new_user@yescare.com", defaultPw, "이단골", "010-5555-6666", Role.USER, "LOCAL");
        Member user3 = createMember("patience_park@naver.com", defaultPw, "박환자", "010-7777-1111", Role.USER, "LOCAL");

        // [카카오 가입 고객 테스트용]
        Member kakaoUser = createMember("kakao_test@kakao.com", defaultPw, "카카오유저", "010-0000-0000", Role.USER, "KAKAO");

        // [윤태현님 데이터 - 유지 및 provider 추가]
        Member yoonUser = Member.builder()
                .email("shth15926@gmail.com")
                .password(passwordEncoder.encode("shth1234!!"))
                .name("윤태현")
                .phoneNumber("01012341234")
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

        Manager m1 = createManager("manager1@yescare.com", defaultPw, "이매니저", "010-3333-4444",
                "베테랑 간호조무사 출신입니다.", "대학병원 5년 경력", "요양보호사 1급, 간호조무사", "월, 수, 금", "09:00 - 18:00");

        Manager m2 = createManager("manager2@yescare.com", defaultPw, "박동행", "010-4444-5555",
                "친절한 미소로 모십니다.", "동행 서비스 3년", "요양보호사, CPR 수료", "화, 목, 토", "08:00 - 15:00");

        Manager m3 = createManager("manager3@yescare.com", defaultPw, "김케어", "010-7777-8888",
                "행정 업무 완벽 지원!", "병원 원무과 7년", "병원행정사, 사회복지사", "월, 화, 수, 목, 금", "10:00 - 19:00");

        Manager m4 = createManager("manager4@yescare.com", defaultPw, "최안심", "010-8888-9999",
                "주말 전담 매니저입니다.", "재활센터 4년", "물리치료사 면허", "토, 일", "09:00 - 14:00");

        Manager m5 = createManager("manager5@yescare.com", defaultPw, "정동행", "010-2222-8888",
                "어르신 말벗 전문입니다.", "사회복지관 10년", "사회복지사 1급", "월, 화, 목", "13:00 - 21:00");


        // ==========================================
        // 3. 예약 및 사후 데이터 (총 20건 이상 시뮬레이션)
        // ==========================================
        LocalDateTime now = LocalDateTime.now();

        // [매칭 대기 건들]
        saveRes(user1, "서울대병원", now.plusDays(1), "일반 진료", ReservationStatus.WAITING, null);
        saveRes(user2, "분당서울대병원", now.plusDays(2), "정밀 검사", ReservationStatus.WAITING, null);
        saveRes(yoonUser, "경북대병원", now.plusDays(3), "처방약 대리수령", ReservationStatus.WAITING, null);
        saveRes(user3, "삼성서울병원", now.plusDays(5), "일반 진료", ReservationStatus.WAITING, null);
        saveRes(kakaoUser, "아산병원", now.plusDays(1), "종합 검진", ReservationStatus.WAITING, null);

        // [예약 확정 건들]
        Reservation resConf1 = saveRes(user1, "세브란스병원", now.plusDays(2), "항암 치료", ReservationStatus.CONFIRMED, m1);
        Reservation resConf2 = saveRes(user2, "고대구로병원", now.plusHours(5), "정기 검진", ReservationStatus.CONFIRMED, m3);
        Reservation resConf3 = saveRes(yoonUser, "영남대병원", now.plusDays(10), "재활 치료", ReservationStatus.CONFIRMED, m5);

        // [취소 건들]
        saveRes(user1, "한양대병원", now.minusDays(5), "치과 진료", ReservationStatus.CANCELLED, null);
        saveRes(user3, "강남성모병원", now.plusDays(1), "내과 진료", ReservationStatus.CANCELLED, m2);

        // [이용 완료 및 리포트/리뷰 세트]

        // 세트 1: 김테스트 & 이매니저
        Reservation comp1 = saveRes(user1, "아산현대병원", now.minusDays(2), "수면 내시경", ReservationStatus.COMPLETED, m1);
        saveReport(comp1, "소화기내과", "normal", "용종 없이 깨끗합니다.", "특이사항 없음", "보호자님께 전화로 내용 전달 완료");
        saveReview(comp1, 5, "매니저님이 검사 끝날 때까지 문 앞에서 기다려주셔서 감동이었어요.");

        // 세트 2: 이단골 & 김케어
        Reservation comp2 = saveRes(user2, "분당제생병원", now.minusDays(7), "당뇨 수치 확인", ReservationStatus.COMPLETED, m3);
        saveReport(comp2, "내분비내과", "good", "혈당 조절이 잘 되고 있습니다.", "기존 약 동일 처방", "약국 대기 줄이 길었으나 무사히 수령");
        saveReview(comp2, 4, "설명을 꼼꼼하게 메모해주셔서 의사 선생님 말씀을 다 이해했네요.");

        // 세트 3: 윤태현님 고정 데이터 (유지)
        Reservation yoonComp = Reservation.builder()
                .member(yoonUser).patientName("윤태현").patientPhone("01012341234")
                .hospitalName("계명대동산병원").reservationTime(LocalDateTime.of(2026, 5, 1, 17, 30))
                .category("일반 진료").status(ReservationStatus.COMPLETED).hasProxy(true).build();
        yoonComp.assignManager(m1.getMember());
        reservationRepository.save(yoonComp);
        saveReport(yoonComp, "이비인후과", "good", "중이염 소견.", "항생제 3일분", "첫 방문 안내 완벽 수행");
        saveReview(yoonComp, 4, "처음이라 막막했는데 든든했습니다.");

        // [대량 페이징 테스트용 추가 데이터]
        for (int i = 1; i <= 10; i++) {
            saveRes(user3, "테스트병원 " + i, now.minusDays(10 + i), "일반 진료", ReservationStatus.COMPLETED, m2);
        }

        System.out.println("✅ [YesCare] 런칭급 대규모 테스트 데이터 초기화 완료!");
        System.out.println("   - 총 회원 수: " + memberRepository.count() + "명 (Yoon, Kakao 포함)");
        System.out.println("   - 총 예약 수: " + reservationRepository.count() + "건 (전 상태 포함)");
        System.out.println("   - Provider 필드 적용 완료 (LOCAL/KAKAO)");
    }

    // 편의 메서드: 회원 생성
    private Member createMember(String email, String pw, String name, String phone, Role role, String provider) {
        Member m = Member.builder()
                .email(email).password(pw).name(name).phoneNumber(phone)
                .role(role).provider(provider).build();
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

    // 편의 메서드: 예약 저장
    private Reservation saveRes(Member user, String hospital, LocalDateTime time, String cat, ReservationStatus status, Manager manager) {
        Reservation res = Reservation.builder()
                .member(user).patientName(user.getName()).patientPhone(user.getPhoneNumber())
                .hospitalName(hospital).reservationTime(time).category(cat).status(status).build();
        if (manager != null) res.assignManager(manager.getMember());
        return reservationRepository.save(res);
    }

    private void saveReport(Reservation res, String dep, String cond, String opinion, String pres, String comment) {
        reportRepository.save(Report.builder().reservation(res).department(dep).patientCondition(cond)
                .doctorOpinion(opinion).prescription(pres).managerComment(comment).build());
    }

    private void saveReview(Reservation res, int rating, String comment) {
        reviewRepository.save(Review.builder().reservation(res).rating(rating).comment(comment).build());
    }
}