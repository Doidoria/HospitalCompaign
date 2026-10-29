package com.yescare.api.config;

import com.yescare.api.domain.*;
import com.yescare.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

/**
 * 로컬 개발/테스트용 시드 데이터 (local 프로필 전용, 운영에서는 실행되지 않음)
 *
 * [계정] 비밀번호는 모두 1234
 *  - 관리자 : admin@yescare.com
 *  - 고객   : seoul_user1(김서울), seoul_user2(박마포), daegu_user1(이수성), daegu_user2(최대구), kakao_test(카카오유저)
 *  - 매니저 : seoul_m1(이베테랑, PRO), seoul_m2(최친절, FREE), daegu_m1(김대구, PRO), daegu_m2(박케어, FREE)
 *
 * [시나리오별 예약] 서울 고객 ↔ 서울 매니저, 대구 고객 ↔ 대구 매니저로만 연결
 *  - WAITING      : 관리자 매니저 배정 테스트
 *  - CONFIRMED    : 매니저 "동행 시작" 테스트
 *  - IN_PROGRESS  : 매니저 추가요금 등록 / 리포트 작성 테스트
 *  - COMPLETED    : 리포트·PDF·리뷰 조회, 추가요금 결제(미결제 1건), 대리 신청(다음 일정 있음 1건) 테스트
 *  - CANCELLED    : 취소 내역 표시 테스트
 *  - 과거 완료 건  : 매출 통계 / 정산 / 페이징 테스트
 *
 * 다시 생성하려면 로컬 DB를 비우고(DROP/CREATE DATABASE yescare_db) BN을 재시작하세요.
 */
@Component
@Profile("local")
@RequiredArgsConstructor
public class TestDataInit implements CommandLineRunner {

    // 요금 정책 (ReservationService.BASE_FEE_BY_CATEGORY와 동일하게 유지)
    private static final String GENERAL = "일반 진료";
    private static final String PRECISE = "정밀 검사";
    private static final int GENERAL_FEE = 44000;
    private static final int PRECISE_FEE = 66000;
    private static final int OVERTIME_FEE_PER_30MIN = 11000;

    private final MemberRepository memberRepository;
    private final ManagerRepository managerRepository;
    private final ReservationRepository reservationRepository;
    private final ReportRepository reportRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    private int seq = 0; // 시드용 가짜 주문번호 일련번호

    @Override
    @Transactional
    public void run(String... args) {
        // 이미 시드 데이터가 있으면 중복 생성하지 않음
        if (memberRepository.findByEmail("admin@yescare.com").isPresent()) {
            return;
        }

        String pw = passwordEncoder.encode("1234");

        // ==========================================
        // 1. 관리자 / 고객
        // ==========================================
        createMember("admin@yescare.com", pw, "최고관리자", "01099990000", Role.ADMIN, "LOCAL",
                "06236", "서울 강남구 테헤란로 123", "예스케어 오피스 4층");

        Member seoulUser1 = createMember("seoul_user1@yescare.com", pw, "김서울", "01011110001", Role.USER, "LOCAL",
                "06241", "서울 강남구 역삼로 456", "역삼아파트 101동 203호");
        Member seoulUser2 = createMember("seoul_user2@yescare.com", pw, "박마포", "01011110002", Role.USER, "LOCAL",
                "04144", "서울 마포구 백범로 789", "공덕아파트 202동 1501호");
        Member daeguUser1 = createMember("daegu_user1@yescare.com", pw, "이수성", "01011110003", Role.USER, "LOCAL",
                "42123", "대구 수성구 달구벌대로 1234", "수성아파트 105동 802호");
        Member daeguUser2 = createMember("daegu_user2@yescare.com", pw, "최대구", "01011110004", Role.USER, "LOCAL",
                "42482", "대구 남구 월배로 501", "대명아파트 102동 301호");
        Member kakaoUser = createMember("kakao_test@kakao.com", pw, "카카오유저", "01011110005", Role.USER, "KAKAO",
                "13529", "경기 성남시 분당구 판교역로 1", "판교아파트 1동 101호");

        // ==========================================
        // 2. 매니저 (가능 요일/시간은 FN 프로필 화면 형식과 동일)
        // ==========================================
        Member seoulM1 = createManager("seoul_m1@yescare.com", pw, "이베테랑", "01022220001",
                "서울 대형병원 길라잡이입니다.", "대학병원 동행 5년", "요양보호사 1급",
                "월,화,수,목,금", "종일 (09:00~18:00)",
                "05555", "서울 송파구 올림픽로 111", "잠실동", Role.MANAGER_PRO, Manager.ManagerType.PRO);
        Member seoulM2 = createManager("seoul_m2@yescare.com", pw, "최친절", "01022220002",
                "어르신을 부모님처럼 모십니다.", "동행 서비스 3년", "요양보호사, CPR 수료",
                "화,목,토", "오전 (09:00~13:00)",
                "03111", "서울 종로구 율곡로 222", "혜화동", Role.MANAGER_FREE, Manager.ManagerType.FREE);
        Member daeguM1 = createManager("daegu_m1@yescare.com", pw, "김대구", "01022220003",
                "경북대/영남대병원 행정 완벽 지원!", "병원 원무과 7년", "병원행정사, 사회복지사",
                "월,화,수,목,금", "종일 (09:00~18:00)",
                "41911", "대구 중구 국채보상로 333", "동인동", Role.MANAGER_PRO, Manager.ManagerType.PRO);
        Member daeguM2 = createManager("daegu_m2@yescare.com", pw, "박케어", "01022220004",
                "안전하고 편안한 이동을 책임집니다.", "재활병원 4년", "물리치료사 면허",
                "월,화,수,목,금,토,일", "오후 (13:00~18:00)",
                "42722", "대구 달서구 상화로 444", "상인동", Role.MANAGER_FREE, Manager.ManagerType.FREE);

        LocalDate today = LocalDate.now();

        // ==========================================
        // 3. 🟢 WAITING (매칭 대기) → 관리자 배정 테스트
        // ==========================================
        saveRes(seoulUser1, "서울대학교병원", at(today, 2, 10, 0), GENERAL, ReservationStatus.WAITING, null);
        saveRes(daeguUser1, "계명대학교 동산병원", at(today, 3, 9, 30), PRECISE, ReservationStatus.WAITING, null);
        saveRes(kakaoUser, "분당서울대학교병원", at(today, 4, 14, 0), GENERAL, ReservationStatus.WAITING, null);

        // ==========================================
        // 4. 🔵 CONFIRMED (매니저 배정 완료) → 동행 시작 테스트
        // ==========================================
        saveRes(seoulUser2, "신촌세브란스병원", at(today, 2, 13, 0), GENERAL, ReservationStatus.CONFIRMED, seoulM1);
        saveRes(daeguUser2, "영남대학교병원", at(today, 5, 10, 0), PRECISE, ReservationStatus.CONFIRMED, daeguM1);

        // ==========================================
        // 5. 🟡 IN_PROGRESS (동행 중) → 추가요금 등록 / 리포트 작성 테스트
        // ==========================================
        saveRes(seoulUser1, "서울아산병원", at(today, 0, 9, 0), PRECISE, ReservationStatus.IN_PROGRESS, seoulM1);
        saveRes(daeguUser1, "경북대학교병원", at(today, 0, 10, 0), GENERAL, ReservationStatus.IN_PROGRESS, daeguM1);

        // ==========================================
        // 6. ⚫ COMPLETED (이용 완료) → 리포트 / 리뷰 / 추가요금 / 대리 신청 테스트
        // ==========================================
        // 추가요금 결제 완료 + 리뷰
        Reservation c1 = saveRes(seoulUser1, "삼성서울병원", at(today, -2, 10, 0), GENERAL, ReservationStatus.COMPLETED, seoulM2);
        addExtra(c1, OVERTIME_FEE_PER_30MIN, "기본 시간 30분 초과", true);
        saveReport(c1, null);
        saveReview(c1, 5, "검사 끝날 때까지 문 앞에서 기다려주셔서 감동이었어요.");

        // 다음 진료 일정 있음 → 매니저 대리 신청 테스트
        Reservation c2 = saveRes(seoulUser2, "서울아산병원", at(today, -3, 9, 0), PRECISE, ReservationStatus.COMPLETED, seoulM1);
        saveReport(c2, at(today, 14, 10, 0).toString());
        saveReview(c2, 4, "의사 선생님 말씀을 꼼꼼하게 메모해 주셔서 이해가 잘 됐어요.");

        // 추가요금 미결제 → 고객 추가요금 결제 테스트
        Reservation c3 = saveRes(daeguUser1, "경북대학교병원", at(today, -4, 13, 0), GENERAL, ReservationStatus.COMPLETED, daeguM1);
        addExtra(c3, OVERTIME_FEE_PER_30MIN * 2, "원무과 수납 지연으로 1시간 초과", false);
        saveReport(c3, null);

        // 정산 완료 + 리뷰
        Reservation c4 = saveRes(daeguUser2, "대구파티마병원", at(today, -6, 14, 0), PRECISE, ReservationStatus.COMPLETED, daeguM2);
        saveReport(c4, null);
        saveReview(c4, 5, "다리가 불편했는데 택시 승하차까지 잘 도와주셨습니다.");
        c4.setSettlementStatus("COMPLETED");

        // ==========================================
        // 7. 🔴 CANCELLED (취소)
        // ==========================================
        saveRes(seoulUser2, "한양대학교병원", at(today, -1, 11, 0), GENERAL, ReservationStatus.CANCELLED, null);
        saveRes(daeguUser2, "대구가톨릭대학교병원", at(today, 7, 15, 0), PRECISE, ReservationStatus.CANCELLED, daeguM1);

        // ==========================================
        // 8. 과거 완료 건 (매출 통계 / 정산 / 페이징)
        // ==========================================
        Member[] seoulUsers = {seoulUser1, seoulUser2};
        Member[] daeguUsers = {daeguUser1, daeguUser2};
        for (int i = 7; i <= 36; i += 2) {
            boolean isSeoul = (i % 4 == 3);
            Member user = isSeoul ? seoulUsers[(i / 2) % 2] : daeguUsers[(i / 2) % 2];
            Member manager = isSeoul ? (i % 3 == 0 ? seoulM2 : seoulM1) : (i % 3 == 0 ? daeguM2 : daeguM1);
            String hospital = isSeoul ? "강남세브란스병원" : "대구의료원";
            String category = (i % 5 == 0) ? PRECISE : GENERAL;

            Reservation r = saveRes(user, hospital, at(today, -i, 10, 0), category, ReservationStatus.COMPLETED, manager);
            if (i % 3 == 0) {
                addExtra(r, OVERTIME_FEE_PER_30MIN, "기본 시간 30분 초과", true);
            }
            saveReport(r, null);
            if (i > 14) {
                r.setSettlementStatus("COMPLETED"); // 2주 지난 건은 정산 완료
            }
        }

        System.out.println("✅ [YesCare] 로컬 테스트 데이터 생성 완료 (계정 비밀번호: 1234)");
    }

    // ===================== 편의 메서드 =====================

    private LocalDateTime at(LocalDate base, int plusDays, int hour, int minute) {
        return base.plusDays(plusDays).atTime(hour, minute);
    }

    private Member createMember(String email, String pw, String name, String phone, Role role, String provider,
                                String zipCode, String address, String detailAddress) {
        Member m = Member.builder()
                .email(email)
                .password(pw)
                .name(name)
                .phoneNumber(phone)
                .guardianName(name + " 보호자")
                .guardianPhone("0109" + phone.substring(4))
                .zipCode(zipCode)
                .address(address)
                .detailAddress(detailAddress)
                .role(role)
                .provider(provider)
                .build();
        return memberRepository.save(m);
    }

    /** 매니저 Member + Manager 프로필 생성 후 Member 반환 (예약의 manager는 Member를 참조) */
    private Member createManager(String email, String pw, String name, String phone, String intro, String career,
                                 String cert, String days, String time, String zipCode, String address,
                                 String detailAddress, Role role, Manager.ManagerType type) {
        Member m = createMember(email, pw, name, phone, role, "LOCAL", zipCode, address, detailAddress);
        managerRepository.save(Manager.builder()
                .member(m)
                .introduction(intro)
                .career(career)
                .certifications(cert)
                .availableDays(days)
                .availableTime(time)
                .managerType(type)
                .build());
        return m;
    }

    /** 예약 생성: 요금은 카테고리 기준, 결제는 선결제 완료 상태(시드용 가짜 주문번호) */
    private Reservation saveRes(Member user, String hospital, LocalDateTime time, String category,
                                ReservationStatus status, Member manager) {
        boolean isGeneral = GENERAL.equals(category);

        Reservation res = Reservation.builder()
                .member(user)
                .patientName(user.getName())
                .patientPhone(user.getPhoneNumber())
                .guardianName(user.getGuardianName())
                .guardianPhone(user.getGuardianPhone())
                .hospitalName(hospital)
                .reservationTime(time)
                .category(category)
                .status(status)
                .meetingType("자택")
                .meetingAddress("자택")
                .meetingDetailAddress("")
                .transportation("택시 이용")
                .mobility(isGeneral ? "도보" : "부축 필요")
                .requirements("원무과 접수 시 보호자 대리 서명 부탁드립니다. 낙상에 주의해 주세요.")
                .detailedContent(isGeneral
                        ? "- 진료 과목: 내과\n- 주요 증상: 소화불량 및 복통"
                        : "- 검사 종류: 수면 내시경\n- 금식 여부: 금식 완료")
                .doctorInquiry("최근 약 복용 후 소화 불량 증상과 관련이 있는지 여쭤봐 주세요.")
                .bloodType("A형 (Rh+)")
                .underlyingDisease("고혈압")
                .medication("혈압약 (아침 1회)")
                .preparedDocuments("신분증, 진료의뢰서")
                .baseFee(isGeneral ? GENERAL_FEE : PRECISE_FEE)
                .build();

        seq++;
        res.completePayment("seed_res_" + seq, "seed_pk_" + seq);

        if (manager != null) {
            res.assignManager(manager); // WAITING일 때만 CONFIRMED로 바뀌므로 지정한 status가 유지됨
        }
        return reservationRepository.save(res);
    }

    /** 추가요금 (paid=true면 결제 완료, false면 고객 결제 대기) */
    private void addExtra(Reservation res, int amount, String reason, boolean paid) {
        res.setExtraChargeAmount(amount);
        res.setExtraChargeReason(reason);
        if (paid) {
            seq++;
            res.completeExtraPayment("seed_extra_" + seq, "seed_epk_" + seq);
        }
    }

    /** 동행 리포트 (nextSchedule이 있으면 대리 신청 버튼 테스트 가능) */
    private void saveReport(Reservation res, String nextSchedule) {
        boolean isGeneral = GENERAL.equals(res.getCategory());
        Report report = Report.builder()
                .reservation(res)
                .department(isGeneral ? "내과" : "소화기내과")
                .doctorOpinion(isGeneral
                        ? "위염 소견이 있어 2주간 약 복용 후 경과를 보기로 했습니다."
                        : "수면 내시경 결과 특이 소견 없음. 1년 후 정기 검진 권고.")
                .prescription(isGeneral ? "위장약 처방" : "처방 없음")
                .medicationType(isGeneral ? "알약" : null)
                .medicationTime(isGeneral ? "아침, 저녁 식후 30분" : null)
                .medicationDays(isGeneral ? 14 : null)
                .managerComment("진료 전후 컨디션 양호했고, 귀가까지 안전하게 동행했습니다.")
                .nextSchedule(nextSchedule)
                .imageUrls(new ArrayList<>())
                .patientCondition("good")
                .build();
        reportRepository.save(report);
        res.setReport(report);
        if (nextSchedule == null) {
            res.setNoRevisit(true);
        }
    }

    private void saveReview(Reservation res, int rating, String comment) {
        reviewRepository.save(Review.builder().reservation(res).rating(rating).comment(comment).build());
    }
}
