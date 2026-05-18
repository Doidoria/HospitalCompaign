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

    public void sendCareReport(String toEmail, String patientName, String hospitalName, String content, MultipartFile pdfFile, boolean isModified) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

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
            throw new RuntimeException("이메일 전송에 실패했습니다.", e);
        }
    }
}