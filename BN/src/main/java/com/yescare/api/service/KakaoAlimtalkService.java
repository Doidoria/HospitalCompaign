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

    // 🚀 application.yml에서 ID 값들을 주입받음 (하드코딩 제거!)
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
    @Value("${coolsms.kakao.template.report-completed}")
    private String tplReportCompleted;
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

    // 1. 예약 접수 완료 (제공된 변수 적용: #{환자명}, #{예약일시}, #{병원명})
    @Async
    public void sendReservationComplete(String phoneNumber, String patientName, String datetime, String hospitalName) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{환자명}", patientName);
        variables.put("#{예약일시}", datetime);
        variables.put("#{병원명}", hospitalName);

        String text = "[예스케어] " + patientName + "님의 예약이 정상 접수되었습니다.";
        sendAlimtalk(phoneNumber, text, tplReservationComplete, variables);
    }

    // 2. 매니저 배정 완료 (제공된 변수 적용: #{환자명}, #{예약일시}, #{매니저명})
    @Async
    public void sendManagerAssigned(String phoneNumber, String patientName, String managerName, String datetime) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{환자명}", patientName);
        variables.put("#{매니저명}", managerName);
        variables.put("#{예약일시}", datetime);

        String text = "[예스케어] " + patientName + "님의 동행 매니저가 배정되었습니다.";
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

    // 4. 회원가입 환영 알림 (제공된 변수 적용: #{고객명})
    @Async
    public void sendJoinComplete(String phoneNumber, String customerName) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);

        String text = "[예스케어] " + customerName + "님, 예스케어의 회원이 되신 것을 환영합니다!";
        sendAlimtalk(phoneNumber, text, tplJoinComplete, variables);
    }

    // 5. 케어 리포트 작성 완료 (제공된 변수 적용: #{환자명})
    @Async
    public void sendReportCompleted(String phoneNumber, String patientName) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{환자명}", patientName);

        String text = "[예스케어] " + patientName + "님의 케어 리포트 작성이 완료되었습니다. 마이페이지에서 확인해 주세요.";
        sendAlimtalk(phoneNumber, text, tplReportCompleted, variables);
    }

    // 6. 동행 시작 알림 (변수: #{고객명}, #{환자명}, #{매니저명}, #{출발시간})
    @Async
    public void sendAccompanyStarted(String phoneNumber, String customerName, String patientName, String managerName, String startTime) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{환자명}", patientName);
        variables.put("#{매니저명}", managerName);
        variables.put("#{출발시간}", startTime);

        String text = "[예스케어] " + customerName + "님, 예약하신 병원 동행 서비스가 시작되었습니다.";
        sendAlimtalk(phoneNumber, text, tplAccompanyStarted, variables);
    }

    // 7. 동행 종료 및 리포트 안내 (변수: #{고객명}, #{환자명}, #{고객이메일})
    @Async
    public void sendAccompanyCompleted(String phoneNumber, String customerName, String patientName, String customerEmail) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{환자명}", patientName);
        variables.put("#{고객이메일}", customerEmail);

        String text = "[예스케어] " + customerName + "님, 동행 서비스가 안전하게 종료되었습니다.";
        sendAlimtalk(phoneNumber, text, tplAccompanyCompleted, variables);
    }

    // 8. 추가 요금 안내 (변수: #{고객명}, #{추가요금}, #{사유})
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

    // 동행 리포트 수정 안내 (변수: #{고객명}, #{환자명})
    @Async
    public void sendReportModified(String phoneNumber, String customerName, String patientName) {
        HashMap<String, String> variables = new HashMap<>();
        variables.put("#{고객명}", customerName);
        variables.put("#{환자명}", patientName);

        String text = "[예스케어] " + customerName + "님, 발송해 드린 " + patientName + "님의 동행 리포트 내용이 수정되었습니다.";
        sendAlimtalk(phoneNumber, text, tplReportModified, variables); // (tpl은 yml에 등록될 새 ID)
    }
}