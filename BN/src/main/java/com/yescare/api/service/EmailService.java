package com.yescare.api.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final ConcurrentHashMap<String, String> emailAuthMap = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1); // 3분 뒤 삭제를 실행할 스케줄러

    @Async
    public void sendCareReport(String toEmail, String patientName, String hospitalName, String content, byte[] pdfBytes, boolean isModified) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("wellcommunity982@gmail.com", "예스케어");
            helper.setTo(toEmail);

            // (isModified)에 따라 이메일 제목 분기 처리
            String subject = isModified
                    ? "[예스케어] [재전송] " + patientName + "님의 진료 동행 리포트가 수정되어 다시 도착했습니다."
                    : "[예스케어] " + patientName + "님의 진료 동행 리포트가 도착했습니다.";
            helper.setSubject(subject);

            // (isModified)에 따라 이메일 본문 내용 분기 처리
            String text = isModified
                    ? patientName + "님, 안녕하세요.\n\n" + hospitalName + "에서 진행된 진료 동행 리포트 내용이 수정되어 재전송해 드립니다.\n\n[수정된 진료 요약]\n" + content
                    : patientName + "님, 안녕하세요.\n\n" + hospitalName + "에서 진행된 진료 동행 결과 리포트를 첨부해 드립니다.\n\n[진료 요약]\n" + content;
            helper.setText(text);

            // PDF 첨부파일이 넘어왔을 경우에만 메일에 첨부
            if (pdfBytes != null && pdfBytes.length > 0) {
                helper.addAttachment(patientName + "_케어리포트.pdf", new ByteArrayResource(pdfBytes));
            }

            mailSender.send(message);
        } catch (Exception e) {
            log.error("이메일 발송 완벽 실패 원인: ", e);
            throw new RuntimeException("이메일 전송에 실패했습니다.", e);
        }
    }

    @Async
    public void sendVerificationCode(String toEmail) {
        String code = String.format("%06d", new Random().nextInt(1000000));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("[예스케어] 회원가입 이메일 인증번호");
            helper.setText("예스케어 회원가입 이메일 인증번호는 [" + code + "] 입니다. 3분 내에 입력해 주세요.");

            mailSender.send(message);
            emailAuthMap.put(toEmail, code); // 발송 후 맵에 저장

            // 3분(180초) 뒤에 Map에서 해당 이메일의 인증번호를 자동 삭제 (메모리 누수 및 만료 처리)
            scheduler.schedule(() -> {
                emailAuthMap.remove(toEmail);
            }, 3, TimeUnit.MINUTES);

        } catch (Exception e) {
            throw new RuntimeException("이메일 인증번호 전송에 실패했습니다.", e);
        }
    }

    // 인증 성공 시 재사용 방지를 위해 즉시 삭제 로직
    public boolean verifyCode(String email, String code) {
        String savedCode = emailAuthMap.get(email);
        if (savedCode != null && savedCode.equals(code)) {
            emailAuthMap.remove(email); // 인증 통과 즉시 파기!
            return true;
        }
        return false;
    }
}