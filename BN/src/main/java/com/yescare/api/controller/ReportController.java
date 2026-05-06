package com.yescare.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yescare.api.dto.ReportRequest;
import com.yescare.api.dto.ReportResponse;
import com.yescare.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('MANAGER') || hasAuthority('ROLE_MANAGER')")
    public ResponseEntity<Long> create(
            @RequestPart("request") ReportRequest request,
            @RequestPart(value = "pdfFile", required = false) MultipartFile pdfFile
    ) {
        return ResponseEntity.ok(reportService.createReport(request, pdfFile));
    }

    @GetMapping("/reservation/{reservationId}")
    // 리포트 조회는 유저(내 리포트), 매니저(내가 쓴 리포트), 관리자(전체 모니터링) 모두 가능해야 하므로 기본 인증만 유지
    public ResponseEntity<ReportResponse> getReportDetail(@PathVariable Long reservationId) {
        return ResponseEntity.ok(reportService.getReportByReservationId(reservationId));
    }
}