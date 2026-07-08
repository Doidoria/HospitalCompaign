// src/types/sales.ts
export interface SalesSummary {
  totalSales: number;
  totalBaseFee: number;
  totalExtraFee: number;
  totalCompletedCount: number;
}

export interface DailySalesData {
  date: string;
  baseFee: number;
  extraFee: number;
  total: number;
}

export type SettlementStatus = 'READY' | 'COMPLETED';

export interface SalesDetail {
  id: number;
  date: string;
  patientName: string;
  managerName: string;
  baseFee: number;
  extraFee: number;
  totalFee: number;
  settlementStatus?: SettlementStatus; // 추가됨
}

export interface ManagerSettlement {
  managerName: string;
  matchCount: number;
  totalSettlementAmount: number;
}

export interface SalesStatisticsResponse {
  summary: SalesSummary;
  chartData: DailySalesData[];
  salesDetails: SalesDetail[];
  managerSettlements?: ManagerSettlement[]; // CUSTOM 기간 조회 시에만 옴
}

export interface Member {
  id: number;
  name: string;
  role: string;
  email?: string;
}

export interface SalesTabProps {
  members: Member[];
  handleViewMemberProfile: (member: Member) => void;
}