package com.yescare.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yescare.api.dto.ApiResponse;
import com.yescare.api.dto.ReportRequest;
import com.yescare.api.dto.ReportResponse;
import com.yescare.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('MANAGER', 'MANAGER_PRO', 'MANAGER_FREE', 'ADMIN')")
    public ApiResponse<Long> create(
            @RequestPart("request") ReportRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        return ApiResponse.success(reportService.createReport(request, images));
    }

    @GetMapping("/reservation/{reservationId}")
    public ApiResponse<ReportResponse> getReportDetail(@PathVariable Long reservationId) {
        return ApiResponse.success(reportService.getReportByReservationId(reservationId));
    }

    // 기존 리포트 수정 및 재전송 (PUT 요청 처리)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('MANAGER', 'MANAGER_PRO', 'MANAGER_FREE', 'ADMIN')")
    public ApiResponse<Long> update(
            @PathVariable Long id,
            @RequestPart("request") ReportRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        Long updatedId = reportService.updateReport(id, request, images);

        return ApiResponse.success(updatedId);
    }

    // PDF 파일 다운로드 API
    @GetMapping(value = "/pdf/{reservationId}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long reservationId) {
        byte[] pdfBytes = reportService.downloadPdf(reservationId);

        return ResponseEntity.ok()
                // 브라우저가 파일을 다운로드 창으로 띄우도록 헤더 설정
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"care-report.pdf\"")
                .body(pdfBytes);
    }
}