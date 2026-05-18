package com.yescare.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yescare.api.dto.ApiResponse; // 💡 ApiResponse 추가
import com.yescare.api.dto.ReportRequest;
import com.yescare.api.dto.ReportResponse;
import com.yescare.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('MANAGER') || hasAuthority('ROLE_MANAGER')")
    public ApiResponse<Long> create(
            @RequestPart("request") ReportRequest request,
            @RequestPart(value = "pdfFile", required = false) MultipartFile pdfFile
    ) {
        return ApiResponse.success(reportService.createReport(request, pdfFile));
    }

    @GetMapping("/reservation/{reservationId}")
    public ApiResponse<ReportResponse> getReportDetail(@PathVariable Long reservationId) {
        return ApiResponse.success(reportService.getReportByReservationId(reservationId));
    }

    // 기존 리포트 수정 및 재전송 (PUT 요청 처리)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('MANAGER') || hasAuthority('ROLE_MANAGER')")
    public ApiResponse<Long> update(
            @PathVariable Long id,
            @RequestPart("request") ReportRequest request,
            @RequestPart(value = "pdfFile", required = false) MultipartFile pdfFile
    ) {
        // 기존 리포트를 찾아서 내용을 덮어씌우고 ID를 반환합니다.
        Long updatedId = reportService.updateReport(id, request, pdfFile);
        return ApiResponse.success(updatedId);
    }
}