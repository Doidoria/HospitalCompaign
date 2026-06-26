// src/types/reservation.ts

// 1. 상태값 Enum 매칭 (ReservationStatus.java)
export type ReservationStatus = 'WAITING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// 2. 예약 요청 DTO 매칭 (ReservationRequest.java)
export interface ReservationRequest {
  patientName: string;
  patientPhone: string;
  hospitalName: string;
  reservationTime: string; // LocalDateTime은 ISO 8601 문자열(YYYY-MM-DDTHH:mm:ss)로 처리
  guardianName?: string;
  guardianPhone?: string;
  memo?: string;
  requirements?: string;
  detailedContent?: string;
  doctorInquiry?: string;
  category?: string;
  meetingType?: string; 
  meetingAddress?: string; 
  meetingDetailAddress?: string; 
  transportation?: string;
  mobility?: string;
  bloodType?: string;
  underlyingDisease?: string;
  medication?: string;
  preparedDocuments?: string;
}

// 3. 예약 응답 DTO 매칭 (ReservationResponse.java)
export interface ReservationResponse {
  id: number;
  patientName: string;
  patientPhone: string;
  guardianName?: string;
  guardianPhone?: string;
  hospitalName: string;
  reservationTime: string; // "YYYY-MM-DDTHH:mm:ss"
  status: ReservationStatus;
  requirements?: string;
  managerName: string; // 매칭 안 됐을 땐 "-" 로 옴
  category?: string;
  meetingType?: string;
  meetingAddress?: string;
  meetingDetailAddress?: string;
  transportation?: string;
  memo?: string;
  mobility?: string;
  detailedContent?: string;
  doctorInquiry?: string;
  patientAddress?: string;
  hasProxy: boolean;
  noRevisit: boolean;
  revisitCount?: string;
  reviewRating?: number;
  reviewComment?: string;
  managerId?: number;
  bloodType?: string;
  underlyingDisease?: string;
  medication?: string;
  preparedDocuments?: string;
}

// 4. 예약 상세 페이지 UI 상태 관리를 위한 타입
export interface ManagerInfo {
  id: string | number;
  name: string;
  license: string;
  rating: string;
}

export interface PaymentInfo {
  baseFee: number;
  extraFee: number;
  totalFee: number;
}

export interface ReservationDetailState {
  id: string | number; 
  status: string;
  date: string;
  time: string;
  hospital: string;
  patientName: string;
  patientPhone: string;
  memo: string;
  manager: ManagerInfo | null;
  payment: PaymentInfo;
  category: string;
  detailedContent: string;
  doctorInquiry: string;
  meetingType: string;
  meetingAddress: string;
  meetingDetailAddress: string;
  patientAddress: string;
  transportation: string;
  mobility: string;
  // 건강 정보 4종
  bloodType: string;
  underlyingDisease: string;
  medication: string;
  preparedDocuments: string;
}