// src/components/EventPopup.tsx
'use client';

import { useEffect, useState } from 'react';
import { popupApi } from '@/src/api/index';

export default function EventPopup() {
  const [popups, setPopups] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    popupApi.getActivePopup().then(res => {
      // 1. 배열로 데이터를 안전하게 감쌉니다.
      const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      
      // 2. 활성화 상태이면서, 로컬 스토리지에 '안 보기' 처리되지 않은 팝업만 필터링
      const activePopups = data.filter((p: any) => {
        if (!p || !(p.isActive || p.active)) return false;
        const hidePopup = localStorage.getItem(`hide_popup_${p.id}_today`);
        return hidePopup !== 'true';
      });

      // 3. 이미지 URL 정제
      const formattedPopups = activePopups.map((p: any) => {
        const getFileUrl = (path: string) => {
          if (!path) return '';
          if (path.startsWith('http://') || path.startsWith('https://')) return path;
          
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
          const cleanPath = path.startsWith('/') ? path.substring(1) : path;
          
          return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
        };
        return { ...p, imageUrl: getFileUrl(p.imageUrl) };
      });

      setPopups(formattedPopups);
    }).catch(e => console.log('팝업 데이터를 불러오지 못했습니다.'));
  }, []);

  // 닫거나 하루 안보기 클릭 시 다음 팝업으로 넘어가는 로직
  const handleNextPopup = () => {
    if (currentIndex < popups.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPopups([]); // 모든 팝업 소진 시 배열을 비워 UI 닫음
    }
  };

  const closeToday = () => {
    const currentPopup = popups[currentIndex];
    if (currentPopup) {
      localStorage.setItem(`hide_popup_${currentPopup.id}_today`, 'true');
    }
    handleNextPopup();
  };

  if (popups.length === 0) return null;

  const currentPopup = popups[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md sm:max-w-lg animate__animated animate__zoomIn">
        
        {/* 상단: 팝업 순서 표시 (예: 1 / 3) - 1개일 땐 숨김 */}
        {popups.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
            {currentIndex + 1} / {popups.length}
          </div>
        )}

        {/* 팝업 이미지 클릭 시 링크 이동 */}
        <a href={currentPopup.linkUrl || '#'} target={currentPopup.linkUrl ? "_blank" : "_self"} className="block cursor-pointer relative">
          <img 
            src={currentPopup.imageUrl} 
            alt={currentPopup.title || '이벤트 팝업'} 
            className="w-full aspect-[4/5] object-cover" 
          />
        </a>

        {/* 팝업 하단 컨트롤 버튼 */}
        <div className="flex bg-white border-t border-gray-100 relative z-10">
          <button onClick={closeToday}
            className="flex-1 py-3 text-sm text-gray-600 hover:bg-gray-100 transition-colors border-r border-gray-100">
              오늘 하루 보지 않기
          </button>
          <button onClick={handleNextPopup}
            className="flex-1 py-3 text-sm font-bold text-gray-800 hover:bg-gray-100 transition-colors">
              닫기
          </button>
        </div>

      </div>
    </div>
  );
}