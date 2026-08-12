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

  // 💡 [최종 종결판] 모든 괄호, 특수기호, 우편번호를 뚫고 '시/도'만 핀셋으로 뽑아내는 정밀 파서
  const getCityOnly = (address: string) => {
    if (!address) return '미등록';

    // 1. 모든 종류의 괄호를 공백으로 치환 (예: "(12345)" -> " 12345 ", "(계명대)" -> " 계명대 ")
    const cleanStr = address.replace(/[()[\]{}]/g, ' ');
    
    // 2. 띄어쓰기 기준으로 쪼갬
    const words = cleanStr.trim().split(/\s+/);

    const cityMap: { [key: string]: string } = {
      '서울': '서울', '서울특별시': '서울', '서울시': '서울',
      '대구': '대구', '대구광역시': '대구', '대구시': '대구',
      '부산': '부산', '부산광역시': '부산', '부산시': '부산',
      '인천': '인천', '인천광역시': '인천', '인천시': '인천',
      '광주': '광주', '광주광역시': '광주', '광주시': '광주',
      '대전': '대전', '대전광역시': '대전', '대전시': '대전',
      '울산': '울산', '울산광역시': '울산', '울산시': '울산',
      '세종': '세종', '세종특별자치시': '세종', '세종시': '세종',
      '경기': '경기', '경기도': '경기',
      '강원': '강원', '강원도': '강원', '강원특별자치도': '강원',
      '충북': '충북', '충청북도': '충북',
      '충남': '충남', '충청남도': '충남',
      '전북': '전북', '전라북도': '전북', '전북특별자치도': '전북',
      '전남': '전남', '전라남도': '전남',
      '경북': '경북', '경상북도': '경북',
      '경남': '경남', '경상남도': '경남',
      '제주': '제주', '제주특별자치도': '제주', '제주시': '제주'
    };

    for (const word of words) {
      if (/^\d+$/.test(word)) continue; // 숫자로만 된 단어(우편번호) 패스

      for (const key of Object.keys(cityMap)) {
        if (word.startsWith(key)) return cityMap[key];
      }
    }
    return '알수없음';
  };

  const pickupCity = getCityOnly(pickupAddress || '');

  const handleSelect = async (manager: any) => {
    const rawManagerAddress = manager.address || manager.baseAddress || manager.activityArea || '';
    const managerCity = getCityOnly(rawManagerAddress);

    // 💡 디버깅용 콘솔 (F12 눌러서 어떻게 인식했는지 확인 가능)
    console.log(`[배정 로직] 픽업지: ${pickupCity} / 매니저: ${managerCity}`);

    // 지역이 명확히 다를 때만 경고 (한쪽이라도 미등록/알수없음이면 무조건 배정 차단하지 않고 진행)
    const isDifferentRegion = 
      pickupCity !== '미등록' && pickupCity !== '알수없음' && 
      managerCity !== '미등록' && managerCity !== '알수없음' && 
      (pickupCity !== managerCity);

    if (isDifferentRegion) {
      const result = await YesAlert.fire({
        title: '타 지역 배정 경고',
        html: `환자의 픽업지는 <b>[${pickupAddress || '미지정'}]</b> 인데,<br/>매니저 활동지역은 <b>[${rawManagerAddress || '미지정'}]</b> 입니다.<br/><br/><span class="text-red-500 font-bold">거리가 멀어 지각 위험이 있습니다.</span><br/>그래도 배정하시겠습니까?`,
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
        const rawManagerAddress = manager.address || manager.baseAddress || manager.activityArea || '';
        const managerCity = getCityOnly(rawManagerAddress);
        
        const isDifferentRegion = 
          pickupCity !== '미등록' && pickupCity !== '알수없음' && 
          managerCity !== '미등록' && managerCity !== '알수없음' && 
          (pickupCity !== managerCity);

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
                    {rawManagerAddress || '주소 미등록'}
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