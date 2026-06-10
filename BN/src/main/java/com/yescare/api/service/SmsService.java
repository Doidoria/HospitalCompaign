package com.yescare.api.service;

import jakarta.annotation.PostConstruct;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.*;

@Service
public class SmsService {

    @Value("${coolsms.api.key}")
    private String apiKey;

    @Value("${coolsms.api.secret}")
    private String apiSecret;

    @Value("${coolsms.sender}")
    private String senderNumber;

    private DefaultMessageService messageService;

    // 1. 인증번호 저장소
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();

    // 2. 어뷰징 방어(쿨타임)를 위한 마지막 전송 시간 저장소
    private final Map<String, Long> lastRequestTimes = new ConcurrentHashMap<>();

    // 3. 기존 타이머가 겹치지 않게 관리하는 저장소
    private final Map<String, ScheduledFuture<?>> expiryTasks = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    // 쿨타임 제한 (예: 1분 = 60000 밀리초)
    private static final long COOLDOWN_MILLIS = 60000;

    @PostConstruct
    public void init() {
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

//    public void sendVerificationCode(String phoneNumber) {
//        // 1. 임시로 무조건 '123456'이 나오게 하거나, 랜덤 6자리 생성
//        String code = "123456";
//
//        // 3. 대신 백엔드 실행창(콘솔)에 인증번호를 찍어줍니다.
//        System.out.println("\n=======================================");
//        System.out.println("📱 [가짜 문자 발송] 수신번호: " + phoneNumber);
//        System.out.println("🔑 임시 인증번호: " + code);
//        System.out.println("=======================================\n");
//
//        // 4. 검증 로직을 위해 메모리에는 그대로 저장
//        verificationCodes.put(phoneNumber, code);
//
//        // 3분 뒤 삭제 (그대로 유지)
//        scheduler.schedule(() -> {
//            verificationCodes.remove(phoneNumber);
//        }, 3, TimeUnit.MINUTES);
//    }

    public void sendVerificationCode(String phoneNumber) {
        long currentTime = System.currentTimeMillis();

        // 🚨 [보안] 쿨타임 체크 로직 (1분 내 재요청 방어)
        if (lastRequestTimes.containsKey(phoneNumber)) {
            long timePassed = currentTime - lastRequestTimes.get(phoneNumber);
            if (timePassed < COOLDOWN_MILLIS) {
                long timeLeft = (COOLDOWN_MILLIS - timePassed) / 1000;
                throw new IllegalStateException("인증번호 요청이 너무 잦습니다. " + timeLeft + "초 후에 다시 시도해주세요.");
            }
        }

        String code = String.format("%06d", new Random().nextInt(1000000));

        Message message = new Message();
        message.setFrom(senderNumber);
        message.setTo(phoneNumber);
        message.setText("[예스케어] 본인확인 인증번호는 [" + code + "] 입니다. 3분 내에 입력해주세요.");

        try {
            this.messageService.sendOne(new SingleMessageSendingRequest(message));

            // 발송이 성공해야만 쿨타임 저장
            lastRequestTimes.put(phoneNumber, currentTime);
            verificationCodes.put(phoneNumber, code);

            // 사용자가 재전송을 누른 경우, 예전 타이머 취소 (안 그러면 새 인증번호도 3분 전에 지워짐)
            if (expiryTasks.containsKey(phoneNumber)) {
                expiryTasks.get(phoneNumber).cancel(false);
            }

            // 새로운 3분 타이머 등록
            ScheduledFuture<?> task = scheduler.schedule(() -> {
                verificationCodes.remove(phoneNumber);
                expiryTasks.remove(phoneNumber);
            }, 3, TimeUnit.MINUTES);

            expiryTasks.put(phoneNumber, task);

        } catch (Exception e) {
            System.out.println("SMS 발송 실패: " + e.getMessage());
            throw new RuntimeException("문자 발송 중 오류가 발생했습니다. 번호를 확인해주세요.");
        }
    }

    public boolean verifyCode(String phoneNumber, String code) {
        String savedCode = verificationCodes.get(phoneNumber);
        if (savedCode != null && savedCode.equals(code)) {
            // 인증 성공 시 즉시 데이터 파기 (타이머도 취소하여 메모리 절약)
            verificationCodes.remove(phoneNumber);
            if (expiryTasks.containsKey(phoneNumber)) {
                expiryTasks.get(phoneNumber).cancel(false);
                expiryTasks.remove(phoneNumber);
            }
            return true;
        }
        return false;
    }
}