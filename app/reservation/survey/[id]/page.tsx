'use client';

import React, { useState } from 'react';
import { Star, MessageSquareHeart, ChevronLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { reservationApi } from '@/src/api';

export default function SurveyPage() {
  const router = useRouter();
  const { id } = useParams();
  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0); // 별점 호버 이펙트용 상태
  const [comment, setComment] = useState('');

  // 별점 점수에 따른 텍스트 변화
  const ratingText: Record<number, string> = {
    1: "매우 아쉬웠어요 😥",
    2: "조금 아쉬웠어요 🙁",
    3: "보통이었어요 😐",
    4: "만족스러웠어요 🙂",
    5: "최고의 서비스였어요! 🤩"
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Swal.fire('알림', '별점을 선택해 주세요.', 'warning');
      return;
    }
    
    try {
      await reservationApi.submitReview(Number(id), { rating, comment });
      Swal.fire({
        icon: 'success',
        title: '등록 완료',
        text: '소중한 의견 감사합니다!',
        showConfirmButton: false,
        timer: 1500,
        customClass: { popup: 'rounded-[32px]' }
      }).then(() => {
        router.push('/mypage');
      });
    } catch (error) {
      Swal.fire('실패', '설문 등록 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      
      {/* 상단 뒤로가기 헤더 */}
      <header className="h-16 flex items-center px-6 max-w-2xl mx-auto w-full mt-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-800 flex items-center gap-1 font-bold transition-colors">
          <ChevronLeft className="w-5 h-5" /> 뒤로
        </button>
      </header>

      {/* 메인 컨텐츠 영역 (부드러운 등장 애니메이션) */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        className="flex-1 w-full max-w-lg mx-auto px-6 pt-4 pb-24 flex flex-col"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <MessageSquareHeart className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2.5 tracking-tight">서비스는 만족하셨나요?</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            예스케어의 더 나은 동행 서비스를 위해<br/>고객님의 소중한 의견을 들려주세요.
          </p>
        </div>
        
        {/* 설문조사 카드 영역 */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} key={num}>
                  <Star 
                    size={48}
                    fill={num <= (hoveredStar || rating) ? "#fbbf24" : "none"}
                    strokeWidth={1.5}
                    className={`cursor-pointer transition-colors duration-200 ${
                      num <= (hoveredStar || rating) ? "text-amber-400" : "text-gray-200"
                    }`}
                    onClick={() => setRating(num)}
                    onMouseEnter={() => setHoveredStar(num)}
                    onMouseLeave={() => setHoveredStar(0)}
                  />
                </motion.div>
              ))}
            </div>
            <p className="text-blue-600 font-extrabold text-lg h-6 transition-all">
              {ratingText[hoveredStar || rating] || "별점을 선택해주세요"}
            </p>
          </div>

          <div className="h-px bg-gray-100 w-full" />
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">
              상세 후기 <span className="text-gray-400 font-normal ml-1">(선택)</span>
            </label>
            <div className="relative">
              <textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                placeholder="매니저님의 동행에서 만족스러웠던 점이나 개선이 필요한 점을 자유롭게 남겨주세요."
                className="w-full h-36 p-5 bg-gray-50 text-gray-800 border border-transparent rounded-[20px] outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none text-[15px] leading-relaxed"
              />
              {/* 글자 수 카운터 표시 */}
              <div className="absolute bottom-4 right-4 text-xs font-bold text-gray-400 bg-white/80 px-2 py-1 rounded-md">
                {comment.length} / 500
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <motion.button whileTap={{ scale: 0.98 }}onClick={handleSubmit} 
            className="w-full bg-blue-900 text-white py-4.5 rounded-2xl font-bold text-[16px] hover:bg-blue-950 transition-all shadow-lg shadow-blue-900/20 mt-2">
            소중한 후기 제출하기
          </motion.button>
        </div>
      </motion.main>
    </div>
  );
}