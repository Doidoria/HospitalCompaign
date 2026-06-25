package com.yescare.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yescare.api.dto.ApiResponse;
import com.yescare.api.dto.ReportRequest;
import com.yescare.api.dto.ReportResponse;
import com.yescare.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
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
    @PreAuthorize("hasAuthority('MANAGER') || hasAuthority('ROLE_MANAGER')")
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
    @PreAuthorize("hasAuthority('MANAGER') || hasAuthority('ROLE_MANAGER')")
    public ApiResponse<Long> update(
            @PathVariable Long id,
            @RequestPart("request") ReportRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        Long updatedId = reportService.updateReport(id, request, images);

        return ApiResponse.success(updatedId);
    }
}