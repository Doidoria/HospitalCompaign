package com.yescare.api.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendCareReport(String toEmail, String patientName, String hospitalName, String content, MultipartFile pdfFile) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("[예스케어] " + patientName + "님의 진료 동행 리포트가 도착했습니다.");
            helper.setText(patientName + "님, 안녕하세요.\n\n" + hospitalName + "에서 진행된 진료 동행 결과 리포트를 첨부해 드립니다.\n\n[진료 요약]\n" + content);

            // PDF 첨부파일이 넘어왔을 경우에만 메일에 첨부
            if (pdfFile != null && !pdfFile.isEmpty()) {
                helper.addAttachment(patientName + "_케어리포트.pdf", new ByteArrayResource(pdfFile.getBytes()));
            }

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("이메일 전송에 실패했습니다.", e);
        }
    }
}