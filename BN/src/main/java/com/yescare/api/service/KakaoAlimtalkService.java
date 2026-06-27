package com.yescare.api.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.KakaoOption;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;

@Slf4j
@Service
public class KakaoAlimtalkService {

    @Value("${coolsms.api.key}")
    private String apiKey;
    @Value("${coolsms.api.secret}")
    private String apiSecret;
    @Value("${coolsms.sender}")
    private String senderNumber;

    // application.yml에서 ID 값들을 주입
    @Value("${coolsms.kakao.pf-id}")
    private String pfId;
    @Value("${coolsms.kakao.template.reservation-complete}")
    private String tplReservationComplete;
    @Value("${coolsms.kakao.template.manager-assigned}")
    private String tplManagerAssigned;
    @Value("${coolsms.kakao.template.inquiry-answered}")
    private String tplInquiryAnswered;
    @Value("${coolsms.kakao.template.join-complete}")
    private String tplJoinComplete;
    @Value("${coolsms.kakao.template.reservation-changed-or-canceled}")
    private String tplReservationChangedOrCanceled;
    @Value("${coolsms.kakao.template.accompany-started}")
    private String tplAccompanyStarted;
    @Value("${coolsms.kakao.template.accompany-completed}")
    private String tplAccompanyCompleted;
    @Value("${coolsms.kakao.template.extra-charge}")
    private String tplExtraCharge;
    @Value("${coolsms.kakao.template.extra-charge-modified}")
    private String tplExtraChargeModified;
    @Value("${coolsms.kakao.template.report-modified}")
    private String tplReportModified;
    @Value("${coolsms.kakao.template.report-completed}")
    private String tplReportCompleted;
    @Value("${coolsms.kakao.template.proxy-reservation-complete}")
    private String tplProxyReservationComplete;
    @Value("${coolsms.kakao.template.manager-new-schedule}")
    private String tplManagerNewSchedule;

    private DefaultMessageService messageService;

    @PostConstruct
    public void init() {
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

    // 공통 알림톡 발송 모듈
    private void sendAlimtalk(String to, String text, String templateId, HashMap<String, String> variables) {
        try {
            KakaoOption kakaoOption = new KakaoOption();
            kakaoOption.setPfId(pfId); // yml에서 가져온 진짜 채널 ID
            kakaoOption.setTemplateId(templateId); // yml에서 가져온 진짜 템플릿 ID
            kakaoOption.setVariables(variables);

            Message message = new Message();
            message.setTo(to.replace("-", ""));
            message.setFrom(senderNumber.replace("-", ""));
            message.setKakaoOptions(kakaoOption);
            message.setText(text); // 카카오톡 실패 시 대체 발송될 문자(SMS) 내용

            messageService.sendOne(new SingleMessageSendingRequest(message));
            log.info("✅ 알림톡 API 전송 완료 (템플릿: {}, 수신자: {})", templateId, to);
        } catch (Exception e) {
            log.error("❌ 알림톡 API 전송 실패 (수신자: {}): {}", to, e.getMessage());
        }
    }

    // 1. 예약 접수 완료 (제공된 변수 적용: #{고객명}, #{예약일시}, #{병원명})
    @Async
    public void sendReservationComplete(String phoneNumber, String customerName, String datetime, String hospitalName) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{예약일시}", datetime);
        variables.put("#{병원명}", hospitalName);

        String text = "[예스케어] " + customerName + "님의 예약이 정상 접수되었습니다.";
        sendAlimtalk(phoneNumber, text, tplReservationComplete, variables);
    }

    // 2. 매니저 배정 완료 (제공된 변수 적용: #{고객명}, #{예약일시}, #{매니저명}, #{주소})
    @Async
    public void sendManagerAssigned(String phoneNumber, String customerName, String managerName, String datetime, String meetingPoint) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{매니저명}", managerName);
        variables.put("#{예약일시}", datetime);
        variables.put("#{주소}", meetingPoint);

        String text = "[예스케어] " + customerName + "님의 동행 매니저가 배정되었습니다.\n" +
                "- 매니저: " + managerName + "\n" +
                "- 예약일시: " + datetime + "\n" +
                "- 만나는 장소: " + meetingPoint;

        sendAlimtalk(phoneNumber, text, tplManagerAssigned, variables);
    }

    // 3. 1:1 문의 답변 완료 (제공된 변수 적용: #{고객명}, #{문의제목})
    @Async
    public void sendInquiryAnswered(String phoneNumber, String customerName, String title) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{문의제목}", title);

        String text = "[예스케어] " + customerName + "님, 문의하신 내역에 답변이 등록되었습니다.";
        sendAlimtalk(phoneNumber, text, tplInquiryAnswered, variables);
    }

    // 4. 회원가입 환영 알림
    @Async
    public void sendJoinComplete(String phoneNumber, String customerName, String joinDate, String userId) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{가입일시}", joinDate);
        variables.put("#{아이디}", userId);

        String text = "[예스케어] " + customerName + "님, 예스케어의 회원이 되신 것을 환영합니다!\n" +
                "- 가입일시 : " + joinDate + "\n" +
                "- 아이디 : " + userId;

        sendAlimtalk(phoneNumber, text, tplJoinComplete, variables);
    }

    // 5. 예약 변경 및 취소 안내
    @Async
    public void sendReservationChangedOrCanceled(String phoneNumber, String customerName, String changeDetails, String reason) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{변경사항}", changeDetails);
        variables.put("#{취소사유}", reason);

        // 템플릿 검수용 가이드 텍스트 빌드
        String text = "[예스케어] " + customerName + "님, 요청하신 예약 건이 정상 처리되었습니다.\n" +
                "■ 처리 내역\n" +
                "변경/취소 사항: " + changeDetails + "\n" +
                "상세 사유: " + reason;

        // 알림톡 전송 요청 트리거
        sendAlimtalk(phoneNumber, text, tplReservationChangedOrCanceled, variables);
        log.info("🔔 [알림톡 발송] 예약 변경/취소 알림톡 전송 완료 -> 수신처: {}", phoneNumber);
    }

    // 6. 동행 시작 알림 (변수: #{고객명}, #{매니저명}, #{출발시간})
    @Async
    public void sendAccompanyStarted(String phoneNumber, String customerName, String managerName, String startTime) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{매니저명}", managerName);
        variables.put("#{출발시간}", startTime);

        String text = "[예스케어] " + customerName + "님, 예약하신 병원 동행 서비스가 시작되었습니다.";
        sendAlimtalk(phoneNumber, text, tplAccompanyStarted, variables);
    }

    // 7. 동행 종료 안내
    @Async
    public void sendAccompanyCompleted(String phoneNumber, String customerName) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);

        String text = "[예스케어] " + customerName + "님, 오늘의 병원 동행 서비스가 안전하게 종료되었습니다.\n" +
                "매니저가 작성 중인 '동행 리포트'는 완료되는 대로 곧 발송해 드리겠습니다.";
        sendAlimtalk(phoneNumber, text, tplAccompanyCompleted, variables);
    }

    // 동행 리포트 완료 안내 (변수: #{고객명}, #{고객이메일})
    @Async
    public void sendReportCompleted(String phoneNumber, String customerName, String customerEmail) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{고객이메일}", customerEmail);

        String text = "[예스케어] " + customerName + "님, 신청하신 서비스의 '동행 리포트' 작성이 완료되었습니다.\n" +
                "- 리포트 발송 이메일: " + customerEmail;
        // (주의: 클래스 상단에 @Value("${coolsms.kakao.template.report-completed}") private String tplReportCompleted; 도 한 줄 주입해 주세요!)
        sendAlimtalk(phoneNumber, text, tplReportCompleted, variables);
    }

    // 동행 리포트 수정 안내 (변수: #{고객명}, #{고객명})
    @Async
    public void sendReportModified(String phoneNumber, String customerName, String customerEmail) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);

        String text = "[예스케어] " + customerName + "님, 발송해 드린 동행 리포트 내용이 일부 수정되어 재안내해 드립니다.\n" +
                "- 리포트 발송 이메일: " + customerEmail;
        sendAlimtalk(phoneNumber, text, tplReportModified, variables);
    }

    // 추가 요금 안내 (변수: #{고객명}, #{추가요금}, #{사유})
    @Async
    public void sendExtraChargeNotification(String phoneNumber, String customerName, Integer extraCharge, String reason) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{추가요금}", String.format("%,d", extraCharge)); // 15,000 처럼 콤마 자동 생성
        variables.put("#{사유}", reason);

        String text = "[예스케어] " + customerName + "님, 동행 서비스 추가 요금 결제 안내입니다.";
        sendAlimtalk(phoneNumber, text, tplExtraCharge, variables);
    }

    // 추가 요금 정정 안내 (변수: #{고객명}, #{추가요금}, #{사유})
    @Async
    public void sendExtraChargeModified(String phoneNumber, String customerName, Integer extraCharge, String reason) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{추가요금}", String.format("%,d", extraCharge));
        variables.put("#{사유}", reason);

        String text = "[예스케어] " + customerName + "님, 청구된 추가 요금 내역이 정정되었습니다.";
        sendAlimtalk(phoneNumber, text, tplExtraChargeModified, variables); // (tpl은 yml에 등록될 새 ID)
    }

    // 대리 신청 접수 완료 안내
    @Async
    public void sendProxyReservationComplete(String phoneNumber, String customerName, String datetime, String hospitalName) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{예약일시}", datetime);
        variables.put("#{병원명}", hospitalName);

        // 카톡 실패 시 발송될 대체 문자(SMS/LMS) 세팅
        String text = "[예스케어] 안녕하세요, " + customerName + "님.\n" +
                "고객님(또는 환자님)께서 현장에서 직접 요청하신 다음 병원 진료 동행 서비스 예약이 정상적으로 대리 접수되었습니다.\n\n" +
                "■ 다음 예약 정보\n" +
                "예약일시: " + datetime + "\n" +
                "방문병원: " + hospitalName + "\n\n" +
                "상세 접수 내역 및 결제 정보는 예스케어 마이페이지에서 확인하실 수 있습니다. 다시 한번 예스케어를 믿고 찾아주셔서 감사합니다.";

        sendAlimtalk(phoneNumber, text, tplProxyReservationComplete, variables);
        log.info("🔔 [알림톡 발송] 대리 신청 완료 알림톡 전송 -> 수신처: {}", phoneNumber);
    }

    // 매니저 배정 안내
    @Async
    public void sendManagerNewSchedule(String managerPhoneNumber, String managerName, String customerName, String datetime, String hospitalName) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{매니저명}", managerName);
        variables.put("#{고객명}", customerName);
        variables.put("#{예약일시}", datetime);
        variables.put("#{병원명}", hospitalName);

        String text = "[예스케어] " + managerName + " 매니저님, 새로운 병원 동행 일정이 배정되었습니다.\n" +
                "- 예약자(환자): " + customerName + "\n" +
                "- 동행일시: " + datetime + "\n" +
                "- 방문병원: " + hospitalName + "\n\n" +
                "상세 요청사항은 매니저 대시보드에서 확인해 주세요.";

        // 매니저 휴대폰 번호로 발송
        sendAlimtalk(managerPhoneNumber, text, tplManagerNewSchedule, variables);
        log.info("🔔 [알림톡 발송] 매니저 신규 배정 알림톡 전송 완료 -> 매니저: {}", managerName);
    }
}