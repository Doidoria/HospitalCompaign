// src/components/admin/ui/StatusBadge.tsx
'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isWaiting = status === 'WAITING' || status === '매칭 대기';
  const isConfirmed = status === 'CONFIRMED' || status === '예약 확정';
  const isCompleted = status === 'COMPLETED' || status === '이용 완료';
  const isCanceled = status === 'CANCELLED' || status === '취소됨';
  const isPaymentPending = status === 'PAYMENT_PENDING' || status === '결제 대기';
  const isInProgress = status === 'IN_PROGRESS' || status === '동행 중';

  const colorClass = isWaiting ? 'bg-orange-100 text-orange-700 border-orange-200' 
    : isConfirmed ? 'bg-blue-100 text-blue-700 border-blue-200' 
    : isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    : isCanceled ? 'bg-red-100 text-red-700 border-red-200' 
    : isPaymentPending ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
    : isInProgress ? 'bg-violet-100 text-violet-700 border-violet-200'
    : 'bg-gray-100 text-gray-700 border-gray-200';
    
  const displayStatus = isWaiting ? '매칭 대기' 
    : isConfirmed ? '예약 확정' 
    : isCompleted ? '이용 완료' 
    : isCanceled ? '취소됨' 
    : isPaymentPending ? '결제 대기'
    : isInProgress ? '동행 중'
    : status;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass} shadow-sm`}>
      {displayStatus}
    </span>
  );
}