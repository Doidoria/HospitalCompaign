// src/components/admin/tabs/ReservationTab.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarDays, Activity, Users, UserPlus, Search, Loader2, CheckCircle2, Send, UserMinus } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { adminApi, reservationApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';

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

export default function ReservationTab({ handleOpenDetail, members, handleAssignManager, handleCancelAssign, handleViewMemberProfile }: any) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchReservations = useCallback(async (page: number, keyword: string, status: string) => {
    setLoading(true);
    try {
      const res = (keyword || status) 
        ? await adminApi.searchReservations(keyword, status, page)
        : await adminApi.getReservations(page); 
      
      const formattedData = res.data.content.map((r: any) => {
        const dateObj = new Date(r.reservationTime);
        return {
          id: r.id, 
          date: dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          time: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          patient: r.patientName,
          hospital: r.hospitalName,
          status: r.status, 
          manager: r.managerName || (r.status === 'CONFIRMED' ? '배정완료' : '-') 
        };
      });
      setReservations(formattedData);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('예약 로딩 에러:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 0) setCurrentPage(0); 
      else fetchReservations(0, searchTerm, statusFilter);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, currentPage, fetchReservations]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await reservationApi.updateStatus(id, newStatus);
      Toast.fire({ icon: 'success', title: '상태가 변경되었습니다.' });
      fetchReservations(currentPage, searchTerm, statusFilter);
    } catch (error) {
      YesAlert.fire({ icon: 'error', title: '오류', html: '상태 변경에 실패했습니다.' });
    }
  };

  const activeManagerCount = useMemo(() => {
    if (!members || members.length === 0) return 0;
    return members.filter((m: any) => m.role.includes('MANAGER')).length;
  }, [members]);

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {[
          { title: '전체 예약', value: `${reservations.length}건`, icon: <CalendarDays className="w-6 h-6 text-blue-500" /> },
          { title: '매칭 대기', value: `${reservations.filter(r => r.status === 'WAITING').length}건`, icon: <Activity className="w-6 h-6 text-orange-500" /> },
          { title: '활동 매니저', value: `${activeManagerCount}명`, icon: <Users className="w-6 h-6 text-emerald-500" /> },
          { title: '신규 지원', value: `확인필요`, icon: <UserPlus className="w-6 h-6 text-purple-500" /> },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} 
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">{stat.icon}</div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">{stat.title}</p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col mt-6">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800">예약 리스트</h2>
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center w-full sm:w-auto gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
              <option value="">상태 전체</option>
              <option value="WAITING">매칭 대기</option>
              <option value="CONFIRMED">예약 확정</option>
              <option value="COMPLETED">이용 완료</option>
              <option value="CANCELLED">취소됨</option>
            </select>
            <div className="relative w-full sm:w-64">
              <input type="text" placeholder="환자명, 병원명 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm placeholder:text-slate-400" />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            </div>
          </form>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/90 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold pl-6">예약번호</th>
                <th className="p-4 font-bold">일시</th>
                <th className="p-4 font-bold">환자/병원</th>
                <th className="p-4 font-bold">상태 및 매니저</th>
                <th className="p-4 font-bold text-center pr-6">상세 및 배정 관리</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading && reservations.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></td></tr>
              ) : reservations.length > 0 ? reservations.map((res) => (
                <tr key={res.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-slate-400 font-medium">#{res.id}</td>
                  <td className="p-4"><p className="font-semibold text-slate-800">{res.date}</p><p className="text-xs text-slate-500 mt-0.5">{res.time}</p></td>
                  <td className="p-4"><p className="font-bold text-slate-800">{res.patient}</p><p className="text-xs text-slate-500 mt-0.5">{res.hospital}</p></td>
                  <td className="p-4">
                    <StatusBadge status={res.status} />
                    {(res.status === 'CONFIRMED' || res.status === 'COMPLETED') && res.manager !== '-' && (
                      <button onClick={() => {
                          const managerInfo = members.find((m:any) => m.name === res.manager && m.role.includes('MANAGER'));
                          if (managerInfo) {
                            handleViewMemberProfile(managerInfo);
                          } else {
                            YesAlert.fire({ icon: 'warning', title: '알림', html: '매니저 상세 정보를 찾을 수 없습니다.' });
                          }
                        }}
                        className="text-xs font-bold text-emerald-600 mt-1.5 flex items-center gap-1 hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {res.manager} 배정됨
                      </button>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => handleOpenDetail(res.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1">상세 보기</button>
                      {res.status === 'WAITING' ? (
                        <button onClick={async () => {
                            const success = await handleAssignManager(res.id);
                            if (success) fetchReservations(currentPage, searchTerm, statusFilter);
                          }} 
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" /> 매니저 배정
                        </button>
                      ) : res.status === 'CONFIRMED' ? (
                        <button onClick={async () => {
                            const success = await handleCancelAssign(res.id);
                            if (success) fetchReservations(currentPage, searchTerm, statusFilter);
                          }} 
                          className="px-3 py-1.5 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-all shadow-sm flex items-center gap-1.5">
                          <UserMinus className="w-3.5 h-3.5" /> 배정 취소
                        </button>
                      ) : null}
                      <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                        <option value="WAITING">매칭 대기</option><option value="CONFIRMED">예약 확정</option><option value="COMPLETED">이용 완료</option><option value="CANCELLED">취소됨</option>
                      </select>
                    </div>
                  </td>
                  </tr>
                )) : (
                <EmptyState message="조건에 맞는 예약이 없습니다." colSpan={5} />
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 0 && (
          <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{i + 1}</button>
            ))}
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
          </div>
        )}
      </motion.div>
    </>
  );
}