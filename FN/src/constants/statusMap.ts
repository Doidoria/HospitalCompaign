// src/constants/statusMap.ts

export type StatusKey = 'PAYMENT_PENDING' | 'WAITING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const STATUS_MAP: Record<StatusKey, { label: string; colorClass: string }> = {
  PAYMENT_PENDING: {
    label: '결제 대기',
    colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  },
  WAITING: { 
    label: '매칭 대기', 
    colorClass: 'bg-orange-100 text-orange-600 border-orange-200' 
  },
  CONFIRMED: { 
    label: '예약 확정', 
    colorClass: 'bg-blue-100 text-blue-700 border-blue-200' 
  },
  IN_PROGRESS: {
    label: '동행 중',
    colorClass: 'bg-violet-100 text-violet-700 border-violet-200'
  },
  COMPLETED: { 
    label: '이용 완료', 
    colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  },
  CANCELLED: { 
    label: '예약 취소', 
    colorClass: 'bg-red-50 text-red-600 border-red-200' 
  }
};