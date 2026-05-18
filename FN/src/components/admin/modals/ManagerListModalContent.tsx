// src/components/admin/modals/ManagerListModalContent.tsx
'use client';

import React, { useState } from 'react';
import { UserCheck, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';

interface ManagerListModalProps {
  managers: any[];
  onSelect: (email: string) => void;
}

export default function ManagerListModalContent({ managers, onSelect }: ManagerListModalProps) {
  const [selectedEmail, setSelectedEmail] = useState<string>('');

  const handleSelect = (email: string) => {
    setSelectedEmail(email);
    onSelect(email);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-h-[60vh] overflow-y-auto mt-4 custom-scrollbar pr-2 py-1">
      {managers.map((manager) => {
        const daysHtml = manager.availableDays 
          ? manager.availableDays.split(',').map((day: string, idx: number) => (
              <span key={idx} className="bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm text-[11px] px-2 py-1 rounded-md font-extrabold mr-1.5 inline-block mb-1">
                {day.trim()}
              </span>
            ))
          : <span className="bg-slate-100 text-slate-400 border border-dashed border-slate-300 text-[11px] px-2 py-1 rounded-md font-bold mr-1.5 inline-block mb-1">요일 미지정</span>;
        
        const timeText = manager.availableTime || '시간 미지정';
        const isChecked = selectedEmail === manager.email;

        return (
          <div 
            key={manager.id} 
            onClick={() => handleSelect(manager.email)}
            className={`relative flex flex-col p-4 rounded-[20px] border-2 cursor-pointer transition-all duration-200 overflow-hidden
              ${isChecked 
                ? 'bg-blue-50/50 border-blue-500 shadow-[0_4px_15px_rgba(59,130,246,0.15)] scale-[1.02] z-10' 
                : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm'}`}
          >
            {isChecked && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-[20px]"></div>}

            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                {/* 둥근 프로필 아이콘 */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-colors
                  ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>

                <div className="min-w-0"> {/* 글자 넘침 방지 */}
                  <h4 className="font-extrabold text-slate-800 text-sm mb-0.5 flex items-center gap-1.5">
                    <span className="truncate">{manager.name}</span>
                    <span className="shrink-0 font-bold text-blue-600 text-[9px] bg-blue-100/50 px-1.5 py-0.5 rounded-full border border-blue-200/50">PRO</span>
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 truncate w-32">{manager.email}</p>
                </div>
              </div>
              
              <div className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold whitespace-nowrap border border-slate-200 shrink-0">
                #{manager.id}
              </div>
            </div>
            
            {/* 하단 요일/시간 정보 박스 */}
            <div className={`p-3 rounded-xl border space-y-2.5 mt-auto flex-1 transition-colors
              ${isChecked ? 'bg-white border-blue-100' : 'bg-slate-50 border-slate-200/60'}`}>
              
              {/* 근무 요일 */}
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 mb-1.5 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-500" /> 근무 가능 요일
                </p>
                <div className="flex flex-wrap w-full">{daysHtml}</div>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-[10px] font-extrabold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> 근무 가능 시간
                </p>
                <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[11px] px-2 py-1 rounded-md font-extrabold inline-block shadow-sm">
                  {timeText}
                </span>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}