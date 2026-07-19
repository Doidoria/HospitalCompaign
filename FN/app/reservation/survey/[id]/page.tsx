// app/reservation/survey/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Star, CheckCircle2, Loader2, MessageSquare, Sparkles, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { reviewApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';

export default function ReservationSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = Number(params.id);

  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null); // 별점 호버 효과용 상태
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedComment = localStorage.getItem(`draft_review_${reservationId}`);
    if (savedComment) {
      setComment(savedComment);
    }
  }, [reservationId]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setComment(text);
    localStorage.setItem(`draft_review_${reservationId}`, text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      YesAlert.fire({ 
        icon: 'warning', 
        title: '안내', 
        text: '매니저님에게 큰 힘이 되는 후기를 최소 10자 이상 작성해주세요.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 백엔드로 데이터 전송 (필드명: rating, comment)
      await reviewApi.createReview(reservationId, { rating, comment });

      localStorage.removeItem(`draft_review_${reservationId}`);
      
      await YesAlert.fire({
        icon: 'success',
        title: '소중한 후기 감사합니다!',
        text: '작성해주신 후기가 성공적으로 등록되었습니다.',
        confirmButtonColor: '#059669'
      });
      router.push('/mypage'); 
    } catch (error: any) {
      YesAlert.fire({ 
        icon: 'error', 
        title: '등록 실패', 
        text: error.response?.data?.message || '오류가 발생했습니다. 다시 시도해 주세요.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-24">
      
      {/* 상단 헤더 영역 (UI 개선) */}
      <section className="bg-gradient-to-b from-blue-950 to-blue-900 text-white py-12 md:py-16 px-6 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center justify-center bg-white/10 p-3 rounded-full mb-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">서비스 만족도 조사</h2>
          <p className="text-blue-200 text-sm md:text-base break-keep">
            고객님의 소중한 의견은 예스케어 서비스 발전에 큰 도움이 됩니다.
          </p>
        </div>
      </section>

      {/* 폼 영역 */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="bg-white p-6 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. 별점 선택 영역 (인터랙션 강화) */}
            <div className="flex flex-col items-center bg-gray-50/50 border border-gray-100 p-8 rounded-3xl">
              <span className="text-base font-bold text-gray-800 mb-4">이번 동행 서비스는 어떠셨나요?</span>
              <div className="flex gap-2 mb-2" onMouseLeave={() => setHoveredStar(null)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    className="transition-transform hover:scale-110 focus:outline-none p-1"
                  >
                    <Star 
                      className={`w-12 h-12 transition-colors duration-200 ${
                        star <= (hoveredStar ?? rating) 
                          ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                          : 'fill-gray-200 text-gray-200'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2">
                {rating}점 평가
              </span>
            </div>

            {/* 2. 상세 내용 입력 영역 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <label className="block text-base font-bold text-gray-800">상세 이용 후기</label>
              </div>
              <div className="relative">
                <textarea
                  rows={6}
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="매니저님의 친절도, 시간 엄수, 진료 내용 전달 등 좋았던 점이나 아쉬웠던 점을 자유롭게 적어주세요. (최소 10자)"
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none bg-white transition-all text-gray-700 leading-relaxed placeholder:text-gray-400"
                ></textarea>
                <div className={`absolute bottom-4 right-4 text-xs font-medium ${comment.length < 10 ? 'text-red-400' : 'text-emerald-500'}`}>
                  {comment.length} / 10자 이상
                </div>
              </div>
            </div>

            {/* 후기 관리 규정 안내 영역 */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex gap-3 mt-6">
              <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="text-[13px] text-gray-500 leading-relaxed break-keep space-y-1">
                <p className="font-bold text-gray-700 mb-1">후기 작성 및 관리 안내</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>작성해주신 후기는 익명(이름 마스킹) 처리되어 예스케어 서비스 홍보 목적으로 활용될 수 있습니다.</li>
                  <li>욕설, 비방, 허위 사실 유포, 타인의 개인정보(연락처 등)가 포함된 내용은 <strong>통보 없이 삭제되거나 노출이 제한</strong>될 수 있습니다.</li>
                </ul>
              </div>
            </div>

            {/* 3. 액션 버튼 영역 */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-1/3 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors active:scale-95"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-2/3 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>등록 중...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>후기 등록하기</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}