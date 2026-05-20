// src/components/admin/tabs/NoticeTab.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { Megaphone, Loader2, Activity, FileText, Search } from 'lucide-react';
import { adminApi } from '@/src/api/index';
import NoticeModal from '../modals/NoticeModal';
import { Toast, YesAlert } from '@/src/utils/alert'; 
import EmptyState from '../ui/EmptyState'; // EmptyState 추가

// ==========================================
// 1. 타입 정의 (Type Safety)
// ==========================================
export interface Notice {
  id: number;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. 외부 분리 (렌더링마다 재생성 방지)
// ==========================================
const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
const tabVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

const NOTICE_TEMPLATE = `■ 주요 안내 사항
 - (공지하고자 하는 핵심 내용을 상세히 적어주세요.)

■ 적용 일시
 - 2024년 00월 00일 (요일) 00:00 부터 적용 예정

■ 기타 문의
 - 고객센터: 1588-0000 (운영시간: 평일 09:00 ~ 18:00)
 - 1:1 문의 게시판을 이용해 주시면 순차적으로 답변해 드리겠습니다.`;

// [최적화 3] 7일 이내 새 글 체크 함수 외부 분리
const isNewNotice = (dateString: string) => {
  if (!dateString) return false;
  const noticeDate = new Date(dateString);
  const today = new Date();
  const diffDays = Math.ceil(Math.abs(today.getTime() - noticeDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
};

export default function NoticeTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticePage, setNoticePage] = useState(0);
  const [noticeTotalPages, setNoticeTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [importanceFilter, setImportanceFilter] = useState(''); // '' | 'IMPORTANT' | 'GENERAL'

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', important: false });

  // 페이지 이동 시 최상단 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [noticePage]);

  // [최적화 2] 검색어 또는 필터가 변경되면 무조건 첫 페이지(0)로 초기화
  useEffect(() => {
    setNoticePage(0);
  }, [searchTerm, importanceFilter]);

  const fetchNotices = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const res = await adminApi.getAllNotices(page);
      setNotices(res.data.content || []);
      setNoticeTotalPages(res.data.totalPages || 0);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    fetchNotices(noticePage); 
  }, [fetchNotices, noticePage]);

  // 프론트엔드 검색/필터링 최적화
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const matchesSearch = (n.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = importanceFilter === 'IMPORTANT' ? n.important === true
                          : importanceFilter === 'GENERAL' ? n.important === false
                          : true;
      return matchesSearch && matchesFilter;
    });
  }, [notices, searchTerm, importanceFilter]);

  // [최적화 3] 상단 통계 카드 배열 메모이제이션
  const statsCards = useMemo(() => [
    { title: '전체 공지', value: `${notices.length}건`, icon: <Megaphone className="w-6 h-6 text-red-500" /> },
    { title: '중요 공지', value: `${notices.filter(n => n.important).length}건`, icon: <Activity className="w-6 h-6 text-red-600" /> },
    { title: '일반 공지', value: `${notices.filter(n => !n.important).length}건`, icon: <FileText className="w-6 h-6 text-slate-500" /> },
  ], [notices]);

  // 삭제 시 마지막 페이지 이슈 보정 로직
  const adjustPaginationAfterDelete = useCallback(() => {
    const newLength = notices.length - 1;
    const newTotalPages = Math.ceil(newLength / 10); // 한 페이지당 항목 수 10 가정
    if (noticePage > 0 && noticePage >= newTotalPages) {
      setNoticePage(Math.max(0, newTotalPages - 1));
    }
  }, [notices.length, noticePage]);

  const handleSaveNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) {
      return YesAlert.fire({ icon: 'warning', title: '알림', html: '제목과 내용을 입력해주세요.' });
    }
    try {
      if (selectedNotice) {
        await adminApi.updateNotice(selectedNotice.id, noticeForm);
      } else {
        await adminApi.createNotice(noticeForm);
        setNoticePage(0); // 새 글 작성 시 1페이지로 이동
      }
      Toast.fire({ icon: 'success', title: '저장되었습니다.' });
      setIsNoticeModalOpen(false);
      fetchNotices(noticePage);
    } catch (error) { 
      YesAlert.fire({ icon: 'error', title: '오류', html: '처리에 실패했습니다.' }); 
    }
  };

  const handleDeleteNotice = async (id: number) => {
    const result = await YesAlert.fire({ title: '공지 삭제', html: '정말 삭제하시겠습니까?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        await adminApi.deleteNotice(id);
        Toast.fire({ icon: 'success', title: '삭제되었습니다.' });
        adjustPaginationAfterDelete();
        fetchNotices(noticePage);
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '오류', html: '삭제에 실패했습니다.' });
      }
    }
  };

  const openNewNoticeModal = () => {
    setSelectedNotice(null);
    setNoticeForm({ title: '', content: NOTICE_TEMPLATE, important: false });
    setIsNoticeModalOpen(true);
  };

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {statsCards.map((stat, idx) => (
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
        <div className="p-5 border-b border-slate-100 bg-red-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
            <Megaphone className="w-5 h-5 text-red-600" /> 공지사항 관리
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <select value={importanceFilter} onChange={(e) => setImportanceFilter(e.target.value)}
              className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm cursor-pointer w-full sm:w-auto">
              <option value="">모든 공지</option>
              <option value="IMPORTANT">중요 공지</option>
              <option value="GENERAL">일반 공지</option>
            </select>
            <div className="relative w-full sm:w-64">
              <input type="text" placeholder="제목 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-all placeholder:text-slate-400"/>
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            </div>
            <button onClick={openNewNoticeModal} className="w-full sm:w-auto bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 shadow-sm whitespace-nowrap">
              + 새 공지 작성
            </button>
          </div>
        </div>
        
        {/* 1. PC 뷰: 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-4 pl-6 text-center">구분</th>
                <th className="p-4 text-center">제목</th>
                <th className="p-4 text-center">작성일</th>
                <th className="p-4 text-center pr-6">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading ? (
                <tr><td colSpan={4} className="p-16 text-center"><Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" /></td></tr>
              ) : filteredNotices.length > 0 ? (
                filteredNotices.map((n) => {
                  const createdDate = n.createdAt?.substring(0, 10);
                  const updatedDate = n.updatedAt?.substring(0, 10);
                  const isModified = updatedDate && createdDate !== updatedDate;

                  return (
                    <tr key={n.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 text-center">
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          {n.important ? (
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">중요</span>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold px-2 py-0.5 border border-slate-200 rounded whitespace-nowrap">일반</span>
                          )}
                          {isNewNotice(n.createdAt) && (
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-sm">NEW</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800">{n.title}</td>
                      <td className="p-4 text-center">
                        <span className="text-slate-500 text-xs font-medium">{createdDate}</span>
                        {isModified && (
                          <span className="text-[10px] text-slate-400 ml-1.5 block sm:inline">
                            (수정: {updatedDate})
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => { setSelectedNotice(n); setNoticeForm({ title: n.title, content: n.content, important: n.important }); setIsNoticeModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-bold text-xs transition-colors">수정</button>
                          <button onClick={() => handleDeleteNotice(n.id)} className="text-red-500 hover:text-red-700 font-bold text-xs transition-colors">삭제</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <EmptyState message="조건에 맞는 공지사항이 없습니다." isTable={true} colSpan={4} />
              )}
            </tbody>
          </table>
        </div>

        {/* 2. 모바일 뷰: 카드형 리스트 */}
        <div className="md:hidden flex flex-col gap-3 p-4 flex-1 overflow-y-auto bg-slate-50/50">
          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" /></div>
          ) : filteredNotices.length > 0 ? filteredNotices.map((n) => {
            const createdDate = n.createdAt?.substring(0, 10);
            const updatedDate = n.updatedAt?.substring(0, 10);
            const isModified = updatedDate && createdDate !== updatedDate;

            return (
              <div key={n.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    {n.important ? (
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">중요</span>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-bold px-2 py-0.5 border border-slate-200 rounded">일반</span>
                    )}
                    {isNewNotice(n.createdAt) && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">NEW</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] font-medium block">{createdDate}</span>
                    {isModified && <span className="text-[9px] text-slate-300 block">(수정됨)</span>}
                  </div>
                </div>

                <p className="font-bold text-slate-800 text-sm my-1">{n.title}</p>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 mt-1">
                  <button onClick={() => { setSelectedNotice(n); setNoticeForm({ title: n.title, content: n.content, important: n.important }); setIsNoticeModalOpen(true); }} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200">
                    수정
                  </button>
                  <button onClick={() => handleDeleteNotice(n.id)} className="bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50">
                    삭제
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className='flex justify-center py-8'>
              <EmptyState message="조건에 맞는 공지사항이 없습니다." isTable={false} />
            </div>
          )}
        </div>

        {/* 3. 페이지네이션 */}
        {noticeTotalPages > 0 && !loading && (
          <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
            <button disabled={noticePage === 0} onClick={() => setNoticePage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
            {[...Array(noticeTotalPages)].map((_, i) => (
              <button key={i} onClick={() => setNoticePage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${noticePage === i ? 'bg-red-600 text-white shadow-md shadow-red-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                {i + 1}
              </button>
            ))}
            <button disabled={noticePage >= noticeTotalPages - 1} onClick={() => setNoticePage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
          </div>
        )}
      </motion.div>

      <NoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        noticeForm={noticeForm}
        setNoticeForm={setNoticeForm}
        onSave={handleSaveNotice}
        selectedNotice={selectedNotice}
      />
    </>
  );
}