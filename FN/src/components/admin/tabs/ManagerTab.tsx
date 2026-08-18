// src/components/admin/tabs/ManagerTab.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus, Loader2, FileText, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { adminApi } from '@/src/api/index';
import { Toast, YesAlert, MySwal } from '@/src/utils/alert';
import EmptyState from '../ui/EmptyState';

interface ManagerApplication {
  id: number;
  memberId: number;
  name: string;
  phone: string;
  licenseName: string;
  applyDate: string;
  availableDays: string;
  availableTime: string;
  certificateUrl: string | null;
  rejectReason?: string;
  experience?: string;
  motivation?: string;
}

interface ManagerTabProps {
  refreshBadges?: () => void;
}

const ITEMS_PER_PAGE = 10;

const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
const tabVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

const getLicenseName = (code: string) => {
  const licenseMap: Record<string, string> = {
    caregiver: '요양보호사',
    socialworker: '사회복지사',
    nurse: '간호사/간호조무사',
    none: '없음',
  };
  return licenseMap[code] || '기타';
};

const getFileUrl = (path: string) => {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
  const cleanPath = path.replace(/^\/?(uploads\/)?/, 'uploads/');
    
  return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
};

export default function ManagerTab({ refreshBadges }: ManagerTabProps) {
  const [pendingManagers, setPendingManagers] = useState<ManagerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [mgrAppStatus, setMgrAppStatus] = useState('WAITING');
  const [stats, setStats] = useState({ total: 0, waiting: 0, approved: 0, rejected: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getManagerStats();
      setStats(res.data);
    } catch (error) {
      console.error('통계 로드 실패', error);
    }
  }, []);

  const fetchManagerApplications = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingManagers(status);
      setPendingManagers(res.data);
    } catch (error) { 
      Toast.fire({ icon: 'error', title: '목록을 불러오지 못했습니다.' });
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchManagerApplications(mgrAppStatus); }, [mgrAppStatus, fetchManagerApplications]);

  const adjustPaginationAfterAction = useCallback(() => {
    setPendingManagers((prev) => {
      const newLength = prev.length - 1;
      const newTotalPages = Math.ceil(newLength / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      return prev;
    });
  }, [currentPage]);

  const handleApprove = async (memberId: number, name: string) => {
    const result = await YesAlert.fire({
      title: '프리랜서 매니저 승인', // 💡 타이틀 변경
      html: `${name} 님을 <strong>프리랜서 매니저(FREE)</strong>로 승인하시겠습니까?`,
      icon: 'question',
      showCancelButton: true, confirmButtonText: '승인',
    });
    if (result.isConfirmed) {
      await adminApi.approveManager(memberId, 'FREE'); 
      Toast.fire({ icon: 'success', title: `${name} 님이 FREE 매니저로 승인되었습니다.` });
      adjustPaginationAfterAction();
      fetchManagerApplications(mgrAppStatus);
      fetchStats();
      if (refreshBadges) refreshBadges();
    }
  };

  const handleReject = async (applicationId: number, name: string) => {
    const { value: reason } = await YesAlert.fire({
      title: '반려 사유 입력', input: 'textarea',
      showCancelButton: true, confirmButtonText: '반려 처리',
      inputValidator: (value: string) => !value ? '반려 사유를 입력해야 합니다!' : null
    });
    if (reason) {
      await adminApi.rejectManagerApp(applicationId, { reason: reason });
      Toast.fire({ icon: 'success', title: '지원이 반려되었습니다.' });
      adjustPaginationAfterAction();
      fetchManagerApplications(mgrAppStatus);
      fetchStats();
      if (refreshBadges) refreshBadges();
    }
  };

  // 지원서 상세 보기 팝업 함수 (모바일 반응형 & 패딩 최적화)
  const handleViewDetails = (mgr: ManagerApplication) => {
    MySwal.fire({
      title: '<span class="text-base sm:text-lg font-extrabold text-slate-800">지원서 상세 내용</span>',
      width: '32rem',
      html: `
        <div class="w-full text-left mt-1 max-h-[60vh] overflow-y-auto pr-1.5 space-y-4 sm:space-y-5">
          
          <div class="flex flex-col">
            <span class="text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5">관련 경력</span>
            <div class="bg-slate-50 border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-[13px] sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[80px] h-auto break-keep">
              ${mgr.experience ? mgr.experience : '<span class="text-slate-400 italic">작성된 내용이 없습니다.</span>'}
            </div>
          </div>

          <div class="flex flex-col">
            <span class="text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5">지원 동기</span>
            <div class="bg-blue-50/30 border border-blue-100 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-[13px] sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[80px] h-auto break-keep">
              ${mgr.motivation ? mgr.motivation : '<span class="text-slate-400 italic">작성된 내용이 없습니다.</span>'}
            </div>
          </div>

        </div>
      `,
      showCancelButton: false,
      confirmButtonText: '닫기',
      customClass: {
        popup: 'rounded-xl sm:rounded-2xl p-4 sm:p-6',
        confirmButton: 'bg-slate-800 text-white font-bold w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-2 rounded-lg text-sm sm:text-base hover:bg-slate-700 transition-colors'
      },
      buttonsStyling: false
    });
  };

  const handleViewRejectReason = (reason?: string) => {
    YesAlert.fire({
      icon: 'info',
      title: '반려 사유',
      html: reason ? `<div class="text-left bg-slate-50 p-4 rounded-lg text-sm text-slate-700 mt-2">${reason}</div>` : '등록된 반려 사유가 없습니다.',
      showCancelButton: false,
      confirmButtonText: '확인'
    });
  };

  const handleTabChange = (status: string) => {
    if (mgrAppStatus === status) return;
    setLoading(true);
    setPendingManagers([]); 
    setMgrAppStatus(status);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(pendingManagers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentManagers = pendingManagers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const statsCards = useMemo(() => [
    { title: '총 지원자 (전체)', value: `${stats.total}명`, icon: <FileText className="w-6 h-6 text-slate-500" /> },
    { title: '신규 대기', value: `${stats.waiting}명`, icon: <UserPlus className="w-6 h-6 text-emerald-500" /> },
    { title: '승인 완료', value:  `${stats.approved}명`, icon: <CheckCircle2 className="w-6 h-6 text-blue-500" /> },
    { title: '반려 내역', value: `${stats.rejected}명`, icon: <XCircle className="w-6 h-6 text-red-500" /> },
  ], [stats]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 py-6 border-t border-slate-100 bg-white">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>{page}</button>
          ))}
        </div>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
      </div>
    );
  };

  const tableColSpan = mgrAppStatus === 'WAITING' ? 6 : 5;

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
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
      
      <motion.div variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 bg-emerald-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" /> 가입 승인 대기 목록
          </h2>
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
            {['WAITING', 'APPROVED', 'REJECTED'].map(s => (
              <button 
                key={s} onClick={() => handleTabChange(s)} 
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mgrAppStatus === s ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {s === 'WAITING' ? '신규 대기' : s === 'APPROVED' ? '승인 완료' : '반려 내역'}
              </button>
            ))}
          </div>
        </div>

        {/* 데스크탑 뷰 */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-4 font-bold pl-6 text-center">지원일자</th>
                <th className="p-4 font-bold text-center">이름/연락처</th>
                <th className="p-4 font-bold text-center">보유 자격증</th>
                <th className="p-4 font-bold text-center">근무 가능 시간</th>
                <th className="p-4 font-bold text-center">지원서 / 첨부파일</th>
                {mgrAppStatus === 'WAITING' && <th className="p-4 font-bold text-center pr-6">계정 승인</th>}
                {mgrAppStatus === 'REJECTED' && <th className="p-4 font-bold text-center pr-6">반려 사유</th>}
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} className="p-16 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : currentManagers.length > 0 ? currentManagers.map((mgr) => (
                <tr key={mgr.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-slate-500 font-medium text-center">{mgr.applyDate}</td>
                  <td className="p-4 text-center"><p className="font-bold text-slate-800">{mgr.name}</p><p className="text-xs text-slate-500 mt-0.5">{mgr.phone}</p></td>
                  <td className="p-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100">
                      {getLicenseName(mgr.licenseName)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex gap-1 flex-wrap justify-center">
                        {mgr.availableDays?.split(',').map((day, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            {day.trim()}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">{mgr.availableTime}</span>
                    </div>
                  </td>
                  
                  {/* 지원서 상세 보기 버튼 */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => handleViewDetails(mgr)} className="inline-flex items-center gap-1.5 bg-blue-50/80 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 shadow-sm transition-colors">
                        <Search className="w-3.5 h-3.5" /> 상세 보기
                      </button>
                      
                      {mgr.certificateUrl && (
                        <a href={getFileUrl(mgr.certificateUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm transition-colors">
                          <FileText className="w-3.5 h-3.5 text-slate-400" /> 자격증명
                        </a>
                      )}
                    </div>
                  </td>
                  
                  {mgrAppStatus === 'WAITING' && (
                    <td className="p-4 pr-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleApprove(mgr.memberId, mgr.name)} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"><CheckCircle2 className="w-4 h-4" /> 승인</button>
                        <button onClick={() => handleReject(mgr.id, mgr.name)} className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm"><XCircle className="w-4 h-4" /> 반려</button>
                      </div>
                    </td>
                  )}
                  {mgrAppStatus === 'REJECTED' && (
                    <td className="p-4 pr-6 text-center">
                      <button onClick={() => handleViewRejectReason(mgr.rejectReason)} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm">
                        사유 보기
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <EmptyState message="해당하는 지원 내역이 없습니다." isTable={true} />
              )}
            </tbody>
          </table>
        </div>

        {/* 모바일 뷰: 카드형 리스트 */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 flex-1 overflow-y-auto bg-slate-50/50 content-start">
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
                    {mgr.availableDays?.split(',').map((day, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">{day.trim()}</span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium">{mgr.availableTime}</span>
                </div>
              </div>

              {/* 🌟 모바일: 지원서 상세 보기 버튼 추가 */}
              <div className="flex items-center gap-2 pt-1 border-b border-slate-100 pb-3">
                <button onClick={() => handleViewDetails(mgr)} className="flex-1 flex justify-center items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 shadow-sm transition-colors">
                  <Search className="w-3.5 h-3.5" /> 지원서 상세 보기
                </button>
                {mgr.certificateUrl && (
                  <a href={getFileUrl(mgr.certificateUrl)} target="_blank" rel="noopener noreferrer" className="flex justify-center bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm">
                    증명서
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {mgrAppStatus === 'WAITING' && (
                  <>
                    <button onClick={() => handleApprove(mgr.memberId, mgr.name)} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm">승인</button>
                    <button onClick={() => handleReject(mgr.id, mgr.name)} className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm">반려</button>
                  </>
                )}
                {mgrAppStatus === 'REJECTED' && (
                  <button onClick={() => handleViewRejectReason(mgr.rejectReason)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm">
                    반려 사유 보기
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className='col-span-full flex justify-center py-8'>
              <EmptyState message="해당하는 지원 내역이 없습니다." isTable={false} />
            </div>
          )}
        </div>
        
        {!loading && renderPagination()}

      </motion.div>
    </>
  );
}