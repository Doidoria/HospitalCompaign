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

  // 💡 [최종 종결판] 띄어쓰기, 괄호, 오타 상관없이 문장에 포함된 '모든' 시/도를 배열로 추출
  const extractAllCities = (text: string) => {
    if (!text) return [];
    
    // 공백을 모두 제거하여 "대 구 광 역 시", "서 울" 등 오타까지 100% 방어
    const noSpaceText = text.replace(/\s+/g, '');
    
    const cityMap: { [key: string]: string } = {
      '서울': '서울', '부산': '부산', '대구': '대구', '인천': '인천',
      '광주': '광주', '대전': '대전', '울산': '울산', '세종': '세종',
      '경기': '경기', '강원': '강원', '충북': '충북', '충남': '충남',
      '전북': '전북', '전남': '전남', '경북': '경북', '경남': '경남', '제주': '제주'
    };

    const foundCities = new Set<string>();
    
    // 텍스트 내에 cityMap의 키워드가 하나라도 포함되어 있으면 해당 지역(value)을 저장
    for (const [key, value] of Object.entries(cityMap)) {
      if (noSpaceText.includes(key)) {
        foundCities.add(value);
      }
    }
    
    return Array.from(foundCities);
  };

  // 1. 환자 주소(자택, 병원 등 포함된 모든 텍스트)에서 지역 모두 추출
  const pickupCities = extractAllCities(pickupAddress || '');

  const handleSelect = async (manager: any) => {
    // 2. 매니저 주소 텍스트 모두 합치기 (address, activityArea 등 만약의 사태 대비)
    const rawManagerAddress = `${manager.address || ''} ${manager.baseAddress || ''} ${manager.activityArea || ''}`;
    const managerCities = extractAllCities(rawManagerAddress);

    // [개발자 확인용 상세 로그]
    console.log(`[배정 테스트] 픽업지 주소 원본: ${pickupAddress}`);
    console.log(`[배정 테스트] 추출된 픽업 지역:`, pickupCities);
    console.log(`[배정 테스트] 매니저 주소 원본: ${rawManagerAddress}`);
    console.log(`[배정 테스트] 추출된 매니저 지역:`, managerCities);

    // 핵심 로직: 둘 다 지역 정보가 존재할 때만 비교 수행
    let isDifferentRegion = false;
    
    if (pickupCities.length > 0 && managerCities.length > 0) {
      // 픽업지 지역 배열과 매니저 지역 배열 중 '단 하나라도' 겹치는 곳이 있는지 확인
      const hasCommonCity = pickupCities.some(city => managerCities.includes(city));
      
      // 겹치는 지역이 하나도 없을 때만 완벽한 타지역으로 간주 (경고 발생)
      if (!hasCommonCity) {
        isDifferentRegion = true;
      }
    }

    if (isDifferentRegion) {
      const result = await YesAlert.fire({
        title: '타 지역 배정 경고',
        html: `환자의 위치는 <b>[${pickupCities.join(', ')}]</b> 인데,<br/>매니저 활동지역은 <b>[${managerCities.join(', ')}]</b> 입니다.<br/><br/><span class="text-red-500 font-bold">거리가 멀어 지각 위험이 있습니다.</span><br/>그래도 배정하시겠습니까?`,
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
        const rawManagerAddress = `${manager.address || ''} ${manager.baseAddress || ''} ${manager.activityArea || ''}`;
        const managerCities = extractAllCities(rawManagerAddress);
        
        let isDifferentRegion = false;
        if (pickupCities.length > 0 && managerCities.length > 0) {
          const hasCommonCity = pickupCities.some(city => managerCities.includes(city));
          if (!hasCommonCity) {
            isDifferentRegion = true;
          }
        }

        const daysHtml = manager.availableDays 
          ? manager.availableDays.split(',').map((day: string, idx: number) => (
              <span key={idx} className="bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm text-[11px] px-2 py-1 rounded-md font-extrabold mr-1.5 inline-block mb-1">
                {day.trim()}
              </span>
            ))
          : <span className="bg-slate-100 text-slate-400 border border-dashed border-slate-300 text-[11px] px-2 py-1 rounded-md font-bold mr-1.5 inline-block mb-1">요일 미지정</span>;
        
        const timeText = manager.availableTime || '시간 미지정';
        const isChecked = selectedEmail === manager.email;

        // 화면에 보여줄 매니저 주소
        const displayAddress = manager.address || manager.baseAddress || manager.activityArea || '주소 미등록';

        return (
          <div 
            key={manager.id || manager.email} 
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
                    {displayAddress}
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