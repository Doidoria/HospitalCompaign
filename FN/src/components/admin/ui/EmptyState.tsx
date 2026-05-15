// src/components/admin/ui/EmptyState.tsx
'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  colSpan?: number; // 테이블 열 개수에 맞춰 늘릴 수 있도록 추가
}

export default function EmptyState({ message, colSpan = 10 }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Inbox className="w-12 h-12 mb-3 text-slate-300 opacity-80" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
}