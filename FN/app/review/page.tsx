// app/review/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircleHeart, Loader2, ChevronDown, Info, ShieldAlert } from 'lucide-react'; // 아이콘 추가
import { reviewApi } from '@/src/api/index';
import dayjs from 'dayjs';

interface Review {
  id: number;
  reservationId: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false); // [신규] 규정 안내문 토글 상태
  
  // 리스트 페이징 상태 관리
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const SIZE = 10; 

  const fetchReviews = async (currentPage: number, isInitial = false) => {
    try {
      isInitial ? setIsLoading(true) : setIsLoadingMore(true);
      const res = await reviewApi.getReviews(currentPage, SIZE);
      const fetchedData = res.data.content || res.data;
      
      if (fetchedData.length < SIZE) {
        setHasMore(false); 
      }

      setReviews(prev => isInitial ? fetchedData : [...prev, ...fetchedData]);
    } catch (err) {
      console.error("리뷰 로딩 실패:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(0, true);
  }, []);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage);
    }
  };

  const maskName = (name: string) => {
    if (!name || name.length < 2) return name;
    if (name.length === 2) return name[0] + '*';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <section className="bg-blue-950 text-white py-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center justify-center bg-blue-900/50 p-3 rounded-2xl mb-2">
            <MessageCircleHeart className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">생생한 이용 후기</h2>
          <p className="text-blue-200 text-lg">예스케어와 함께한 고객님들의 따뜻한 이야기입니다.</p>
        </motion.div>
      </section>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        
        {/* 클린 리뷰 운영 규정 안내 영역 */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <button 
            onClick={() => setIsPolicyOpen(!isPolicyOpen)}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-700 font-bold">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              예스케어 클린 리뷰 운영 정책 안내
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isPolicyOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isPolicyOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-100"
              >
                <div className="p-5 text-sm text-gray-600 leading-relaxed space-y-3 bg-white">
                  <p>예스케어는 고객님들의 솔직한 후기를 바탕으로 더 나은 동행 서비스를 만들어가고 있습니다. 단, 건전한 서비스 환경 조성을 위해 아래와 같은 리뷰는 <strong>사전 통보 없이 비공개 처리 또는 삭제</strong>될 수 있습니다.</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-500">
                    <li>근거 없는 비방, 욕설, 인신공격 등이 포함된 경우</li>
                    <li>사실과 다르거나 고의적으로 평점을 훼손하는 어뷰징 행위</li>
                    <li>특정 매니저의 개인정보(실명, 연락처 등)를 무단으로 노출한 경우</li>
                    <li>서비스 이용과 무관한 광고성, 스팸성 게시글</li>
                  </ul>
                  <p className="text-amber-600 font-medium pt-2 flex items-center gap-1.5 border-t border-gray-50">
                    <Info className="w-4 h-4" /> 악의적인 리뷰로 인해 매니저 또는 플랫폼에 심각한 피해가 발생할 경우, 관련 법령에 따른 조치가 취해질 수 있습니다.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-3xl shadow-sm border border-gray-100">
            아직 작성된 후기가 없습니다. 첫 후기의 주인공이 되어주세요!
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {reviews.map((review, idx) => (
                <motion.div 
                  key={`${review.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: (idx % SIZE) * 0.1 }} 
                  className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {maskName(review.authorName)} <span className="text-gray-400 font-normal ml-1">보호자님</span>
                      </p>
                    </div>
                    <span className="text-sm text-gray-400">{dayjs(review.createdAt).format('YYYY.MM.DD')}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            {hasMore && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex justify-center pt-6"
              >
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full text-gray-600 font-medium hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronDown className="w-5 h-5" />}
                  더보기
                </button>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}