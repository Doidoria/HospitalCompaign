// src/types/sales.ts (추가 제안)
export interface SalesSummary {
  totalSales: number;     // 총 매출액 (선입금 + 추가요금)
  totalBaseFee: number;   // 선입금(기본요금) 총액
  totalExtraFee: number;  // 추가요금 총액
  totalCompletedCount: number; // 완료된 예약 건수
}

export interface DailySalesData {
  date: string;       // "MM/DD" 형식
  baseFee: number;
  extraFee: number;
  total: number;
}

export interface SalesDetail {
  id: number;
  date: string;
  patientName: string;
  managerName: string;
  baseFee: number;
  extraFee: number;
  totalFee: number;
}