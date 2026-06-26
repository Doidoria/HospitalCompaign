// src/types/report.ts

// 백엔드의 ReportRequest.java 와 매칭되는 인터페이스 (요청 폼 데이터)
export interface ReportRequest {
  reservationId: number;
  department: string;
  doctorOpinion: string;
  prescription: string;
  
  // 신규 추가된 복약 상세 정보 3종
  medicationType: string;
  medicationTime: string;
  medicationDays: number | null; 
  
  managerComment: string;
  nextSchedule: string;
  patientCondition: string;
  noNextSchedule: boolean;

  retainedImages?: string[];
}

// 백엔드의 ReportResponse.java 와 매칭되는 인터페이스 (응답 데이터)
export interface ReportResponse {
  id: number;
  hospitalName: string;
  patientName: string;
  date: string;
  department: string;
  doctorOpinion: string;
  prescription: string;
  
  // 신규 추가된 복약 상세 정보 3종
  medicationType: string;
  medicationTime: string;
  medicationDays: number | null;

  managerName: string;
  patientCondition: string;
  nextSchedule: string;
  managerComment: string;
  isModified: boolean;
  noNextSchedule: boolean;
  
  imageUrls: string[];
}