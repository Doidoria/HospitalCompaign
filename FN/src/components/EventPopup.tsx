'use client';

import { useEffect, useState } from 'react';
import { popupApi } from '@/src/api/index';

export default function EventPopup() {
  const [popup, setPopup] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. 로컬 스토리지에서 '오늘 하루 안 보기' 체크
    const hidePopup = localStorage.getItem('hide_popup_today');
    if (hidePopup === 'true') return;

    // 2. 백엔드에서 활성화된 팝업 가져오기
    popupApi.getActivePopup().then(res => {
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      
      if (data && (data.isActive || data.active)) {
        const getFileUrl = (path: string) => {
          if (!path) return '';
          if (path.startsWith('http')) return path;
          
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
          // path 앞에 붙은 쓸데없는 슬래시나 중복된 uploads/ 문자열을 싹 정리합니다.
          const cleanPath = path.replace(/^\/?(uploads\/)?/, 'uploads/');
            
          return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
        };
          
        setPopup({ ...data, imageUrl: getFileUrl(data.imageUrl) });
        setIsOpen(true);
      }
    }).catch(e => console.log('팝업 데이터를 불러오지 못했습니다.'));
  }, []);

  const closeToday = () => {
    // 24시간 동안 안 보기 설정 (임시로 true값만 저장)
    localStorage.setItem('hide_popup_today', 'true');
    setIsOpen(false);
  };

  if (!isOpen || !popup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md sm:max-w-lg animate__animated animate__zoomIn">
        
        {/* 팝업 이미지 클릭 시 링크 이동 */}
        <a href={popup.linkUrl || '#'} target={popup.linkUrl ? "_blank" : "_self"} rel="noreferrer" className="block cursor-pointer">
          <img 
            src={popup.imageUrl} 
            alt={popup.title || '이벤트 팝업'} 
            className="w-full aspect-[4/5] object-cover" 
          />
        </a>

        {/* 팝업 하단 컨트롤 버튼 */}
        <div className="flex bg-white border-t border-gray-100">
          <button onClick={closeToday}
            className="flex-1 py-3 text-sm text-gray-600 hover:bg-gray-100 transition-colors border-r border-gray-100">
              오늘 하루 보지 않기
          </button>
          <button onClick={() => setIsOpen(false)}
            className="flex-1 py-3 text-sm font-bold text-gray-800 hover:bg-gray-100 transition-colors">
              닫기
          </button>
        </div>

      </div>
    </div>
  );
}