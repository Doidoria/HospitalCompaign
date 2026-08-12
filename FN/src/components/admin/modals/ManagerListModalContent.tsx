// src/components/admin/modals/ManagerListModalContent.tsx
'use client';

import React, { useState } from 'react';
import { UserCheck, Clock, CalendarDays, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';
import { Toast, YesAlert } from '@/src/utils/alert';

interface ManagerListModalProps {
  managers: any[];
  pickupAddress: string;
  onSelect: (email: string) => void;
}

export default function ManagerListModalContent({ managers, pickupAddress, onSelect }: ManagerListModalProps) {
  const [selectedEmail, setSelectedEmail] = useState<string>('');

  console.log("프론트로 넘어온 픽업 주소 텍스트 ->", pickupAddress);
  console.log("프론트로 넘어온 매니저 리스트 배열 ->", managers);

  // 💡 [수정됨] 주소 정규화 함수: '대구광역시 북구'와 '대구 북구'를 동일하게 '대구 북구'로 변환
  const getRegion = (address: string) => {
    if (!address) return '';
    const parts = address.trim().split(' ');
    if (parts.length === 0) return '';

    let city = parts[0];
    
    // 4음절 도/특별시 이름 축약 (예: 경상북도 -> 경북)
    if (city === '경상북도') city = '경북';
    if (city === '경상남도') city = '경남';
    if (city === '전라북도' || city === '전북특별자치도') city = '전북';
    if (city === '전라남도') city = '전남';
    if (city === '충청북도') city = '충북';
    if (city === '충청남도') city = '충남';
    if (city === '제주특별자치도') city = '제주';

    // '대구광역시' -> '대구', '서울특별시' -> '서울' 등 앞 2글자 추출
    city = city.substring(0, 2);
    
    // 구/군 (ex: 북구, 달서구) 추출
    const district = parts.length > 1 ? parts[1] : '';
    
    return `${city} ${district}`.trim();
  };

  const pickupRegion = getRegion(pickupAddress || '');

  const handleSelect = async (manager: any) => {
    const managerRegion = getRegion(manager.address || '');
    
    // 시/도 또는 구/군이 다를 경우 타지역으로 판별
    const isDifferentRegion = pickupRegion && managerRegion && (pickupRegion !== managerRegion);

    if (isDifferentRegion) {
      const result = await YesAlert.fire({
        title: '타 지역 배정 경고',
        html: `환자의 픽업지는 <b>[${pickupRegion}]</b> 인데,<br/>매니저 활동지역은 <b>[${managerRegion}]</b> 입니다.<br/><br/><span class="text-red-500 font-bold">거리가 멀어 지각 위험이 있습니다.</span><br/>그래도 배정하시겠습니까?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '네, 배정합니다',
        cancelButtonText: '다른 매니저 찾기'
      });
      if (!result.isConfirmed) return;
    }

    setSelectedEmail(manager.email);
    onSelect(manager.email);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left max-h-[60vh] overflow-y-auto mt-4 custom-scrollbar pr-2 py-1">
      {managers.map((manager) => {
        const managerRegion = getRegion(manager.address || '');
        const isDifferentRegion = pickupRegion && managerRegion && (pickupRegion !== managerRegion);
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
            onClick={() => handleSelect(manager)} 
            className={`relative flex flex-col p-4 rounded-[20px] border-2 cursor-pointer transition-all duration-200 overflow-hidden
              ${isChecked 
                ? 'bg-blue-50/50 border-blue-500 shadow-[0_4px_15px_rgba(59,130,246,0.15)] scale-[1.02] z-10' 
                : isDifferentRegion 
                  ? 'bg-red-50/30 border-red-100 hover:border-red-300 hover:bg-red-50 hover:shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm'}`}
          >
            {isChecked && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-[20px]"></div>}

            {isDifferentRegion && (
              <div className="absolute right-3 top-3 flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-md text-[10px] font-black border border-red-200 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                장거리(타지역)
              </div>
            )}

            <div className="flex justify-between items-start mb-3 mt-1 pr-16">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-colors
                  ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-800 text-sm mb-0.5 flex items-center gap-1.5">
                    <span className="truncate">{manager.name}</span>
                    <span className="shrink-0 font-bold text-blue-600 text-[9px] bg-blue-100/50 px-1.5 py-0.5 rounded-full border border-blue-200/50">PRO</span>
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 truncate w-full">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {managerRegion || '주소 미등록'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-3 rounded-xl border space-y-2.5 mt-auto flex-1 transition-colors
              ${isChecked ? 'bg-white border-blue-100' : 'bg-slate-50 border-slate-200/60'}`}>
              
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