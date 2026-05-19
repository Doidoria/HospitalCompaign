'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  colSpan?: number; 
  isTable?: boolean;
}

export default function EmptyState({ message, colSpan = 10, isTable = true }: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 w-full">
      <Inbox className="w-12 h-12 mb-3 text-slate-300 opacity-80" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  if (!isTable) {
    return content;
  }

  return (
    <tr>
      <td colSpan={colSpan}>
        {content}
      </td>
    </tr>
  );
}