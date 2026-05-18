// src/components/admin/tabs/InquiryTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { MessageCircleQuestion, Loader2, Lock, Activity, CheckCircle2 } from 'lucide-react';
import { adminApi, inquiryApi } from '@/src/api/index';
import InquiryModal from '../modals/InquiryModal';
import { Toast, YesAlert } from '@/src/utils/alert';

const containerVariants: Variants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};
const itemVariants: Variants = { 
  hidden: { opacity: 0, y: 10 }, 
  visible: { opacity: 1, y: 0 } 
};
const tabVariants: Variants = { 
  hidden: { opacity: 0, y: 15 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } 
};

export default function InquiryTab() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiryPage, setInquiryPage] = useState(0);
  const [inquiryTotalPages, setInquiryTotalPages] = useState(0); // ✅ 누락된 페이지네이션 상태 복구
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllInquiries(inquiryPage, inquiryStatusFilter);
      setInquiries(res.data?.content || []);
      setInquiryTotalPages(res.data?.totalPages || 0); // ✅ 총 페이지 수 업데이트 복구
    } finally { setLoading(false); }
  }, [inquiryPage, inquiryStatusFilter]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleOpenDetail = async (id: number) => {
    setIsInquiryModalOpen(true);
    setSelectedInquiry(null);
    setAnswerInput('');
    try {
      const res = await inquiryApi.getInquiry(id);
      setSelectedInquiry(res.data);
      if (res.data.answer) setAnswerInput(res.data.answer);
    } catch {
      setIsInquiryModalOpen(false);
      YesAlert.fire({ icon: 'error', title: '오류', html: '정보를 불러올 수 없습니다.' });
    }
  };

  const submitAnswer = async () => {
    if (!answerInput.trim()) return YesAlert.fire({ icon: 'warning', title: '알림', html: '답변을 입력해주세요.' });
    
    setIsSubmitting(true);
    try {
      await adminApi.answerInquiry(selectedInquiry.id, answerInput);
      Toast.fire({ icon: 'success', title: '답변이 등록되었습니다.' });
      setIsInquiryModalOpen(false);
      fetchInquiries();
    } catch {
      YesAlert.fire({ icon: 'error', title: '오류', html: '등록에 실패했습니다.' });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {[
          { title: '전체 문의', value: `${inquiries.length}건`, icon: <MessageCircleQuestion className="w-6 h-6 text-blue-500" /> },
          { title: '답변 대기', value: `${inquiries.filter(i => i.status === 'PENDING').length}건`, icon: <Activity className="w-6 h-6 text-orange-500" /> },
          { title: '답변 완료', value: `${inquiries.filter(i => i.status === 'ANSWERED').length}건`, icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
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
        <div className="p-5 border-b border-slate-100 bg-blue-50/30 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5 text-blue-600" /> 고객센터 관리
          </h2>
          <select value={inquiryStatusFilter} onChange={(e) => {setInquiryStatusFilter(e.target.value); setInquiryPage(0);}} 
          className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
            <option value="">모든 상태</option>
            <option value="PENDING">답변 대기</option>
            <option value="ANSWERED">답변 완료</option>
          </select>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold pl-6">ID / 분류</th>
                <th className="p-4 font-bold">제목 / 작성자</th>
                <th className="p-4 font-bold">상태 / 작성일</th>
                <th className="p-4 font-bold text-center pr-6">답변 관리</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading ? (
                <tr><td colSpan={4} className="p-16 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></td></tr>
              ) : inquiries.length > 0 ? (
                inquiries.map((inq) => (
                  <tr key={inq.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">#{inq.id}</span>
                        {/* 카테고리(분류) 뱃지 */}
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {inq.category === 'RESERVATION' ? '예약/매칭' : 
                           inq.category === 'PAYMENT' ? '결제/환불' : 
                           inq.category === 'SERVICE' ? '서비스 이용' : '기타'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 cursor-pointer hover:underline flex items-center gap-1.5" onClick={() => handleOpenDetail(inq.id)}>
                        {inq.isPrivate && <Lock className="w-4 h-4 text-slate-400" />}
                        {inq.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{inq.authorName} ({inq.authorEmail || '이메일 없음'})</p>
                    </td>
                    <td className="p-4">
                      {/* 상태 뱃지 테두리 디자인 및 작성일자 */}
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${inq.status === 'ANSWERED' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                        {inq.status === 'ANSWERED' ? '답변완료' : '답변대기'}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{inq.createdAt?.substring(0, 10)}</p>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      {/* 답변 수정 버튼 오리지널 테마(흰 배경 + 회색 테두리) */}
                      {inq.status === 'PENDING' ? (
                        <button onClick={() => handleOpenDetail(inq.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
                          답변 달기
                        </button>
                      ) : (
                        <button onClick={() => handleOpenDetail(inq.id)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                          답변 수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-16 text-center text-slate-400">조건에 맞는 문의 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. 모바일 뷰: 카드형 리스트 */}
        <div className="md:hidden flex flex-col gap-3 p-4 flex-1 overflow-y-auto bg-slate-50/50">
          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>
          ) : inquiries.length > 0 ? inquiries.map((inq) => (
            <div key={inq.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold text-xs">#{inq.id}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                    {inq.category === 'RESERVATION' ? '예약/매칭' : inq.category === 'PAYMENT' ? '결제/환불' : inq.category === 'SERVICE' ? '서비스 이용' : '기타'}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${inq.status === 'ANSWERED' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                  {inq.status === 'ANSWERED' ? '답변완료' : '답변대기'}
                </span>
              </div>
              
              <div onClick={() => handleOpenDetail(inq.id)} className="cursor-pointer group">
                <p className="font-bold text-slate-800 flex items-center gap-1.5 text-sm group-hover:text-blue-600 transition-colors">
                  {inq.isPrivate && <Lock className="w-3.5 h-3.5 text-slate-400" />} {inq.title}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-medium text-slate-600">{inq.authorName}</span>
                  <span className="text-[11px] text-slate-400">{inq.createdAt?.substring(0, 10)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-50">
                <button onClick={() => handleOpenDetail(inq.id)} className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex justify-center items-center gap-1 ${inq.status === 'PENDING' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {inq.status === 'PENDING' ? '답변 달기' : '답변 수정'}
                </button>
              </div>
            </div>
          )) : (
            <div className="py-16 text-center text-slate-400 text-sm">조건에 맞는 문의 내역이 없습니다.</div>
          )}
        </div>

        {/* 페이지네이션 블록 */}
        {inquiryTotalPages > 0 && (
          <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
            <button disabled={inquiryPage === 0} onClick={() => setInquiryPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
            {[...Array(inquiryTotalPages)].map((_, i) => (
              <button key={i} onClick={() => setInquiryPage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${inquiryPage === i ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                {i + 1}
              </button>
            ))}
            <button disabled={inquiryPage >= inquiryTotalPages - 1} onClick={() => setInquiryPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
          </div>
        )}
      </motion.div>

      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        selectedInquiry={selectedInquiry}
        answerInput={answerInput}
        setAnswerInput={setAnswerInput}
        onSubmit={submitAnswer}
        isSubmitting={isSubmitting}
      />
    </>
  );
}