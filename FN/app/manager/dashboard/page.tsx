// app/manager/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, Activity, CheckCircle2, MapPin, FileText, X, CalendarPlus, XCircle, Star,
  Search, ChevronLeft as PageLeft, ChevronRight as PageRight, RefreshCw, ChevronRight, UserCog,
  PlayCircle, CheckSquare, PlusCircle, CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { reservationApi, authApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import ReservationDetailModal from '@/src/components/manager/ReservationDetailModal';
import Link from 'next/link';

const formatDateTime = (dateString: string) => {
  const dateObj = new Date(dateString);
  return {
    date: dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    time: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [mySchedules, setMySchedules] = useState<any[]>([]);
  const [managerName, setManagerName] = useState('매니저');
  const [managerId, setManagerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [myScheduleFilter, setMyScheduleFilter] = useState<'all' | 'confirmed' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [extraChargeData, setExtraChargeData] = useState({ amount: '', reason: '' });
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [isExtraChargeModalOpen, setIsExtraChargeModalOpen] = useState(false);
  const [selectedExtraChargeId, setSelectedExtraChargeId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredMySchedules = useMemo(() => {
    return mySchedules.filter(req => {
      const matchesSearch = (req.patientName || '').includes(debouncedQuery) || (req.hospitalName || '').includes(debouncedQuery);
      const isComp = req.status === 'COMPLETED' || req.status === '이용 완료';
      if (myScheduleFilter === 'confirmed') return matchesSearch && !isComp;
      if (myScheduleFilter === 'completed') return matchesSearch && isComp;
      return matchesSearch;
    });
  }, [mySchedules, debouncedQuery, myScheduleFilter]);

  const activeData = filteredMySchedules;
  const totalPages = Math.max(1, Math.ceil(activeData.length / ITEMS_PER_PAGE));
  const currentItems = activeData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, myScheduleFilter]);

  const fetchDashboardData = useCallback(async (showMainLoading = true) => {
    if (showMainLoading) setLoading(true);
    else setIsRefreshing(true); 

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No token');

      const meRes = await authApi.getMe();
      if (meRes.data.role !== 'MANAGER' && meRes.data.role !== 'ADMIN') {
        // 🚨 text -> html 속성으로 변경, Swal -> YesAlert 로 변경
        YesAlert.fire({ icon: 'error', title: '접근 제한', html: '매니저 전용 페이지입니다.' });
        router.push('/');
        return;
      }
      setManagerName(meRes.data.name);
      setManagerId(meRes.data.id);

      const mySchedulesRes = await reservationApi.getManagerSchedules();
      setMySchedules(mySchedulesRes.data);
      
    } catch (error) {
      console.error('대시보드 로딩 에러:', error);
      if (showMainLoading) router.push('/login');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // 동행 시작 핸들러
  const handleStartAccompany = async (id: number) => {
    const result = await YesAlert.fire({
      title: '동행을 시작하시겠습니까?',
      html: '보호자에게 동행 시작 알림톡이 발송됩니다.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: '네, 시작합니다',
      cancelButtonText: '취소'
    });

    if (result && result.isConfirmed) {
      try {
        await reservationApi.startAccompany(id);
        Toast.fire({ icon: 'success', title: '동행이 시작되었습니다.' });
        fetchDashboardData(false);
      } catch (e) {
        YesAlert.fire({ icon: 'error', title: '오류', html: '상태 변경에 실패했습니다.' });
      }
    }
  };

  // 동행 완료 핸들러
  const handleCompleteAccompany = async (id: number) => {
    const result = await YesAlert.fire({
      title: '동행을 완료하시겠습니까?',
      html: '보호자에게 동행 종료 알림톡이 발송됩니다.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: '네, 완료합니다',
      cancelButtonText: '취소'
    });

    if (result && result.isConfirmed) {
      try {
        await reservationApi.completeAccompany(id);
        Toast.fire({ icon: 'success', title: '동행이 완료되었습니다. 케어 리포트를 작성해주세요!' });
        fetchDashboardData(false);
      } catch (e) {
        YesAlert.fire({ icon: 'error', title: '오류', html: '상태 변경에 실패했습니다.' });
      }
    }
  };

  // 예스케어 추가 요금 정책 가이드 상수
  const EXTRA_CHARGE_PRESETS = [
    { label: '시간 초과 (30분)', amount: 8000, reason: '시간 초과 (30분)' },
    { label: '시간 초과 (60분)', amount: 16000, reason: '시간 초과 (60분)' },
    { label: '시간 초과 (90분)', amount: 24000, reason: '시간 초과 (90분)' },
    { label: '시간 초과 (120분)', amount: 32000, reason: '시간 초과 (120분)' },
    { label: '주말 / 공휴일 할증', amount: 5000, reason: '주말/공휴일 할증 부과' },
    { label: '야간 할증 (18시 이후)', amount: 5000, reason: '야간 할증 (18시 이후) 부과' },
    { label: '기타 (직접 입력)', amount: 0, reason: '' }
  ];

  // 중복 선택을 위한 상태 관리
  const [chargeState, setChargeState] = useState({
    timeCount: 0, // 30분 단위 카운트 (1 = 30분, 2 = 60분)
    isWeekend: false, // 주말 할증
    isNight: false, // 야간 할증
    customAmount: '', // 기타 직접 입력 금액
    customReason: ''  // 기타 사유
  });

  const calculatedCharge = useMemo(() => {
    let total = chargeState.timeCount * 11000;
    if (chargeState.isWeekend) total += 5000;
    if (chargeState.isNight) total += 5000;
    
    // 콤마 제거 후 숫자로 변환 (NaN 방지)
    const customNum = parseInt(chargeState.customAmount.replace(/,/g, '') || '0', 10);
    if (!isNaN(customNum) && customNum > 0) total += customNum;

    const reasons = [];
    if (chargeState.timeCount > 0) reasons.push(`시간 연장(${chargeState.timeCount * 30}분 이상 초과)`);
    if (chargeState.isWeekend) reasons.push('주말/공휴일 할증');
    if (chargeState.isNight) reasons.push('야간 할증');
    if (chargeState.customReason.trim()) reasons.push(chargeState.customReason.trim());

    return { amount: total, reason: reasons.join(', ') };
  }, [chargeState]);

  // 서밋 핸들러
  const submitExtraCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExtraChargeId) return;

    if (calculatedCharge.amount <= 0) {
      YesAlert.fire({ icon: 'warning', title: '입력 오류', html: '추가할 요금 항목을 선택해주세요.' });
      return;
    }

    try {
      await reservationApi.addExtraCharge(selectedExtraChargeId, {
        amount: calculatedCharge.amount,
        reason: calculatedCharge.reason
      });

      Toast.fire({ icon: 'success', title: '추가 요금이 정상적으로 청구되었습니다.' });
      setIsExtraChargeModalOpen(false);
      // 상태 초기화
      setChargeState({ timeCount: 0, isWeekend: false, isNight: false, customAmount: '', customReason: '' });
      fetchDashboardData(false);
    } catch (error) {
      YesAlert.fire({ icon: 'error', title: '오류', html: '추가 요금 등록에 실패했습니다.' });
    }
  };

  // 프리셋 선택 시 금액과 사유를 자동 세팅하는 핸들러
  const handlePresetChange = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = EXTRA_CHARGE_PRESETS[index];
    
    if (preset.label === '기타 (직접 입력)') {
      setExtraChargeData({ amount: '', reason: '' });
    } else {
      setExtraChargeData({ 
        amount: preset.amount.toLocaleString(), 
        reason: preset.reason 
      });
    }
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] p-5 space-y-6 max-w-4xl mx-auto pt-8">
      <div className="h-28 bg-slate-200 rounded-[24px] animate-pulse"></div>
      <div className="h-16 bg-slate-200 rounded-2xl animate-pulse"></div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-[24px] animate-pulse"></div>)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24 relative selection:bg-emerald-100 selection:text-emerald-900">
      <main className="max-w-4xl mx-auto px-5 pt-8">
        <div className="mb-6 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-7 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col sm:flex-row 
        sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-white/10 text-emerald-300 text-[11px] font-bold rounded-full border border-white/10 backdrop-blur-md">PRO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5 tracking-tight">{managerName} 매니저님</h1>
            <p className="text-slate-300 text-sm font-medium">오늘도 따뜻한 동행을 부탁드립니다 ✨</p>
          </div>
          
          <div className="relative z-10 flex items-center gap-3 w-full sm:w-auto">
            {managerId && (
              <Link href={`/manager/profile/edit`} className="w-full md:w-auto">
                <button className="w-full md:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-[16px] backdrop-blur-md transition-all active:scale-95 border border-white/10 shadow-lg flex items-center justify-center gap-2.5 text-sm">
                  <UserCog className="w-4 h-4 text-emerald-300" />
                  내 프로필 관리
                </button>
              </Link>
            )}
            
            <button 
              onClick={() => fetchDashboardData(false)}
              disabled={isRefreshing}
              title="목록 새로고침"
              className="shrink-0 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-[16px] flex items-center justify-center text-white backdrop-blur-md 
              transition-all active:scale-95 disabled:opacity-50 border border-white/10 shadow-lg">
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`}/>
            </button>
          </div>
        </div>

        {/* Glassmorphism Sticky Header */}
        <div className="sticky top-0 z-30 bg-[#F8FAFC]/85 backdrop-blur-xl pt-3 pb-5 -mx-2 px-2 shadow-[0_10px_15px_-10px_rgba(0,0,0,0.03)] border-b border-slate-200/50 mb-6">
          
          {/* 검색창 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder="환자 성함 또는 병원명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-sm font-medium"
              />
            </div>

            <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex shrink-0 h-[52px] items-center overflow-x-auto">
              {(['all', 'confirmed', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setMyScheduleFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    myScheduleFilter === f 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {f === 'all' ? '전체 일정' : f === 'confirmed' ? '예약 확정' : '이용 완료'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 탭 2(나의 일정) */}
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">나의 배정 일정 <span className="text-emerald-600 ml-1">{activeData.length}</span>건</h2>
          </div>

          <AnimatePresence mode="popLayout">
            {currentItems.length === 0 ? (
              <div className="bg-white rounded-[24px] p-12 text-center border border-slate-200/60 shadow-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-1">일정이 없습니다</h3>
                <p className="text-slate-500 text-sm">조건에 맞는 배정 일정이 없습니다.</p>
              </div>
            ) : (
              currentItems.map((req) => {
                // console.log("예약번호", req.id, "의 백엔드 데이터:", req);
                const { date, time } = formatDateTime(req.reservationTime);
                const isConfirmed = req.status === 'CONFIRMED' || req.status === '예약 확정';
                const isInProgress = req.status === 'IN_PROGRESS' || req.status === '동행 진행 중';
                const isCompleted = req.status === 'COMPLETED' || req.status === '이용 완료';

                let proxyQuery = '';
                if (req.nextSchedule) {
                  const [nDate, nTimeFull] = req.nextSchedule.split('T');
                  const nTime = nTimeFull ? nTimeFull.substring(0, 5) : ''; // "14:30" 형태로 자르기
                  proxyQuery = `?date=${nDate}&time=${nTime}`;
                }
                
                return (
                  <motion.div layout key={req.id} variants={itemVariants} exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border relative overflow-hidden ${
                      isCompleted ? 'border-slate-200/60 opacity-85' : 'border-emerald-100'
                    }`}>
                    
                    {!isCompleted && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>}

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`inline-block px-3 py-1.5 text-[11px] font-bold rounded-lg tracking-wide mb-3 border ${
                          isCompleted ? 'bg-slate-50 text-slate-500 border-slate-200/60' : 
                          isInProgress ? 'bg-orange-50 text-orange-600 border-orange-100/50' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                        }`}>
                          {isCompleted ? '이용 완료' : isInProgress ? '동행 진행 중' : '예약 확정'}
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-800">{req.patientName} 환자님</h3>
                      </div>
                      <div className="text-right bg-slate-50 px-3 py-2 rounded-xl border border-slate-100/50">
                        <p className="font-bold text-slate-700 text-sm">{date}</p>
                        <p className={`font-bold ${isCompleted ? 'text-slate-500' : 'text-emerald-600'}`}>{time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-5 text-sm text-slate-600 font-medium">
                      <div className="p-1.5 bg-slate-100 rounded-md shrink-0"><MapPin className="w-4 h-4 text-slate-500" /></div>
                      <span className="truncate">{req.hospitalName}</span>
                    </div>
                    
                    <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                      <button onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }}
                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border border-slate-200/60 shadow-[0_2px_4px_rgb(0,0,0,0.02)]">
                        상세 정보 보기
                      </button>
                      
                      {isConfirmed && (
                        <button onClick={() => handleStartAccompany(req.id)}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border border-emerald-200/60 shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                          <PlayCircle className="w-4 h-4" /> 동행 시작
                        </button>
                      )}

                      {isInProgress && (
                        <>
                          <button onClick={() => { setSelectedExtraChargeId(req.id); setIsExtraChargeModalOpen(true); }}
                            className={`flex-1 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                              req.extraChargeAmount 
                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200/60' 
                                : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200/60'
                            }`}
                          >
                            <PlusCircle className="w-4 h-4" /> 
                            {req.extraChargeAmount ? '추가 요금 수정' : '추가 요금'}
                          </button>
                          
                          <button onClick={() => handleCompleteAccompany(req.id)}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border border-blue-200/60 shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                            <CheckSquare className="w-4 h-4" /> 동행 완료
                          </button>
                        </>
                      )}
                      {isCompleted && (
                        <>
                          {req.hasReport ? (
                            <Link href={`/manager/report/${req.id}`} 
                              className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border border-indigo-200/60 shadow-sm flex items-center justify-center gap-1.5">
                              <FileText className="w-4 h-4" /> 리포트 조회/수정
                            </Link>
                          ) : (
                            <Link href={`/manager/report/${req.id}`} 
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors text-center text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98]">
                              <FileText className="w-4 h-4" /> 케어 리포트 작성
                            </Link>
                          )}
                          {req.noRevisit ? (
                            <button disabled className="flex-1 bg-slate-50 text-slate-400 font-bold py-3.5 rounded-xl text-center text-sm border border-slate-200/60 flex items-center justify-center gap-1.5 cursor-not-allowed">
                              <XCircle className="w-4 h-4" /> 재방문 없음
                            </button>
                          ) : req.hasProxy ? (
                            <button disabled className="flex-1 bg-emerald-50 text-emerald-600 opacity-70 font-bold py-3.5 rounded-xl text-center text-sm border border-emerald-200/60 flex items-center justify-center gap-1.5 cursor-not-allowed">
                              <CheckCircle2 className="w-4 h-4" /> 재방문 신청 완료
                            </button>
                          ) : (
                            <Link href={`/manager/proxy/${req.id}${proxyQuery}`}
                              className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border border-orange-200/60 shadow-[0_2px_4px_rgb(249,115,22,0.1)] flex items-center justify-center gap-1.5"
                            >
                              <CalendarPlus className="w-4 h-4" /> 대리 신청
                            </Link>
                          )}
                        </>
                      )}
                      
                      {/* 리뷰 별점 버튼 */}
                      {req.reviewRating && (
                        <button 
                          onClick={() => {
                            YesAlert.fire({
                              title: '고객님의 소중한 후기',
                              html: `
                                <div style="margin-top: -5px;">
                                  <div style="font-size: 32px; color: #f59e0b; font-weight: 900; margin-bottom: 20px; text-align: center; letter-spacing: -1px;">
                                    ⭐ ${req.reviewRating}.0
                                  </div>
                                  <div style="box-sizing: border-box; background-color: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #e2e8f0; text-align: left; font-size: 15px; color: #334155; line-height: 1.6; word-break: keep-all; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                                    ${req.reviewComment ? req.reviewComment : '<span style="color: #94a3b8;">작성된 상세 후기 내용이 없습니다.</span>'}
                                  </div>
                                </div>
                              `,
                              confirmButtonText: '확인',
                              confirmButtonColor: '#1e293b'
                            });
                          }}
                          className="flex-1 sm:flex-none sm:w-28 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border border-amber-200/60 shadow-[0_2px_4px_rgb(245,158,11,0.1)] flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {req.reviewRating}.0
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>

        {/* 상세 정보 모달창 (분리된 컴포넌트 사용) */}
        <ReservationDetailModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          data={selectedRequest} 
        />
      </main>

      {/* 추가 요금 청구 모달 */}
      {isExtraChargeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col border border-slate-100"
          >
            <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-orange-50 rounded-lg"><CreditCard className="w-5 h-5 text-orange-600" /></div> 추가 요금 청구
              </h3>
              <button onClick={() => setIsExtraChargeModalOpen(false)} className="w-8 h-8 bg-white shadow-sm hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitExtraCharge} className="p-6 bg-white flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
              
              {/* 1. 시간 연장 카운터 */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-700 block">시간 연장</span>
                  <span className="text-[11px] text-slate-400 font-medium">30분당 11,000원 (30분 미만 무료)</span>
                </div>
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                  <button type="button" onClick={() => setChargeState(prev => ({...prev, timeCount: Math.max(0, prev.timeCount - 1)}))} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-600">-</button>
                  <span className="font-bold text-slate-800 w-4 text-center">{chargeState.timeCount}</span>
                  <button type="button" onClick={() => setChargeState(prev => ({...prev, timeCount: prev.timeCount + 1}))} className="w-8 h-8 flex items-center justify-center bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg font-bold">+</button>
                </div>
              </div>

              {/* 2. 할증 체크박스 */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 cursor-pointer hover:border-orange-200 transition-colors">
                  <div>
                    <span className="font-bold text-slate-700 block">주말 / 공휴일 할증</span>
                    <span className="text-[11px] text-slate-400 font-medium">+ 5,000원</span>
                  </div>
                  <input type="checkbox" checked={chargeState.isWeekend} onChange={(e) => setChargeState(prev => ({...prev, isWeekend: e.target.checked}))} className="w-5 h-5 accent-orange-500 rounded" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 cursor-pointer hover:border-orange-200 transition-colors">
                  <div>
                    <span className="font-bold text-slate-700 block">야간 할증 (18시 이후)</span>
                    <span className="text-[11px] text-slate-400 font-medium">+ 5,000원</span>
                  </div>
                  <input type="checkbox" checked={chargeState.isNight} onChange={(e) => setChargeState(prev => ({...prev, isNight: e.target.checked}))} className="w-5 h-5 accent-orange-500 rounded" />
                </label>
              </div>

              {/* 3. 기타 직접 입력 */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-3">
                <span className="font-bold text-slate-700 block text-sm">기타 요금 (주차비 등)</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="사유 (예: 주차비)" 
                    value={chargeState.customReason}
                    onChange={(e) => setChargeState(prev => ({...prev, customReason: e.target.value}))}
                    className="w-1/2 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-orange-400"
                  />
                  <input 
                    type="text" 
                    placeholder="금액 (원)" 
                    value={chargeState.customAmount}
                    onChange={(e) => {
                      // 숫자만 입력 가능하도록 정규식 처리
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const formatted = val ? Number(val).toLocaleString() : '';
                      setChargeState(prev => ({...prev, customAmount: formatted}))
                    }}
                    className="w-1/2 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-orange-400 text-right"
                  />
                </div>
              </div>

              {/* 4. 총 청구 금액 표시 */}
              <div className="mt-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                <span className="font-extrabold text-orange-800">최종 청구 금액</span>
                <span className="text-xl font-black text-orange-600">{calculatedCharge.amount.toLocaleString()}원</span>
              </div>

              {/* 5. 자동 생성된 사유 내역 */}
              {calculatedCharge.reason && (
                <div className="text-[12px] text-slate-500 font-medium bg-slate-50 p-3 rounded-xl break-keep">
                  <span className="font-bold text-slate-600">청구 내역: </span> {calculatedCharge.reason}
                </div>
              )}

              <button type="submit" className="mt-2 w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-colors active:scale-95 text-base">
                보호자에게 요금 청구하기
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 페이지네이션 */}
      {activeData.length > 0 && (
        <div className="mt-10 mb-8 flex items-center justify-center gap-3">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-3 rounded-full border border-slate-200/80 bg-white disabled:opacity-30 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
          >
            <PageLeft className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="flex items-center gap-1 bg-white px-5 py-2.5 rounded-full border border-slate-200/80 shadow-sm font-bold text-sm tracking-wide">
            <span className="text-slate-800">{currentPage}</span>
            <span className="text-slate-300 mx-1">/</span>
            <span className="text-slate-500">{totalPages}</span>
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-3 rounded-full border border-slate-200/80 bg-white disabled:opacity-30 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
          >
            <PageRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
}