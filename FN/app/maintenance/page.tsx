// app/maintenance/page.tsx
'use client';

import React, { useState } from 'react';
import { Wrench, RefreshCw, PhoneCall } from 'lucide-react';
import { systemApi } from '@/src/api/index';

export default function MaintenancePage() {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const res = await systemApi.getCheckStatus();
      if (!res.data.maintenance) {
        // 점검이 끝났다면 메인으로 이동
        window.location.href = '/';
      } else {
        alert('아직 시스템 점검이 진행 중입니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch (e) {
      alert('서버와 통신할 수 없습니다.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 flex flex-col items-center">
        
        {/* 애니메이션이 들어간 렌치 아이콘 컨테이너 */}
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner animate-pulse">
          <Wrench className="w-10 h-10 stroke-[2.5]" />
        </div>

        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-3">
          시스템 정기 점검 안내
        </h1>
        
        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6 whitespace-pre-line">
          더 안정적인 병원 동행 '예스케어' 서비스를 제공하기 위해 현재 시스템 점검 및 업데이트를 진행하고 있습니다.{'\n'}
          이용에 불편을 드려 대단히 죄송합니다.
        </p>

        {/* 안내 사양 박스 */}
        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left flex flex-col gap-2.5 mb-8">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">점검 대상</span>
            <span className="font-extrabold text-slate-700">예스케어 웹</span>
          </div>
          <div className="flex justify-between text-xs border-t border-slate-200/60 pt-2.5">
            <span className="font-bold text-slate-400">고객센터</span>
            <span className="font-extrabold text-blue-600 flex items-center gap-1">
              <PhoneCall className="w-3 h-3"/> 053-982-2778
            </span>
          </div>
        </div>

        {/* 다시 시도 버튼 (모바일 터치 영역 최적화 적용) */}
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? '점검 종료 확인중...' : '점검 종료 여부 확인하기'}
        </button>
      </div>
    </div>
  );
}