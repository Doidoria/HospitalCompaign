// src/components/admin/tabs/ManagerTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Loader2, FileText, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { adminApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import EmptyState from '../ui/EmptyState';

const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
const tabVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

// 페이지당 보여줄 아이템 수
const ITEMS_PER_PAGE = 10;

export default function ManagerTab() {
  const [pendingManagers, setPendingManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mgrAppStatus, setMgrAppStatus] = useState('WAITING');
  const [stats, setStats] = useState({ total: 0, waiting: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    adminApi.getManagerStats().then(res => setStats(res.data));
  }, []);  // 마운트 시 1회만, 탭 변경과 무관하게

  const fetchStats = useCallback(async () => {
    const res = await adminApi.getManagerStats();
    setStats(res.data);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  
  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);

  const getLicenseName = (code: string) => {
    switch (code) {
      case 'caregiver': return '요양보호사';
      case 'socialworker': return '사회복지사';
      case 'nurse': return '간호사/간호조무사';
      case 'other': return '기타';
      case 'none': return '없음';
      default: return code;
    }
  };

  const getFileUrl = (path: string) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
    
    // DB에 'uploads/'가 없이 파일명만 있을 경우를 대비해 강제로 붙여주는 로직
    const cleanPath = path.startsWith('/uploads/') || path.startsWith('uploads/')
      ? path.replace(/^\//, '')
      : `uploads/${path.replace(/^\//, '')}`;
      
    return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
  };

  const fetchManagerApplications = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingManagers(status);
      setPendingManagers(res.data);
    } catch (error) { 
      Toast.fire({ icon: 'error', title: '지원서 목록을 불러오지 못했습니다.' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchManagerApplications(mgrAppStatus); }, [mgrAppStatus, fetchManagerApplications]);

  const handleApprove = async (memberId: number, name: string) => {
    const result = await YesAlert.fire({
      title: '매니저 승인', html: `${name} 님의 매니저 자격을 승인하시겠습니까?`, icon: 'question',
      showCancelButton: true, confirmButtonText: '승인',
    });
    if (result.isConfirmed) {
      await adminApi.approveManager(memberId);
      Toast.fire({ icon: 'success', title: `${name} 님이 승인되었습니다.` });
      fetchManagerApplications(mgrAppStatus);
      fetchStats();
    }
  };

  const handleReject = async (applicationId: number, name: string) => {
    const { value: reason } = await YesAlert.fire({
      title: '반려 사유 입력', input: 'textarea',
      showCancelButton: true, confirmButtonText: '반려 처리',
      inputValidator: (value) => !value ? '반려 사유를 입력해야 합니다!' : null
    });
    if (reason) {
      await adminApi.rejectManagerApp(applicationId, { reason: reason });
      Toast.fire({ icon: 'success', title: '지원이 반려되었습니다.' });
      fetchManagerApplications(mgrAppStatus);
      fetchStats();
    }
  };

  // 탭 변경 시 페이지 1로 초기화하는 핸들러
  const handleTabChange = (status: string) => {
    setMgrAppStatus(status);
    setCurrentPage(1);
  };

  // ==========================================
  // 페이지네이션 계산 로직
  // ==========================================
  const totalPages = Math.ceil(pendingManagers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  // 현재 페이지에 보여줄 데이터만 슬라이스
  const currentManagers = pendingManagers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null; // 1페이지 이하면 버튼 숨김

    return (
      <div className="flex items-center justify-center gap-2 py-6 border-t border-slate-100 bg-white">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                currentPage === page 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {[
          { title: '총 지원자 (전체)', value: `${stats.total}명`, icon: <FileText className="w-6 h-6 text-slate-500" /> },
          { title: '신규 대기', value: `${stats.waiting}명`, icon: <UserPlus className="w-6 h-6 text-emerald-500" /> },
          { title: '승인 완료', value:  `${stats.approved}명`, icon: <CheckCircle2 className="w-6 h-6 text-blue-500" /> },
          { title: '반려 내역', value: `${stats.rejected}명`, icon: <XCircle className="w-6 h-6 text-red-500" /> },
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
      
      <motion.div variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 bg-emerald-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" /> 가입 승인 대기 목록
          </h2>
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
            {['WAITING', 'APPROVED', 'REJECTED'].map(s => (
              <button 
                key={s} 
                onClick={() => handleTabChange(s)} 
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mgrAppStatus === s ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {s === 'WAITING' ? '신규 대기' : s === 'APPROVED' ? '승인 완료' : '반려 내역'}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-4 font-bold pl-6">지원일자</th>
                <th className="p-4 font-bold">이름/연락처</th>
                <th className="p-4 font-bold">보유 자격증</th>
                <th className="p-4 font-bold text-center">근무 가능 시간</th>
                <th className="p-4 font-bold text-center">첨부파일</th>
                <th className="p-4 font-bold text-center pr-6">계정 승인</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading ? (
                <tr><td colSpan={6} className="p-16 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></td></tr>
              ) : currentManagers.length > 0 ? currentManagers.map((mgr) => (
                <tr key={mgr.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-slate-500 font-medium">{mgr.applyDate}</td>
                  <td className="p-4"><p className="font-bold text-slate-800">{mgr.name}</p><p className="text-xs text-slate-500 mt-0.5">{mgr.phone}</p></td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100">
                      {getLicenseName(mgr.licenseName)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex gap-1 flex-wrap justify-center">
                        {mgr.availableDays?.split(',').map((day: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            {day.trim()}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">{mgr.availableTime}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {mgr.certificateUrl ? (
                      <a href={getFileUrl(mgr.certificateUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm"><FileText className="w-3.5 h-3.5" /> 보기</a>
                    ) : <span className="text-slate-300 text-xs font-medium">없음</span>}
                  </td>
                  <td className="p-4 pr-6 text-center">
                    {mgrAppStatus === 'WAITING' && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleApprove(mgr.memberId, mgr.name)} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"><CheckCircle2 className="w-4 h-4" /> 승인</button>
                        <button onClick={() => handleReject(mgr.id, mgr.name)} className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm"><XCircle className="w-4 h-4" /> 반려</button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <EmptyState message="대기 중인 지원서가 없습니다." isTable={true} />
              )}
            </tbody>
          </table>
        </div>

        {/* 2. 모바일 뷰: 카드형 리스트 */}
        <div className="md:hidden flex flex-col gap-3 p-4 flex-1 overflow-y-auto bg-slate-50/50">
          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
          ) : currentManagers.length > 0 ? currentManagers.map((mgr) => (
            <div key={mgr.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">{mgr.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{mgr.phone}</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
                  {getLicenseName(mgr.licenseName)}
                </span>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">지원일자</span>
                  <span className="text-slate-700 font-medium">{mgr.applyDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block mb-1">근무 가능 시간</span>
                  <div className="flex gap-1 flex-wrap mb-1">
                    {mgr.availableDays?.split(',').map((day: string, idx: number) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">{day.trim()}</span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium">{mgr.availableTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {mgr.certificateUrl && (
                  <a href={getFileUrl(mgr.certificateUrl)} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm">
                    증명서 보기
                  </a>
                )}
                {mgrAppStatus === 'WAITING' && (
                  <>
                    <button onClick={() => handleApprove(mgr.memberId, mgr.name)} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm">승인</button>
                    <button onClick={() => handleReject(mgr.id, mgr.name)} className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm">반려</button>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className='flex justify-center'>
              <EmptyState message="대기 중인 지원서가 없습니다." isTable={false} />
            </div>
          )}
        </div>
        
        {/* 페이지네이션 UI 렌더링 영역 (PC/모바일 공통 적용) */}
        {!loading && renderPagination()}

      </motion.div>
    </>
  );
}