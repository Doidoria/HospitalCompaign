// src/types/review.ts (새로 생성하여 백엔드 ReviewResponse와 매칭)
export interface ReviewResponse {
  id: number;
  reservationId: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}