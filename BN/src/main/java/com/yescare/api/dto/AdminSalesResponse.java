package com.yescare.api.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AdminSalesResponse {
    private SalesSummary summary;
    private List<DailySalesData> chartData;
    private List<SalesDetail> salesDetails;
    private List<ManagerSettlement> managerSettlements; // 매니저별 정산 요약 리스트

    @Getter
    @Builder
    public static class SalesSummary {
        private int totalSales;
        private int totalBaseFee;
        private int totalExtraFee;
        private int totalCompletedCount;
    }

    @Getter
    @Builder
    public static class DailySalesData {
        private String date;
        private int baseFee;
        private int extraFee;
        private int total;
    }

    @Getter
    @Builder
    public static class SalesDetail {
        private Long id;
        private String date;
        private String patientName;
        private String managerName;
        private int baseFee;
        private int extraFee;
        private int totalFee;
        private String settlementStatus;
    }

    // 매니저별 정산액 집계 객체
    @Getter
    @Builder
    public static class ManagerSettlement {
        private String managerName;
        private int matchCount;           // 매칭 건수
        private int totalSettlementAmount; // 정산액 합계 (수수료 제외)
    }
}