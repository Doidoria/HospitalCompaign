package com.yescare.api.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final ConcurrentHashMap<String, String> emailAuthMap = new ConcurrentHashMap<>();

    @Async
    public void sendCareReport(String toEmail, String patientName, String hospitalName, String content, MultipartFile pdfFile, boolean isModified) {
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
            if (pdfFile != null && !pdfFile.isEmpty()) {
                helper.addAttachment(patientName + "_케어리포트.pdf", new ByteArrayResource(pdfFile.getBytes()));
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

            // 실무 팁: 3분 뒤 만료 로직이 필요하다면 Redis의 TTL을 사용하는 것이 가장 좋습니다.
        } catch (Exception e) {
            throw new RuntimeException("이메일 인증번호 전송에 실패했습니다.", e);
        }
    }

    public boolean verifyCode(String email, String code) {
        String savedCode = emailAuthMap.get(email);
        if (savedCode != null && savedCode.equals(code)) {
            emailAuthMap.remove(email); // 인증 성공 시 메모리에서 삭제
            return true;
        }
        return false;
    }
}