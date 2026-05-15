// src/components/admin/tabs/ReviewTab.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Star, FileText, UserCog, XCircle, Loader2, Inbox, Activity, CheckCircle2 } from 'lucide-react';
import { adminApi } from '@/src/api/index';
import { motion, Variants } from 'framer-motion';
import { Toast, YesAlert } from '@/src/utils/alert';

interface ReviewTabProps {
  handleOpenDetail: (id: number) => void;
  handleViewMemberProfile: (managerName: string) => void;
}

const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
const tabVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function ReviewTab({ handleOpenDetail, handleViewMemberProfile }: ReviewTabProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const res = await adminApi.getAllReviews(page);
      setReviews(res.data?.content || []);
      setReviewTotalPages(res.data?.totalPages || 0);
    } catch (error) {
      console.error(error);
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchReviews(reviewPage);
  }, [fetchReviews, reviewPage]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return "0.0";
    const total = reviews.reduce((acc: number, cur: any) => acc + (cur.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => 
      (r.comment || '').toLowerCase().includes(reviewSearchTerm.toLowerCase()) || 
      String(r.reservationId || '').includes(reviewSearchTerm)
    );
  }, [reviews, reviewSearchTerm]);

  const handleDeleteReview = async (id: number) => {
    const result = await YesAlert.fire({
      title: '리뷰 삭제', html: '정말 이 리뷰를 삭제하시겠습니까?', icon: 'warning',
      showCancelButton: true, confirmButtonText: '삭제'
    });

    if (result.isConfirmed) {
      try {
        await adminApi.deleteReview(id);
        Toast.fire({ icon: 'success', title: '삭제됨' });
        fetchReviews(reviewPage); 
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '오류', html: '삭제 중 문제가 발생했습니다.' });
      }
    }
  };

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {[
          { title: '전체 리뷰', value: `${reviews.length}건`, icon: <Star className="w-6 h-6 text-amber-500" /> },
          { title: '평균 평점', value: `${avgRating}점`, icon: <Activity className="w-6 h-6 text-blue-500" /> },
          { title: '만점(5점) 리뷰', value: `${reviews.filter(r => r.rating === 5).length}건`, icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
          { title: '주의(2점 이하) 리뷰', value: `${reviews.filter(r => r.rating <= 2).length}건`, icon: <XCircle className="w-6 h-6 text-red-500" /> },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">{stat.icon}</div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">{stat.title}</p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mt-6 flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-amber-50/30 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> 작성된 리뷰 모니터링
          </h2>
          <div className="relative w-64">
            <input type="text" placeholder="예약번호 또는 내용 검색..." value={reviewSearchTerm} onChange={(e) => setReviewSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="p-4 pl-6">리뷰 ID</th>
                <th className="p-4">예약 번호 / 작성자</th>
                <th className="p-4 text-center">동행 매니저</th>
                <th className="p-4">평점</th>
                <th className="p-4 w-2/5">리뷰 내용</th>
                <th className="p-4 text-center pr-6">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading ? (
                <tr><td colSpan={6} className="p-16 text-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" /></td></tr>
              ) : filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-400">#{review.id}</td>
                    <td className="p-4">
                      <button className="text-blue-600 font-bold hover:underline flex items-center gap-1" onClick={() => handleOpenDetail(review.reservationId)}>
                        예약 #{review.reservationId} <FileText className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-slate-500 mt-1">{review.authorName}</p>
                    </td>
                    <td className="p-4 text-center">
                      {review.managerName ? (
                        <button onClick={() => handleViewMemberProfile(review.managerName)} className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-bold flex items-center gap-1 mx-auto">
                          <UserCog className="w-3.5 h-3.5" /> {review.managerName}
                        </button>
                      ) : <span className="text-slate-400 text-xs">배정 안됨</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />)}
                        <span className="ml-1.5 text-slate-700 font-bold text-xs">{review.rating}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium break-all">{review.comment}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDeleteReview(review.id)} className="text-xs flex items-center justify-center gap-1 mx-auto bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-50">
                        <XCircle className="w-3.5 h-3.5" /> 삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="py-16 text-center text-slate-400">등록된 리뷰가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {reviewTotalPages > 0 && (
          <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
            <button disabled={reviewPage === 0} onClick={() => setReviewPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
            {[...Array(reviewTotalPages)].map((_, i) => (
              <button key={i} onClick={() => setReviewPage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${reviewPage === i ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{i + 1}</button>
            ))}
            <button disabled={reviewPage >= reviewTotalPages - 1} onClick={() => setReviewPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
          </div>
        )}
      </motion.div>
    </>
  );
}