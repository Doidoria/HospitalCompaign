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
  meetingPoint?: string;
  transportation?: string;
  mobility?: string;
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
  meetingPoint?: string;
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
  managerId?: number; // 매니저가 없을 수 있으므로 Optional(?) 처리
}