package com.yescare.api.controller;


import com.yescare.api.dto.AdminSalesResponse;
import com.yescare.api.dto.ApiResponse;
import com.yescare.api.service.SalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/sales")
@RequiredArgsConstructor
public class AdminSalesController {

    private final SalesService salesService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminSalesResponse>> getSalesStatistics(
            @RequestParam(defaultValue = "MONTH") String period) {

        AdminSalesResponse response = salesService.getSalesStatistics(period);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}