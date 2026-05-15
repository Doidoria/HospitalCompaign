// src/components/admin/modals/ManagerListModalContent.tsx
'use client';

import React, { useState } from 'react';

interface ManagerListModalProps {
  managers: any[];
  onSelect: (email: string) => void;
}

export default function ManagerListModalContent({ managers, onSelect }: ManagerListModalProps) {
  const [selectedEmail, setSelectedEmail] = useState<string>('');

  const handleRadioChange = (email: string) => {
    setSelectedEmail(email);
    onSelect(email);
  };

  return (
    <div className="text-left max-h-[60vh] overflow-y-auto mt-4 space-y-2 custom-scrollbar pr-2">
      {managers.map((manager) => {
        const daysHtml = manager.availableDays 
          ? manager.availableDays.split(',').map((day: string, idx: number) => (
              <span key={idx} className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold mr-1 inline-block mb-1">
                {day.trim()}
              </span>
            ))
          : <span className="text-slate-400 text-[10px] border border-slate-200 px-1.5 py-0.5 rounded mr-1 inline-block mb-1">요일 미지정</span>;
        
        const timeText = manager.availableTime || '시간 미지정';
        const isChecked = selectedEmail === manager.email;

        return (
          <label 
            key={manager.id} 
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all shadow-sm
              ${isChecked ? 'bg-blue-50 border-blue-400' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <input 
              type="radio" name="managerSelect" value={manager.email} checked={isChecked}
              onChange={() => handleRadioChange(manager.email)}
              className="mt-1 text-blue-600 border-gray-300 focus:ring-blue-500" 
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="font-extrabold text-slate-800 text-sm mb-0.5">
                  {manager.name} <span className="font-medium text-emerald-600 text-[10px] ml-1 bg-emerald-100 px-1.5 py-0.5 rounded">매니저</span>
                </p>
                <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold whitespace-nowrap tracking-wide border border-slate-200">
                  ID: #{manager.id}
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mb-2.5">{manager.email}</p>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 border-t border-slate-100 pt-2.5 mt-1">
                <div className="flex flex-wrap w-full">{daysHtml}</div>
                <span className="text-[11px] text-blue-600 font-bold whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded mt-1 sm:mt-0">
                  {timeText}
                </span>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}