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
        // 🌟 방어 로직: 이미 기본 테스트 데이터가 있으면 중복 생성하지 않음
        if (memberRepository.findByEmail("admin@yescare.com").isPresent()) {
            return;
        }

        // ==========================================
        // 1. 테스트용 계정 생성 (비밀번호는 모두 1234, 윤태현님 제외)
        // ==========================================

        // [최고 관리자]
        Member admin = Member.builder()
                .email("admin@yescare.com")
                .password(passwordEncoder.encode("1234"))
                .name("최고관리자")
                .phoneNumber("010-9999-9999")
                .role(Role.ADMIN)
                .build();
        memberRepository.save(admin);

        // [일반 고객 1]
        Member user1 = Member.builder()
                .email("test_user@yescare.com")
                .password(passwordEncoder.encode("1234"))
                .name("김테스트")
                .phoneNumber("010-1111-2222")
                .guardianName("김보호")
                .guardianPhone("010-2222-3333")
                .address("서울시 강남구 테헤란로 123")
                .role(Role.USER)
                .build();
        memberRepository.save(user1);

        // [일반 고객 2 - 윤태현님]
        Member yoonUser = Member.builder()
                .email("shth15926@gmail.com")
                .password(passwordEncoder.encode("shth1234!!"))
                .name("윤태현")
                .phoneNumber("01012341234")
                .guardianName("윤보호자")
                .guardianPhone("01034563456")
                .zipCode("42482")
                .address("대구 남구 월배로 지하 501 (서부정류장역)")
                .detailAddress("102동")
                .role(Role.USER)
                .build();
        memberRepository.save(yoonUser);

        // [매니저 1] - 베테랑 요양보호사
        Member managerMember1 = Member.builder()
                .email("manager1@yescare.com")
                .password(passwordEncoder.encode("1234"))
                .name("이매니저")
                .phoneNumber("010-3333-4444")
                .role(Role.MANAGER)
                .build();
        memberRepository.save(managerMember1);
        managerRepository.save(Manager.builder()
                .member(managerMember1)
                .introduction("환자를 내부모님처럼 모시겠습니다. 편안하고 안전한 동행을 약속드립니다.")
                .career("대학병원 간호조무사 5년, 요양병원 3년 근무")
                .certifications("요양보호사 1급, 간호조무사, 사회복지사 2급")
                .build());

        // [매니저 2] - 친절한 동행 매니저
        Member managerMember2 = Member.builder()
                .email("manager2@yescare.com")
                .password(passwordEncoder.encode("1234"))
                .name("박동행")
                .phoneNumber("010-4444-5555")
                .role(Role.MANAGER)
                .build();
        memberRepository.save(managerMember2);
        managerRepository.save(Manager.builder()
                .member(managerMember2)
                .introduction("밝은 미소로 병원 가는 길을 즐겁게 만들어 드립니다!")
                .career("예스케어 전속 동행 매니저 2년 차 (누적 동행 500회 이상)")
                .certifications("요양보호사, 응급처치(CPR) 수료")
                .build());


        // ==========================================
        // 2. 예약 데이터 생성 (과거 완료, 현재 진행, 대기 등)
        // ==========================================
        LocalDateTime now = LocalDateTime.now();

        // 🟢 [예약 1] 매칭 대기 (WAITING) - 내일 예약
        Reservation waitingRes = Reservation.builder()
                .member(user1)
                .patientName("김테스트")
                .patientPhone("010-1111-2222")
                .guardianName("김보호")
                .guardianPhone("010-2222-3333")
                .hospitalName("서울대학교병원")
                .reservationTime(now.plusDays(1).withHour(10).withMinute(0))
                .category("일반 진료")
                .meetingPoint("자택")
                .transportation("택시 이용")
                .mobility("독립 보행 가능")
                .memo("계단 오르내릴 때 부축이 필요합니다.")
                .requirements("계단 오르내릴 때 부축이 필요합니다.")
                .detailedContent("- 진료 과목: 정형외과\n- 주요 증상: 무릎 통증\n- 약국 동행: 필요함")
                .doctorInquiry("물리치료를 병행해도 되는지 여쭤봐주세요.")
                .status(ReservationStatus.WAITING)
                .build();
        reservationRepository.save(waitingRes);

        // 🟢 [예약 2] 예약 확정 (CONFIRMED) - 매니저 1 배정됨 (모레 예약)
        Reservation confirmedRes = Reservation.builder()
                .member(user1)
                .patientName("김테스트")
                .patientPhone("010-1111-2222")
                .hospitalName("아산현대병원")
                .reservationTime(now.plusDays(2).withHour(14).withMinute(30))
                .category("정밀 검사")
                .meetingPoint("아산현대병원 /// 병원 1층 로비 키오스크 앞")
                .transportation("자차 이용")
                .mobility("휠체어 이용")
                .memo("수면 내시경 예정이라 휠체어 이동을 부탁드립니다.")
                .detailedContent("- 검사 종류: 위/대장 수면 내시경\n- 금식: 밤 10시 이후 금식 완료")
                .status(ReservationStatus.CONFIRMED)
                .build();
        confirmedRes.assignManager(managerMember1);
        reservationRepository.save(confirmedRes);

        // 🟢 [예약 3] 예약 취소 (CANCELLED) - 고객 변심
        Reservation cancelledRes = Reservation.builder()
                .member(user1)
                .patientName("김테스트")
                .hospitalName("삼성서울병원")
                .reservationTime(now.plusDays(5).withHour(9).withMinute(0))
                .category("일반 진료")
                .meetingPoint("자택")
                .status(ReservationStatus.CANCELLED)
                .build();
        reservationRepository.save(cancelledRes);

        // 🟢 [예약 4] 이용 완료 (COMPLETED) - 매니저 2 배정, 3일 전 완료 (리포트/리뷰 존재)
        Reservation completedRes1 = Reservation.builder()
                .member(user1)
                .patientName("김테스트")
                .hospitalName("강남성모병원")
                .reservationTime(now.minusDays(3).withHour(11).withMinute(0))
                .category("일반 진료")
                .meetingPoint("자택")
                .transportation("대중교통")
                .mobility("지팡이 이용")
                .status(ReservationStatus.COMPLETED)
                .build();
        completedRes1.assignManager(managerMember2);
        reservationRepository.save(completedRes1);

        Report report1 = Report.builder()
                .reservation(completedRes1).department("안과")
                .patientCondition("normal")
                .doctorOpinion("백내장 초기 증상입니다. 안약 2주분 처방해 드렸으며 수술은 아직 필요 없습니다.")
                .prescription("안약 2종 (하루 3번 점안)")
                .managerComment("안과 검사 무사히 마치셨습니다. 눈이 부시다고 하셔서 선글라스 착용 도와드렸습니다.")
                .build();
        reportRepository.save(report1);

        Review review1 = Review.builder()
                .reservation(completedRes1).rating(5)
                .comment("너무 친절하게 잘 모셔주셔서 마음이 놓였습니다. 다음에도 박동행 매니저님께 부탁드리고 싶어요!")
                .build();
        reviewRepository.save(review1);


        // ==========================================
        // 3. 윤태현님 특화 데이터 세팅
        // ==========================================

        // [윤태현 예약 1] 이용 완료 (COMPLETED) - 대리 신청(hasProxy) 테스트용
        Reservation yoonRes1 = Reservation.builder()
                .member(yoonUser)
                .patientName("윤태현")
                .patientPhone("01012341234")
                .guardianName("윤보호")
                .guardianPhone("01023452345")
                .hospitalName("대구 달서구 달구벌대로 1035 (계명대학교동산병원)")
                .reservationTime(LocalDateTime.of(2026, 5, 1, 17, 30)) // 요청하신 고정 날짜
                .category("일반 진료")
                .meetingPoint("대구 달서구 달구벌대로 1035 (계명대학교동산병원) /// 로비 1층")
                .transportation("택시 이용")
                .mobility("독립 보행 가능")
                .memo("병원이 거이 처음이에요")
                .requirements("왼쪽 귀가 물이 찬 것처럼 먹먹하고 평소에 절반 만큼 들려요")
                .detailedContent("- 진료 과목: 이비인후과\n- 약국 동행: 필요함")
                .doctorInquiry("왼쪽 귀가 물이 찬 것 처럼 먹먹해요")
                .status(ReservationStatus.COMPLETED)
                .build();
        yoonRes1.assignManager(managerMember1);
        yoonRes1.setHasProxy(true); // 대리 신청 발생 표시
        reservationRepository.save(yoonRes1);

        Report yoonReport = Report.builder()
                .reservation(yoonRes1)
                .department("이비인후과")
                .doctorOpinion("귀에 가벼운 중이염 소견이 있습니다. 처방해 드린 항생제를 3일간 꾸준히 복용해 주세요.")
                .prescription("이비인후과 처방약 3일분 (식후 30분)")
                .managerComment("안전하게 병원 진료 후 귀가하셨습니다. 병원 방문이 처음이셔서 접수부터 수납, 약국까지 상세히 동행하며 안내해 드렸습니다.")
                .patientCondition("good")
                .nextSchedule("2026-05-15 10:00 (경과 관찰)")
                .build();
        reportRepository.save(yoonReport);

        Review yoonReview = Review.builder()
                .reservation(yoonRes1).rating(4)
                .comment("처음 이용해봤는데 매니저님이 정말 든든했습니다. 다만 택시 잡는 시간이 조금 걸렸네요.")
                .build();
        reviewRepository.save(yoonReview);

        // [윤태현 예약 2] 확정 (CONFIRMED) - 다음 주 경과 관찰 예약
        Reservation yoonRes2 = Reservation.builder()
                .member(yoonUser)
                .patientName("윤태현")
                .hospitalName("대구 계명대학교동산병원")
                .reservationTime(now.plusDays(7).withHour(10).withMinute(0))
                .category("일반 진료")
                .meetingPoint("자택")
                .status(ReservationStatus.CONFIRMED)
                .build();
        yoonRes2.assignManager(managerMember1);
        reservationRepository.save(yoonRes2);


        System.out.println("✅ [YesCare] 대규모 테스트용 더미 데이터가 성공적으로 생성(업데이트) 되었습니다!");
        System.out.println("   - Admin: admin@yescare.com (pw: 1234)");
        System.out.println("   - Manager 1: manager1@yescare.com (pw: 1234)");
        System.out.println("   - Manager 2: manager2@yescare.com (pw: 1234)");
        System.out.println("   - User 1: test_user@yescare.com (pw: 1234)");
        System.out.println("   - User 2 (Yoon): shth15926@gmail.com (pw: shth1234!!)");
    }
}