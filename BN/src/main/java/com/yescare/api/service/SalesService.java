package com.yescare.api.service;

import com.yescare.api.domain.Reservation;
import com.yescare.api.dto.AdminSalesResponse;
import com.yescare.api.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
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

    // 파라미터 확장: 검색어(keyword), 커스텀 시작/종료일 추가
    public AdminSalesResponse getSalesStatistics(String period, String keyword, LocalDate customStartDate, LocalDate customEndDate) {
        LocalDateTime startDate;
        LocalDateTime endDate;

        // 1. 기간(Period) 설정 로직 고도화
        if ("CUSTOM".equalsIgnoreCase(period) && customStartDate != null && customEndDate != null) {
            startDate = customStartDate.atStartOfDay();
            endDate = customEndDate.atTime(LocalTime.MAX);
        } else {
            endDate = LocalDateTime.now().with(LocalTime.MAX);
            switch (period != null ? period.toUpperCase() : "MONTH") {
                case "TODAY":
                    startDate = endDate.with(LocalTime.MIN);
                    break;
                case "WEEK":
                    startDate = endDate.minusDays(7).with(LocalTime.MIN);
                    break;
                case "YEAR":
                    startDate = endDate.withDayOfYear(1).with(LocalTime.MIN);
                    break;
                case "ALL":
                    startDate = LocalDateTime.of(2000, 1, 1, 0, 0); // 전체 기간
                    break;
                case "MONTH":
                default:
                    startDate = endDate.withDayOfMonth(1).with(LocalTime.MIN);
                    break;
            }
        }

        List<Reservation> allReservations = reservationRepository.findCompletedReservationsByPeriod(startDate, endDate);

        // 2. 검색어 필터링 (환자명 or 매니저명)
        List<Reservation> reservations = allReservations.stream()
                .filter(r -> {
                    if (!StringUtils.hasText(keyword)) return true;
                    boolean matchPatient = r.getPatientName() != null && r.getPatientName().contains(keyword);
                    boolean matchManager = r.getManager() != null && r.getManager().getName().contains(keyword);
                    return matchPatient || matchManager;
                })
                .collect(Collectors.toList());

        int totalBase = 0;
        int totalExtra = 0;

        List<AdminSalesResponse.SalesDetail> detailList = new ArrayList<>();
        Map<String, AdminSalesResponse.DailySalesData.DailySalesDataBuilder> dailyMap = new LinkedHashMap<>();
        // 매니저별 정산액 집계용 Map
        Map<String, AdminSalesResponse.ManagerSettlement.ManagerSettlementBuilder> managerMap = new HashMap<>();

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd");
        DateTimeFormatter fullDateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // 3. 데이터 집계 및 가공
        for (Reservation r : reservations) {
            int baseFee = r.getBaseFee() != null ? r.getBaseFee() : 44000;
            int extraFee = r.getExtraChargeAmount() != null ? r.getExtraChargeAmount() : 0;
            int totalFee = baseFee + extraFee;
            int settlementAmount = (int) (totalFee * 0.8); // 플랫폼 수수료 20% 제외, 매니저 정산 80%

            totalBase += baseFee;
            totalExtra += extraFee;

            String chartDate = r.getReservationTime().format(dateFormatter);
            String detailDate = r.getReservationTime().format(fullDateFormatter);
            String managerName = r.getManager() != null ? r.getManager().getName() : "-";
            String status = r.getSettlementStatus() != null ? r.getSettlementStatus() : "READY";

            // 차트 누적
            dailyMap.computeIfAbsent(chartDate, k -> AdminSalesResponse.DailySalesData.builder().date(k).baseFee(0).extraFee(0).total(0))
                    .baseFee(dailyMap.get(chartDate).build().getBaseFee() + baseFee)
                    .extraFee(dailyMap.get(chartDate).build().getExtraFee() + extraFee)
                    .total(dailyMap.get(chartDate).build().getTotal() + totalFee);

            // 매니저별 정산액 누적
            if (!"-".equals(managerName)) {
                managerMap.computeIfAbsent(managerName, k -> AdminSalesResponse.ManagerSettlement.builder().managerName(k).matchCount(0).totalSettlementAmount(0))
                        .matchCount(managerMap.get(managerName).build().getMatchCount() + 1)
                        .totalSettlementAmount(managerMap.get(managerName).build().getTotalSettlementAmount() + settlementAmount);
            }

            // 테이블 내역
            detailList.add(AdminSalesResponse.SalesDetail.builder()
                    .id(r.getId())
                    .date(detailDate)
                    .patientName(r.getPatientName())
                    .managerName(managerName)
                    .baseFee(baseFee)
                    .extraFee(extraFee)
                    .totalFee(totalFee)
                    .settlementStatus(status)
                    .build());
        }

        List<AdminSalesResponse.DailySalesData> chartData = dailyMap.values().stream()
                .map(AdminSalesResponse.DailySalesData.DailySalesDataBuilder::build)
                .collect(Collectors.toList());

        // 매니저 정산액 높은 순으로 정렬
        List<AdminSalesResponse.ManagerSettlement> managerSettlements = managerMap.values().stream()
                .map(AdminSalesResponse.ManagerSettlement.ManagerSettlementBuilder::build)
                .sorted((m1, m2) -> Integer.compare(m2.getTotalSettlementAmount(), m1.getTotalSettlementAmount()))
                .collect(Collectors.toList());

        Collections.reverse(detailList);

        return AdminSalesResponse.builder()
                .summary(AdminSalesResponse.SalesSummary.builder()
                        .totalSales(totalBase + totalExtra)
                        .totalBaseFee(totalBase)
                        .totalExtraFee(totalExtra)
                        .totalCompletedCount(reservations.size())
                        .build())
                .chartData(chartData)
                .salesDetails(detailList)
                .managerSettlements(managerSettlements) // 조립
                .build();
    }

    // 1. 추가 요금 수정 로직 (수정 사유도 함께 기록)
    @Transactional
    public void updateExtraFee(Long id, int extraFee) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 예약이 존재하지 않습니다."));

        reservation.setExtraChargeAmount(extraFee);
        reservation.setExtraChargeReason("운영자 수동 금액 보정");
    }

    // 2. 전체 환불 로직 (기본금, 추가금 모두 0원 처리)
    @Transactional
    public void refundAllSales(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 예약이 존재하지 않습니다."));

        // 1. 원본 기본 요금값을 안전하게 보존합니다. (null일 경우 44000)
        int currentBaseFee = reservation.getBaseFee() != null ? reservation.getBaseFee() : 44000;

        // 2. [핵심 조치] baseFee는 건드리지 않고, extraChargeAmount를 마이너스 합산값으로 밀어버립니다.
        reservation.setExtraChargeAmount(-currentBaseFee);
        reservation.setExtraChargeReason("운영자 전체 환불 처리 (전산 상쇄)");
    }

    // 3. 정산 상태 토글 로직
    @Transactional
    public void updateSettlementStatus(Long id, String status) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 예약이 존재하지 않습니다."));

        reservation.setSettlementStatus(status);
    }
}