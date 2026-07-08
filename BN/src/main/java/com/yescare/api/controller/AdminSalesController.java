package com.yescare.api.controller;

import com.yescare.api.dto.AdminSalesResponse;
import com.yescare.api.dto.ApiResponse;
import com.yescare.api.service.SalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/sales")
@RequiredArgsConstructor
public class AdminSalesController {

    private final SalesService salesService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminSalesResponse>> getSalesStatistics(
            @RequestParam(defaultValue = "MONTH") String period,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        // 서비스 호출 시 4개의 파라미터 전달
        AdminSalesResponse response = salesService.getSalesStatistics(period, keyword, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 1. 추가 요금 조정 (PATCH)
    @org.springframework.web.bind.annotation.PatchMapping("/{id}/extra-fee")
    public ResponseEntity<ApiResponse<Void>> updateExtraFee(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestParam int extraFee) {
        salesService.updateExtraFee(id, extraFee);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // 2. 전체 환불 및 0원 처리 (PATCH 또는 POST)
    @org.springframework.web.bind.annotation.PatchMapping("/{id}/refund")
    public ResponseEntity<ApiResponse<Void>> refundAllSales(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        salesService.refundAllSales(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // 3. 매니저 정산 상태 토글 (PATCH)
    @org.springframework.web.bind.annotation.PatchMapping("/{id}/settlement")
    public ResponseEntity<ApiResponse<Void>> updateSettlementStatus(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestParam String status) {
        salesService.updateSettlementStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}