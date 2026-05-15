'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { popupApi } from '@/src/api/index'; // API 임포트
import dayjs from 'dayjs';

export default function EventPopup() {
  const [popupData, setPopupData] = useState<{imageUrl: string, isActive: boolean} | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const checkPopup = async () => {
      // 1. 로컬 스토리지 확인 (오늘 하루 보지 않기 여부)
      const hideUntil = localStorage.getItem('hideEventPopupUntil');
      if (hideUntil && dayjs().isBefore(dayjs(hideUntil))) return;

      try {
        // 2. 백엔드에서 활성화된 팝업 데이터 가져오기
        const res = await popupApi.getActivePopup();
        if (res.data && res.data.isActive) {
          setPopupData(res.data);
          setIsVisible(true);
        }
      } catch (err) {
        console.error("팝업 데이터를 불러오는데 실패했습니다.");
      }
    };

    checkPopup();
  }, []);

  const handleClose = () => {
    if (isChecked) {
      const tomorrow = dayjs().add(1, 'day').startOf('day').toISOString();
      localStorage.setItem('hideEventPopupUntil', tomorrow);
    }
    setIsVisible(false);
  };

  if (!popupData) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="relative aspect-[3/4] bg-blue-50">
              <img 
                src={popupData.imageUrl} // 백엔드에서 받은 이미지 URL
                alt="이벤트 팝업" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between px-5 py-4 bg-white border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-600">오늘 하루 보지 않기</span>
              </label>
              
              <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}