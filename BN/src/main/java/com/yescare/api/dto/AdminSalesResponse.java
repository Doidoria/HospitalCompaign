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
        private String date; // "MM/dd" 형식
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
    }
}