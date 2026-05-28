// src/types/common.ts

// 백엔드의 ApiResponse.java 와 1:1 매칭
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// 백엔드의 ErrorResponse.java 와 매칭 (에러 핸들링 용도)
export interface ErrorResponse {
  status: number;
  message: string;
}