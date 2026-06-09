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
    private String senderNumber; // 솔라피에 등록된 발신번호

    // 카카오 채널(플러스친구) 연동 시 솔라피에서 발급해주는 고유 PF ID (미리 비워두기)
    private final String PF_ID = "KA0123456789";

    private DefaultMessageService messageService;

    @PostConstruct
    public void init() {
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

    @Async
    public void sendReservationComplete(String phoneNumber, String patientName, String date, String hospitalName) {
        try {
            HashMap<String, String> variables = new HashMap<>();
            variables.put("#{환자명}", patientName);
            variables.put("#{예약일}", date);
            variables.put("#{병원명}", hospitalName);

            KakaoOption kakaoOption = new KakaoOption();
            kakaoOption.setPfId(PF_ID);
            kakaoOption.setTemplateId("TEMPLATE_ID_WAITING_FOR_APPROVAL");
            kakaoOption.setVariables(variables);

            Message message = new Message();
            message.setTo(phoneNumber.replace("-", ""));
            message.setFrom(senderNumber.replace("-", ""));
            message.setKakaoOptions(kakaoOption);
            message.setText("[예스케어] " + patientName + "님의 예약이 접수되었습니다.");

            messageService.sendOne(new SingleMessageSendingRequest(message));
            log.info("✅ 예약 접수 알림톡 발송 성공: {}", phoneNumber);

        } catch (Exception e) {
            log.error("❌ 예약 접수 알림톡 발송 실패 (수신번호: {}): {}", phoneNumber, e.getMessage());
        }
    }

    @Async
    public void sendManagerAssigned(String phoneNumber, String patientName, String managerName, String date) {
        try {
            HashMap<String, String> variables = new HashMap<>();
            variables.put("#{환자명}", patientName);
            variables.put("#{매니저명}", managerName);
            variables.put("#{예약일}", date);

            KakaoOption kakaoOption = new KakaoOption();
            kakaoOption.setPfId(PF_ID);
            kakaoOption.setTemplateId("TEMPLATE_ID_WAITING_FOR_APPROVAL");
            kakaoOption.setVariables(variables);

            Message message = new Message();
            message.setTo(phoneNumber.replace("-", ""));
            message.setFrom(senderNumber.replace("-", ""));
            message.setKakaoOptions(kakaoOption);
            message.setText("[예스케어] " + patientName + "님의 예약에 매니저 배정이 완료되었습니다.");

            messageService.sendOne(new SingleMessageSendingRequest(message));
            log.info("✅ 매니저 배정 알림톡 발송 성공: {}", phoneNumber);

        } catch (Exception e) {
            log.error("❌ 매니저 배정 알림톡 발송 실패: {}", e.getMessage());
        }
    }

    @Async
    public void sendReportCompleted(String phoneNumber, String patientName) {
        try {
            HashMap<String, String> variables = new HashMap<>();
            variables.put("#{환자명}", patientName);
            variables.put("#{마이페이지링크}", "https://yescare.com/mypage");

            KakaoOption kakaoOption = new KakaoOption();
            kakaoOption.setPfId(PF_ID);
            kakaoOption.setTemplateId("TEMPLATE_ID_WAITING_FOR_APPROVAL");
            kakaoOption.setVariables(variables);

            Message message = new Message();
            message.setTo(phoneNumber.replace("-", ""));
            message.setFrom(senderNumber.replace("-", ""));
            message.setKakaoOptions(kakaoOption);
            message.setText("[예스케어] " + patientName + "님의 케어 리포트 작성이 완료되었습니다.");

            messageService.sendOne(new SingleMessageSendingRequest(message));
            log.info("✅ 케어 리포트 알림톡 발송 성공: {}", phoneNumber);

        } catch (Exception e) {
            log.error("❌ 케어 리포트 알림톡 발송 실패: {}", e.getMessage());
        }
    }
}