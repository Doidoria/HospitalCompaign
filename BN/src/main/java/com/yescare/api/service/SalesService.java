package com.yescare.api.service;

import com.yescare.api.domain.Reservation;
import com.yescare.api.dto.AdminSalesResponse;
import com.yescare.api.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalesService {

    private final ReservationRepository reservationRepository;

    public AdminSalesResponse getSalesStatistics(String period) {
        LocalDateTime startDate;
        LocalDateTime endDate = LocalDateTime.now().with(LocalTime.MAX);

        // 1. 기간(Period) 설정
        switch (period.toUpperCase()) {
            case "WEEK":
                startDate = endDate.minusDays(7).with(LocalTime.MIN);
                break;
            case "YEAR":
                startDate = endDate.withDayOfYear(1).with(LocalTime.MIN);
                break;
            case "MONTH":
            default:
                startDate = endDate.withDayOfMonth(1).with(LocalTime.MIN);
                break;
        }

        // 2. 해당 기간의 완료된 예약 조회
        List<Reservation> reservations = reservationRepository.findCompletedReservationsByPeriod(startDate, endDate);

        int totalBase = 0;
        int totalExtra = 0;

        List<AdminSalesResponse.SalesDetail> detailList = new ArrayList<>();
        Map<String, AdminSalesResponse.DailySalesData.DailySalesDataBuilder> dailyMap = new LinkedHashMap<>(); // 순서 보장을 위해 LinkedHashMap 사용

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd");
        DateTimeFormatter fullDateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // 3. 데이터 집계 및 가공
        for (Reservation r : reservations) {
            // [권장] 추후 Reservation 엔티티에 baseFee 필드를 추가하고 r.getBaseFee()로 가져오세요.
            int baseFee = r.getBaseFee() != null ? r.getBaseFee() : 44000;
            int extraFee = r.getExtraChargeAmount() != null ? r.getExtraChargeAmount() : 0;

            totalBase += baseFee;
            totalExtra += extraFee;

            String chartDate = r.getReservationTime().format(dateFormatter);
            String detailDate = r.getReservationTime().format(fullDateFormatter);

            // 차트용 일별 데이터 누적
            dailyMap.computeIfAbsent(chartDate, k -> AdminSalesResponse.DailySalesData.builder().date(k).baseFee(0).extraFee(0).total(0))
                    .baseFee(dailyMap.get(chartDate).build().getBaseFee() + baseFee)
                    .extraFee(dailyMap.get(chartDate).build().getExtraFee() + extraFee)
                    .total(dailyMap.get(chartDate).build().getTotal() + baseFee + extraFee);

            // 테이블 상세 내역 데이터 생성
            detailList.add(AdminSalesResponse.SalesDetail.builder()
                    .id(r.getId())
                    .date(detailDate)
                    .patientName(r.getPatientName())
                    .managerName(r.getManager() != null ? r.getManager().getName() : "-")
                    .baseFee(baseFee)
                    .extraFee(extraFee)
                    .totalFee(baseFee + extraFee)
                    .build());
        }

        // 차트 데이터 리스트 변환
        List<AdminSalesResponse.DailySalesData> chartData = dailyMap.values().stream()
                .map(AdminSalesResponse.DailySalesData.DailySalesDataBuilder::build)
                .collect(Collectors.toList());

        // 최신 예약이 위로 오도록 상세 내역 뒤집기
        Collections.reverse(detailList);

        // 4. 최종 결과 조립
        AdminSalesResponse.SalesSummary summary = AdminSalesResponse.SalesSummary.builder()
                .totalSales(totalBase + totalExtra)
                .totalBaseFee(totalBase)
                .totalExtraFee(totalExtra)
                .totalCompletedCount(reservations.size())
                .build();

        return AdminSalesResponse.builder()
                .summary(summary)
                .chartData(chartData)
                .salesDetails(detailList)
                .build();
    }
}