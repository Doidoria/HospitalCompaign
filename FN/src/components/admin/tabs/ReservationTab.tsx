// src/components/admin/tabs/ReservationTab.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarDays, Activity, Users, UserPlus, Search, Loader2, CheckCircle2, Send, UserMinus, FileText, Edit, Download } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { adminApi, reservationApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import ReportModal from '../modals/ReportModal';
import ReservationEditModal from '../modals/ReservationEditModal';

// ==========================================
// 1. 타입 정의 (Type Safety)
// ==========================================
export interface Member {
  id: number;
  name: string;
  role: string;
  email?: string;
}

export interface Reservation {
  id: number;
  date: string;
  time: string;
  patient: string;
  hospital: string;
  status: string; // 'WAITING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  manager: string;
  raw: any;
}

interface ReservationTabProps {
  handleOpenDetail: (id: number) => void;
  members: Member[];
  handleAssignManager: (id: number) => Promise<boolean>;
  handleCancelAssign: (id: number) => Promise<boolean>;
  handleViewMemberProfile: (member: Member) => void;
  refreshBadges?: () => void;
}

// ==========================================
// 2. 애니메이션 Variants
// ==========================================
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

// ==========================================
// [추가] 엑셀(CSV) 변환 및 다운로드 헬퍼 함수
// ==========================================
const exportToCsv = (data: Reservation[]) => {
  if (data.length === 0) {
    Toast.fire({ icon: 'warning', title: '다운로드할 데이터가 없습니다.' });
    return;
  }

  // 1. 엑셀 헤더 정의
  const headers = ['예약번호', '예약일자', '예약시간', '환자명', '매칭병원', '진행상태', '담당매니저'];

  // 2. 데이터 행 생성 (쉼표 가공 및 개행 문자 치환 처리)
  const rows = data.map(res => [
    res.id,
    res.date.replace(/,/g, ''), // 날짜 안의 쉼표가 CSV 포맷을 깨트리지 않게 제거
    res.time,
    `"${res.patient}"`, // 이름이나 병원명에 쉼표가 있을 수 있으므로 쌍따옴표 래핑
    `"${res.hospital.split('///')[0].trim()}"`, // 병원주소 가공 반영
    res.status === 'WAITING' ? '매칭 대기' : res.status === 'CONFIRMED' ? '예약 확정' : res.status === 'COMPLETED' ? '이용 완료' : '취소됨',
    res.manager
  ]);

  // 3. 문자열 병합
  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  // 4. Excel에서 한글(UTF-8)을 인식할 수 있도록 BOM(Byte Order Mark)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 5. 브라우저 강제 다운로드 링크 생성
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  // 파일명 형식: 예스케어_예약리스트_2026-05-23.csv
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `예스케어_예약리스트_${today}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ReservationTab({ 
  handleOpenDetail, 
  members, 
  handleAssignManager, 
  handleCancelAssign, 
  handleViewMemberProfile,
  refreshBadges
}: ReservationTabProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportResId, setSelectedReportResId] = useState<number | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditRes, setSelectedEditRes] = useState<any | null>(null);

  // 페이지 이동 시 최상단 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // 검색어/필터 변경 시 1페이지(0)로 초기화
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter]);

  const handleOpenEdit = (rawRes: any) => {
    setSelectedEditRes(rawRes);
    setIsEditModalOpen(true);
  };

  const handleExcelDownload = async () => {
    try {
      Toast.fire({ icon: 'info', title: '엑셀 데이터 추출 중...' });
      
      // '페이징 없는' 조건부 전체 데이터를 가져오는 API 호출
      const res = await adminApi.getAllReservationsForExcel(searchTerm, statusFilter);
      const allData = res.data || [];

      // 2. 기존 컴포넌트의 데이터 포맷팅 로직 적용
      const formattedData = allData.map((r: any): Reservation => {
        const dateObj = new Date(r.reservationTime);
        return {
          id: r.id, 
          date: dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          time: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          patient: r.patientName,
          hospital: r.hospitalName,
          status: r.status, 
          manager: r.managerName || (r.status === 'CONFIRMED' ? '배정완료' : '-'),
          raw: r
        };
      });

      // 3. 기존 엑셀 다운로드 헬퍼 함수 호출
      exportToCsv(formattedData);
      Toast.fire({ icon: 'success', title: '다운로드가 완료되었습니다.' });
      
    } catch (error) {
      console.error('엑셀 다운로드 에러:', error);
      YesAlert.fire({ icon: 'error', title: '오류', html: '데이터를 가져오는데 실패했습니다.' });
    }
  };

  // [최적화 1] 데이터 페치 및 페이지네이션 보정
  const fetchReservations = useCallback(async (page: number, keyword: string, status: string) => {
    setLoading(true);
    try {
      const res = (keyword || status) 
        ? await adminApi.searchReservations(keyword, status, page)
        : await adminApi.getReservations(page); 
      
      const content = res.data?.content || [];

      if (content.length === 0 && page > 0) {
        setCurrentPage(prev => prev - 1);
        return; 
      }

      // 백엔드 BFF 구조에 맞춤
      const formattedData = content.map((r: any): Reservation => ({
        id: r.id,
        date: r.date,
        time: r.time,
        patient: r.patient,
        hospital: r.hospital,
        status: r.status,
        manager: r.managerName || '-',
        raw: r
      }));
      
      setReservations(formattedData);
      setTotalPages(res.data?.totalPages || 0);
    } catch (error) {
      console.error('예약 로딩 에러:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 디바운스 훅 로직 적용
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReservations(currentPage, searchTerm, statusFilter);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, currentPage, fetchReservations]);

  // [최적화 2] JSX 인라인 함수 외부 분리로 가독성 향상 및 렌더링 최적화
  const onAssign = async (id: number) => {
    const success = await handleAssignManager(id);
    if (success) fetchReservations(currentPage, searchTerm, statusFilter);
  };

  const onCancelAssign = async (id: number) => {
    const success = await handleCancelAssign(id);
    if (success) fetchReservations(currentPage, searchTerm, statusFilter);
  };

  const onViewManager = (managerName: string) => {
    const managerInfo = members.find(m => m.name === managerName && m.role.includes('MANAGER'));
    if (managerInfo) {
      handleViewMemberProfile(managerInfo);
    } else {
      YesAlert.fire({ icon: 'warning', title: '알림', html: '매니저 상세 정보를 찾을 수 없습니다.' });
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await reservationApi.updateStatus(id, newStatus);
      Toast.fire({ icon: 'success', title: '상태가 변경되었습니다.' });
      fetchReservations(currentPage, searchTerm, statusFilter);
      if (refreshBadges) refreshBadges() // 대기 -> 확정 등으로 상태가 바뀌면 뱃지 리프레시
    } catch (error) {
      YesAlert.fire({ icon: 'error', title: '오류', html: '상태 변경에 실패했습니다.' });
    }
  };

  const activeManagerCount = useMemo(() => {
    if (!members || members.length === 0) return 0;
    return members.filter(m => m.role.includes('MANAGER')).length;
  }, [members]);

  // [최적화 3] 통계 카드 메모이제이션
  const statsCards = useMemo(() => [
    { title: '조회된 예약', value: `${reservations.length}건`, icon: <CalendarDays className="w-6 h-6 text-blue-500" /> },
    { title: '매칭 대기', value: `${reservations.filter(r => r.status === 'WAITING').length}건`, icon: <Activity className="w-6 h-6 text-orange-500" /> },
    { title: '활동 매니저', value: `${activeManagerCount}명`, icon: <Users className="w-6 h-6 text-emerald-500" /> },
    { title: '신규 지원', value: `확인필요`, icon: <UserPlus className="w-6 h-6 text-purple-500" /> },
  ], [reservations, activeManagerCount]);

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {statsCards.map((stat, idx) => (
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
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center w-full sm:w-auto gap-2">
            {/* 엑셀 다운로드 버튼 */}
            <button
              type="button"
              onClick={handleExcelDownload}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
              title="현재 조회된 리스트를 엑셀 파일로 저장합니다"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">엑셀 다운로드</span>
            </button>

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

        {/* 1. PC 뷰: 테이블 */}
        <div className="hidden lg:block overflow-x-auto flex-1">
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
                      <button 
                        onClick={() => onViewManager(res.manager)}
                        className="text-xs font-bold text-emerald-600 mt-1.5 flex items-center gap-1 hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {res.manager} 배정됨
                      </button>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => handleOpenDetail(res.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1">상세 보기</button>
                      <button onClick={() => handleOpenEdit(res.raw)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1">
                        <Edit className="w-3.5 h-3.5" /> 수정
                      </button>
                      {res.status === 'WAITING' ? (
                        <button onClick={() => onAssign(res.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" /> 매니저 배정
                        </button>
                      ) : res.status === 'CONFIRMED' ? (
                        <button onClick={() => onCancelAssign(res.id)} className="px-3 py-1.5 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-all shadow-sm flex items-center gap-1.5">
                          <UserMinus className="w-3.5 h-3.5" /> 배정 취소
                        </button>
                      ) : res.status === 'COMPLETED' ? (
                        <button onClick={() => { setSelectedReportResId(res.id); setIsReportModalOpen(true); }} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> 리포트 확인
                        </button>
                      ) : null}
                      
                      <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                        <option value="WAITING">매칭 대기</option>
                        <option value="CONFIRMED">예약 확정</option>
                        <option value="COMPLETED">이용 완료</option>
                        <option value="CANCELLED">취소됨</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )) : (
                <EmptyState message="조건에 맞는 예약이 없습니다." colSpan={5} isTable={true} />
              )}
            </tbody>
          </table>
        </div>

        {/* 2. 모바일 뷰: 카드형 리스트 (lg:hidden) */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 flex-1 overflow-y-auto bg-slate-50/50 content-start">
          {loading && reservations.length === 0 ? (
            <div className="py-16 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>
          ) : reservations.length > 0 ? reservations.map((res) => (
            <div key={res.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold text-xs">#{res.id}</span>
                <StatusBadge status={res.status} />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs font-bold">일시</span>
                  <span className="text-slate-800 font-extrabold text-sm">{res.date} {res.time}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 text-xs font-bold shrink-0 mt-0.5">환자/병원</span>
                  <span className="text-slate-800 font-bold text-sm text-right break-keep">
                    {res.patient} <span className="text-slate-300 mx-1">|</span> {res.hospital}
                  </span>
                </div>
                {(res.status === 'CONFIRMED' || res.status === 'COMPLETED') && res.manager !== '-' && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-500 text-xs font-bold">담당 매니저</span>
                    <button
                      onClick={() => onViewManager(res.manager)}
                      className="text-emerald-600 font-bold text-xs flex items-center gap-1 hover:text-emerald-700 hover:underline transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {res.manager} 배정됨
                    </button>
                  </div>
                )}
              </div>

              {/* 액션 버튼 그룹 */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button onClick={() => handleOpenDetail(res.id)} className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
                  상세 보기
                </button>
                <button onClick={() => handleOpenEdit(res.raw)} disabled={res.status === 'COMPLETED'}
                  className={`flex-1 py-2 border text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1
                    ${res.status === 'COMPLETED' 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
                  <Edit className="w-3.5 h-3.5" /> 수정
                </button>
                {res.status === 'WAITING' ? (
                  <button onClick={() => onAssign(res.id)} className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm flex items-center justify-center gap-1">
                    <Send className="w-3.5 h-3.5" /> 매니저 배정
                  </button>
                ) : res.status === 'CONFIRMED' ? (
                  <button onClick={() => onCancelAssign(res.id)} className="flex-1 py-2 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 shadow-sm flex items-center justify-center gap-1">
                    <UserMinus className="w-3.5 h-3.5" /> 배정 취소
                  </button>
                ) : res.status === 'COMPLETED' ? (
                  <button onClick={() => { setSelectedReportResId(res.id); setIsReportModalOpen(true); }} className="flex-1 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> 리포트
                  </button>
                ) : null}
                <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 py-2 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="WAITING">매칭 대기</option>
                  <option value="CONFIRMED">예약 확정</option>
                  <option value="COMPLETED">이용 완료</option>
                  <option value="CANCELLED">취소됨</option>
                </select>
              </div>
            </div>
          )) : (
            <div className='col-span-full flex justify-center py-8'>
               <EmptyState message="조건에 맞는 예약이 없습니다." isTable={false} />
            </div>
          )}
        </div>
        
        {totalPages > 0 && !loading && (
          <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{i + 1}</button>
            ))}
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
          </div>
        )}
      </motion.div>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        reservationId={selectedReportResId} 
      />
      <ReservationEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditRes(null);
        }}
        selectedRequest={selectedEditRes}
        onSuccess={() => fetchReservations(currentPage, searchTerm, statusFilter)} 
      />
    </>
  );
}