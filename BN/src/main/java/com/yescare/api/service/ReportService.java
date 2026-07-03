package com.yescare.api.service;

import com.yescare.api.domain.Report;
import com.yescare.api.domain.Reservation;
import com.yescare.api.dto.ReportRequest;
import com.yescare.api.dto.ReportResponse;
import com.yescare.api.repository.ReportRepository;
import com.yescare.api.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReservationRepository reservationRepository;
    private final EmailService emailService;
    private final KakaoAlimtalkService kakaoAlimtalkService;
    private final FileStorageService fileStorageService;
    private final TemplateEngine templateEngine;

    @Transactional
    public Long createReport(ReportRequest request, List<MultipartFile> images) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("예약 정보를 찾을 수 없습니다."));

        if (request.getNoNextSchedule() != null && request.getNoNextSchedule()) {
            reservation.setNoRevisit(true);
        } else {
            reservation.setNoRevisit(false);
        }

        // 1. 이미지 업로드 및 저장
        List<String> uploadedImageUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    String url = fileStorageService.uploadFile(image);
                    uploadedImageUrls.add(url);
                }
            }
        }

        Report report = reportRepository.findByReservationId(reservation.getId()).orElse(null);

        if (report != null) {
            report.updateReport(
                    request.getDepartment(), request.getDoctorOpinion(), request.getPrescription(),
                    request.getMedicationType(), request.getMedicationTime(), request.getMedicationDays(),
                    request.getManagerComment(), request.getNextSchedule(), uploadedImageUrls, request.getPatientCondition()
            );
        } else {
            report = Report.builder()
                    .reservation(reservation).department(request.getDepartment()).doctorOpinion(request.getDoctorOpinion())
                    .prescription(request.getPrescription()).medicationType(request.getMedicationType())
                    .medicationTime(request.getMedicationTime()).medicationDays(request.getMedicationDays())
                    .managerComment(request.getManagerComment()).nextSchedule(request.getNextSchedule())
                    .imageUrls(uploadedImageUrls).patientCondition(request.getPatientCondition())
                    .build();
        }

        reservation.completeAccompany();
        reservation.setReport(report);
        reportRepository.save(report);

        // 2. 백엔드 내부에서 PDF 자동 생성 로직 실행
        byte[] pdfBytes = generatePdfBytes(report, uploadedImageUrls);

        // 3. 후속 전송 로직 수행
        emailService.sendCareReport(
                reservation.getMember().getEmail(), reservation.getMember().getName(),
                reservation.getHospitalName(), request.getDoctorOpinion(), pdfBytes, false
        );

        kakaoAlimtalkService.sendReportCompleted(
                reservation.getMember().getPhoneNumber(), reservation.getMember().getName(), reservation.getMember().getEmail()
        );
        return report.getId();
    }

    @Transactional
    public Long updateReport(Long reportId, ReportRequest request, List<MultipartFile> images) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("해당 리포트를 찾을 수 없습니다."));

        Reservation reservation = report.getReservation();
        reservation.completeAccompany();

        if (request.getNoNextSchedule() != null && request.getNoNextSchedule()) {
            reservation.setNoRevisit(true);
        } else {
            reservation.setNoRevisit(false);
        }

        report.setModified(true);

        List<String> finalImageUrls = new ArrayList<>();

        // 프론트엔드에서 지우지 않고 남겨둔 기존 사진 URL 먼저 담기
        if (request.getRetainedImages() != null) {
            finalImageUrls.addAll(request.getRetainedImages());
        }

        // 새로 추가된 사진 업로드 후 담기
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    String url = fileStorageService.uploadFile(image);
                    finalImageUrls.add(url);
                }
            }
        }

        report.updateReport(
                request.getDepartment(), request.getDoctorOpinion(), request.getPrescription(),
                request.getMedicationType(), request.getMedicationTime(), request.getMedicationDays(),
                request.getManagerComment(), request.getNextSchedule(), finalImageUrls, request.getPatientCondition()
        );

        // 수정본 PDF 내부 자동 재생성
        byte[] pdfBytes = generatePdfBytes(report, report.getImageUrls());

        emailService.sendCareReport(
                reservation.getMember().getEmail(), reservation.getMember().getName(),
                reservation.getHospitalName(), request.getDoctorOpinion(), pdfBytes, true
        );

        kakaoAlimtalkService.sendReportModified(
                reservation.getMember().getEmail(), reservation.getMember().getPhoneNumber(), reservation.getMember().getName()
        );

        return report.getId();
    }

    // HTML 템플릿 컴파일 및 PDF 바이너리 변환 헬퍼 메서드
    private byte[] generatePdfBytes(Report report, List<String> images) {
        try {
            Context context = new Context();

            // 1. 날짜 한글 포맷 변환 (예: 2026년 06월 25일 14시 30분)
            java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH시 mm분");
            String formattedDate = report.getReservation().getReservationTime().format(dtf);

            // 2. 환자 컨디션 한글 변환
            String rawCond = report.getPatientCondition();
            String krCond = "보통 😐";
            if ("good".equalsIgnoreCase(rawCond)) krCond = "좋음 😊";
            else if ("bad".equalsIgnoreCase(rawCond)) krCond = "저하 😥";

            // 3. 다음 일정 포맷 변환
            String formattedNext = "";
            if (report.getNextSchedule() != null && !report.getNextSchedule().isEmpty()) {
                try {
                    java.time.LocalDateTime nextDt = java.time.LocalDateTime.parse(report.getNextSchedule());
                    formattedNext = nextDt.format(dtf);
                } catch (Exception e) {
                    formattedNext = report.getNextSchedule(); // 파싱 실패 시 원본 유지
                }
            }

            context.setVariable("date", formattedDate);
            context.setVariable("patientCondition", krCond); // 한글 적용
            context.setVariable("nextSchedule", formattedNext); // 한글 적용
            context.setVariable("patientName", report.getReservation().getPatientName());
            context.setVariable("hospitalName", report.getReservation().getHospitalName());
            context.setVariable("department", report.getDepartment());
            context.setVariable("doctorOpinion", report.getDoctorOpinion());
            context.setVariable("medicationType", report.getMedicationType());
            context.setVariable("medicationTime", report.getMedicationTime());
            context.setVariable("medicationDays", report.getMedicationDays());
            context.setVariable("prescription", report.getPrescription());
            context.setVariable("managerComment", report.getManagerComment());

            List<String> base64Images = new ArrayList<>();
            for (String img : images) {
                try {
                    // 외부 S3 링크면 그대로 사용, 로컬이면 파일 읽어서 Base64 인코딩
                    if (img.startsWith("http")) {
                        base64Images.add(img);
                    } else {
                        String fileName = img.replace("/uploads/", "");
                        Path imagePath = Paths.get("uploads", fileName);
                        if (Files.exists(imagePath)) {
                            byte[] fileBytes = Files.readAllBytes(imagePath);
                            String base64Data = Base64.getEncoder().encodeToString(fileBytes);
                            String mimeType = Files.probeContentType(imagePath);
                            if (mimeType == null) mimeType = "image/jpeg";
                            // 데이터 URI 스킴으로 조립
                            base64Images.add("data:" + mimeType + ";base64," + base64Data);
                        }
                    }
                } catch (Exception e) {
                    System.out.println("PDF 이미지 인코딩 실패: " + img);
                }
            }
            context.setVariable("imageUrls", base64Images);

            // Thymeleaf Engine으로 HTML 문자열 생성
            String htmlContent = templateEngine.process("pdf/care-report", context);

            // Flying Saucer를 활용한 PDF 바이너리 출력
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();

            // EC2 서버에 업로드한 폰트의 절대 경로 지정
            String fontPath = "/home/ubuntu/fonts/malgun.ttf";
            renderer.getFontResolver().addFont(fontPath, com.lowagie.text.pdf.BaseFont.IDENTITY_H, com.lowagie.text.pdf.BaseFont.EMBEDDED);

            renderer.setDocumentFromString(htmlContent);
            renderer.layout();
            renderer.createPDF(outputStream);

            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("백엔드 PDF 리포트 생성에 실패했습니다.", e);
        }
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportByReservation(Long reservationId) {
        Report report = reportRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("해당 예약에 대한 리포트가 없습니다."));
        return new ReportResponse(report);
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportByReservationId(Long reservationId) {
        return reportRepository.findByReservationId(reservationId)
                .map(ReportResponse::new)
                .orElse(null);
    }
}