package com.yescare.api.service;

import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class SmsService {

    @Value("${coolsms.api.key}")
    private String apiKey;

    @Value("${coolsms.api.secret}")
    private String apiSecret;

    @Value("${coolsms.sender}")
    private String senderNumber;

    private DefaultMessageService messageService;

    // 인증번호를 임시 저장할 메모리 저장소 (Key: 전화번호, Value: 인증번호)
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

    public void sendVerificationCode(String phoneNumber) {
        // 1. 임시로 무조건 '123456'이 나오게 하거나, 랜덤 6자리 생성
        String code = "123456";

        // 3. 대신 백엔드 실행창(콘솔)에 인증번호를 찍어줍니다.
        System.out.println("\n=======================================");
        System.out.println("📱 [가짜 문자 발송] 수신번호: " + phoneNumber);
        System.out.println("🔑 임시 인증번호: " + code);
        System.out.println("=======================================\n");

        // 4. 검증 로직을 위해 메모리에는 그대로 저장
        verificationCodes.put(phoneNumber, code);

        // 3분 뒤 삭제 (그대로 유지)
        Executors.newSingleThreadScheduledExecutor().schedule(() -> {
            verificationCodes.remove(phoneNumber);
        }, 3, TimeUnit.MINUTES);
    }

//    public void sendVerificationCode(String phoneNumber) {
//        String code = String.format("%06d", new Random().nextInt(999999));
//
//        Message message = new Message();
//        message.setFrom(senderNumber);
//        message.setTo(phoneNumber);
//        message.setText("[예스케어] 본인확인 인증번호는 [" + code + "] 입니다. 3분 내에 입력해주세요.");
//
//        try {
//            // 실제 솔라피 서버로 전송
//            this.messageService.sendOne(new SingleMessageSendingRequest(message));
//        } catch (Exception e) {
//            System.out.println("SMS 발송 실패: " + e.getMessage());
//            throw new RuntimeException("문자 발송 중 오류가 발생했습니다.");
//        }
//
//        // 3. 검증을 위해 메모리에 저장
//        verificationCodes.put(phoneNumber, code);
//
//        // 4. 3분 뒤 삭제 로직 유지
//        Executors.newSingleThreadScheduledExecutor().schedule(() -> {
//            verificationCodes.remove(phoneNumber);
//        }, 3, TimeUnit.MINUTES);
//    }

    // 2. 인증번호 검증
    public boolean verifyCode(String phoneNumber, String code) {
        String savedCode = verificationCodes.get(phoneNumber);
        if (savedCode != null && savedCode.equals(code)) {
            verificationCodes.remove(phoneNumber); // 인증 성공 시 즉시 삭제
            return true;
        }
        return false;
    }
}