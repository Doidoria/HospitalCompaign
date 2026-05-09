'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  CalendarDays, Activity, CheckCircle2, MapPin, FileText, X, CalendarPlus, XCircle, Star,
  Search, ChevronLeft as PageLeft, ChevronRight as PageRight, RefreshCw, ChevronRight, UserCog 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { reservationApi, authApi } from '@/src/api/index';

export default function ManagerDashboard() {
  const router = useRouter();
  const [mySchedules, setMySchedules] = useState<any[]>([]);
  const [managerName, setManagerName] = useState('매니저');
  const [managerId, setManagerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [myScheduleFilter, setMyScheduleFilter] = useState<'all' | 'confirmed' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredMySchedules = useMemo(() => {
    return mySchedules.filter(req => {
      const matchesSearch = req.patientName.includes(searchQuery) || req.hospitalName.includes(searchQuery);
      const isComp = req.status === 'COMPLETED' || req.status === '이용 완료';
      if (myScheduleFilter === 'confirmed') return matchesSearch && !isComp;
      if (myScheduleFilter === 'completed') return matchesSearch && isComp;
      return matchesSearch;
    });
  }, [mySchedules, searchQuery, myScheduleFilter]);

  const activeData = filteredMySchedules;
  const totalPages = Math.max(1, Math.ceil(activeData.length / ITEMS_PER_PAGE));
  const currentItems = activeData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, myScheduleFilter]);

  const fetchDashboardData = async (showMainLoading = true) => {
    if (showMainLoading) setLoading(true);
    else setIsRefreshing(true); 

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No token');

      const meRes = await authApi.getMe();
      if (meRes.data.role !== 'MANAGER' && meRes.data.role !== 'ADMIN') {
        Swal.fire({ icon: 'error', title: '접근 제한', text: '매니저 전용 페이지입니다.' });
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
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, [router]);

  // 재방문 대리 신청 팝업
  const handleProxyReservation = async (req: any) => {
    const { value: formValues } = await Swal.fire({
      title: '재방문 대리 신청',
      width: '45em',
      html: `
        <div class="text-left space-y-4 mt-4 font-sans text-sm max-h-[70vh] overflow-y-auto px-2">
          <p class="text-blue-600 font-bold mb-4">※ 기존 정보를 바탕으로 다음 방문을 신청합니다. 수정이 필요한 부분만 입력하세요.</p>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">재방문 회차</label>
              <select id="proxy-revisit" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-400">
                <option value="1차 재방문">1차 재방문</option>
                <option value="2차 재방문">2차 재방문</option>
                <option value="3차 재방문">3차 재방문</option>
                <option value="4차 재방문">4차 재방문</option>
                <option value="5차 재방문">5차 재방문</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">다음 방문 일시</label>
              <input type="datetime-local" id="proxy-time" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-400">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">방문 병원</label>
              <input type="text" id="proxy-hospital" value="${req.hospitalName}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">진료 카테고리</label>
              <select id="proxy-category" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none">
                <option value="일반 진료" ${req.category === '일반 진료' ? 'selected' : ''}>일반 진료</option>
                <option value="정밀 검사" ${req.category === '정밀 검사' ? 'selected' : ''}>정밀 검사</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">보호자 성함</label>
              <input type="text" id="proxy-gname" value="${req.guardianName || ''}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">보호자 연락처</label>
              <input type="text" id="proxy-gphone" value="${req.guardianPhone || ''}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">매니저와 만나는 장소</label>
            <input type="text" id="proxy-meeting" value="${req.meetingPoint || '자택'}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">이동 수단</label>
              <input type="text" id="proxy-transport" value="${req.transportation || ''}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">환자 거동 상태</label>
              <select id="proxy-mobility" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none">
                <option value="독립 보행 가능" ${req.mobility === '독립 보행 가능' ? 'selected' : ''}>독립 보행 가능</option>
                <option value="지팡이/워커 보행" ${req.mobility === '지팡이/워커 보행' ? 'selected' : ''}>지팡이/워커 보행</option>
                <option value="부축 필요" ${req.mobility === '부축 필요' ? 'selected' : ''}>부축 필요</option>
                <option value="휠체어 이용" ${req.mobility === '휠체어 이용' ? 'selected' : ''}>휠체어 이용</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">보호자 특별 요청사항 (메모)</label>
            <textarea id="proxy-reqs" rows="2" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none">${req.requirements || ''}</textarea>
          </div>

          <div>
            <label class="block font-bold text-blue-600 mb-1">상세 진료 내용</label>
            <textarea id="proxy-detail" rows="2" class="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/30 outline-none">${req.detailedContent || ''}</textarea>
          </div>

          <div>
            <label class="block font-bold text-amber-600 mb-1">의사 선생님께 드릴 질문</label>
            <textarea id="proxy-inquiry" rows="2" class="w-full px-3 py-2.5 rounded-xl border border-amber-100 bg-amber-50/30 outline-none">${req.doctorInquiry || ''}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '대리 신청 완료하기',
      cancelButtonText: '취소',
      confirmButtonColor: '#ea580c',
      customClass: { popup: 'rounded-[24px]' },
      preConfirm: () => {
        const time = (document.getElementById('proxy-time') as HTMLInputElement).value;
        if (!time) {
          Swal.showValidationMessage('방문 일시를 선택해주세요.');
          return false;
        }
        return {
          reservationTime: time + ':00',
          revisitCount: (document.getElementById('proxy-revisit') as HTMLSelectElement).value,
          hospitalName: (document.getElementById('proxy-hospital') as HTMLInputElement).value,
          category: (document.getElementById('proxy-category') as HTMLSelectElement).value,
          guardianName: (document.getElementById('proxy-gname') as HTMLInputElement).value,
          guardianPhone: (document.getElementById('proxy-gphone') as HTMLInputElement).value,
          meetingPoint: (document.getElementById('proxy-meeting') as HTMLInputElement).value,
          transportation: (document.getElementById('proxy-transport') as HTMLInputElement).value,
          mobility: (document.getElementById('proxy-mobility') as HTMLSelectElement).value,
          requirements: (document.getElementById('proxy-reqs') as HTMLTextAreaElement).value,
          detailedContent: (document.getElementById('proxy-detail') as HTMLTextAreaElement).value,
          doctorInquiry: (document.getElementById('proxy-inquiry') as HTMLTextAreaElement).value,
          memo: "재방문 대리 신청"
        };
      }
    });

    if (formValues) {
      try {
        await reservationApi.createProxy(req.id, formValues);
        Swal.fire({ icon: 'success', title: '신청 완료', text: '다음 동행 일정이 성공적으로 접수되었습니다.', confirmButtonColor: '#059669' });
        const mySchedulesRes = await reservationApi.getManagerSchedules();
        setMySchedules(mySchedulesRes.data);
      } catch (error) {
        Swal.fire({ icon: 'error', title: '신청 실패', text: '오류가 발생했습니다.', confirmButtonColor: '#ea580c' });
      }
    }
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  const formatDateTime = (dateString: string) => {
    const dateObj = new Date(dateString);
    return {
      date: dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
  };

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
        <div className="mb-6 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-7 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex 
        items-center justify-between relative overflow-hidden">
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

        {/* 탭 2(나의 일정) 렌더링 부분을 조건 없이 바로 노출 */}
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
          {/* 상단 타이틀 (선택 사항 - 나의 일정이란 걸 명시) */}
          <div className="flex items-center gap-2 mb-2 px-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">나의 배정 일정 <span className="text-emerald-600 ml-1">{mySchedules.length}</span>건</h2>
          </div>

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
              const { date, time } = formatDateTime(req.reservationTime);
              const isCompleted = req.status === 'COMPLETED' || req.status === '이용 완료';
              
              return (
                <motion.div key={req.id} variants={itemVariants} 
                  className={`bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border relative overflow-hidden ${
                    isCompleted ? 'border-slate-200/60 opacity-85' : 'border-emerald-100'
                  }`}>
                  
                  {/* 예약 확정일 경우 좌측에 살짝 포인트 컬러 바 */}
                  {!isCompleted && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-3 py-1.5 text-[11px] font-bold rounded-lg tracking-wide mb-3 border ${
                        isCompleted ? 'bg-slate-50 text-slate-500 border-slate-200/60' : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                      }`}>
                        {isCompleted ? '이용 완료' : '예약 확정'}
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
                    
                    {!isCompleted ? (
                      <Link href={`/manager/report/${req.id}`} 
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border border-blue-200/60 shadow-[0_2px_4px_rgb(59,130,246,0.1)] flex items-center justify-center gap-1.5">
                        <FileText className="w-4 h-4" /> 케어 리포트 작성
                      </Link>
                    ) : req.noRevisit ? (
                      <button disabled className="flex-1 bg-slate-50 text-slate-400 font-bold py-3.5 rounded-xl text-center text-sm border border-slate-200/60 flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <XCircle className="w-4 h-4" /> 재방문 없음
                      </button>
                    ) : req.hasProxy ? (
                      <button disabled className="flex-1 bg-emerald-50 text-emerald-600 opacity-70 font-bold py-3.5 rounded-xl text-center text-sm border border-emerald-200/60 flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <CheckCircle2 className="w-4 h-4" /> 재방문 신청 완료
                      </button>
                    ) : (
                      <button onClick={() => handleProxyReservation(req)}
                        className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-3.5 rounded-xl transition-colors text-center text-sm border border-orange-200/60 shadow-[0_2px_4px_rgb(249,115,22,0.1)] flex items-center justify-center gap-1.5">
                        <CalendarPlus className="w-4 h-4" /> 재방문 대리 신청
                      </button>
                    )}
                    
                    {/* 리뷰 별점 버튼 */}
                    {req.reviewRating && (
                      <button 
                        onClick={() => {
                          Swal.fire({
                            title: '고객님의 소중한 후기',
                            html: `
                              <div style="margin-top: -5px;">
                                <div style="font-size: 32px; color: #f59e0b; font-weight: 900; margin-bottom: 20px; text-align: center; letter-spacing: -1px;">
                                  ⭐ ${req.reviewRating}.0
                                </div>
                                <div style="box-sizing: border-box; background-color: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #e2e8f0; text-align: left; font-size: 15px; color: #334155; white-space: pre-wrap; line-height: 1.6; word-break: keep-all; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                                  ${req.reviewComment ? req.reviewComment : '<span style="color: #94a3b8;">작성된 상세 후기 내용이 없습니다.</span>'}
                                </div>
                              </div>
                            `,
                            confirmButtonText: '확인',
                            confirmButtonColor: '#1e293b',
                            customClass: { popup: 'rounded-[32px]' }
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
        </motion.div>

        {/* 상세 정보 모달창 */}
        {isModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="bg-white rounded-[32px] w-full max-w-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
            >
              <div className="px-6 py-5 flex justify-between items-center bg-white border-b border-slate-100 relative">
                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 relative z-10">
                  <div className="p-1.5 bg-emerald-50 rounded-lg"><FileText className="w-5 h-5 text-emerald-600" /></div> 예약 상세 정보
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors relative z-10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-2 tracking-wide">기본 정보</h4>
                  <div className="bg-white p-5 rounded-[20px] text-sm text-slate-700 space-y-3 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                      <span className="font-semibold text-slate-400 w-16 shrink-0">환자명</span> 
                      <span className="font-bold text-slate-800 text-base">{selectedRequest.patientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-400 w-16 shrink-0">목적지</span> 
                      <button  onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(selectedRequest.hospitalName)}`, '_blank')}
                        className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
                        <MapPin className="w-3.5 h-3.5" /> {selectedRequest.hospitalName}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <span className="font-semibold text-slate-400 w-16 shrink-0 whitespace-nowrap">만나는 장소</span> 
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">
                          {selectedRequest.meetingPoint ? selectedRequest.meetingPoint.replace(' /// ', ' ') : '자택 앞 (연락 요망)'}
                        </span>
                        <button onClick={() => {
                            const rawPoint = selectedRequest.meetingPoint || '자택';
                            const searchTarget = rawPoint === '자택' ? selectedRequest.patientAddress : rawPoint.split(' /// ')[0];
                            if (!searchTarget) return Swal.fire({ icon: 'warning', title: '주소 미등록', text: '정확한 주소가 없습니다.' });
                            window.open(`https://map.kakao.com/link/search/${encodeURIComponent(searchTarget)}`, '_blank');
                          }}
                          className="px-2.5 py-1 bg-[#FEE500] text-[#191919] text-[11px] font-bold rounded-md hover:bg-[#FADA0A] transition-colors flex items-center gap-1 shadow-sm">
                          카카오맵 열기
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-400 w-16 shrink-0">이동 수단</span> 
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{selectedRequest.transportation}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                      <span className="font-semibold text-slate-400 w-16 shrink-0">거동 상태</span> 
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">{selectedRequest.mobility || '독립 보행 가능'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedRequest.requirements && (
                    <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                      <h4 className="text-xs font-bold text-slate-400 mb-2 tracking-wide flex items-center gap-1">특별 요청사항</h4>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                        {selectedRequest.requirements}
                      </div>
                    </div>
                  )}

                  {selectedRequest.detailedContent && (
                    <div className="bg-blue-50/50 p-5 rounded-[20px] border border-blue-100 shadow-[0_2px_10px_rgb(59,130,246,0.02)]">
                      <h4 className="text-xs font-bold text-blue-400 mb-2 tracking-wide">상세 진료 및 검사 내용</h4>
                      <div className="text-sm text-blue-900 font-medium space-y-1.5">
                        {selectedRequest.detailedContent.split('\n').map((line: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                            <p className="leading-relaxed">{line.replace('- ', '')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRequest.doctorInquiry && (
                    <div className="bg-amber-50/50 p-5 rounded-[20px] border border-amber-200/60 shadow-[0_2px_10px_rgb(245,158,11,0.02)]">
                      <h4 className="text-xs font-bold text-amber-500 mb-2 tracking-wide">의사 선생님께 꼭 여쭤봐야 할 질문</h4>
                      <div className="text-sm text-amber-900 font-bold whitespace-pre-wrap leading-relaxed">
                        {selectedRequest.doctorInquiry}
                      </div>
                    </div>
                  )}
                  
                  {!selectedRequest.memo && !selectedRequest.detailedContent && !selectedRequest.doctorInquiry && (
                    <div className="bg-white p-6 rounded-[20px] border border-slate-100 text-center">
                      <p className="text-sm text-slate-400 font-medium">작성된 특별 요청사항이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-white border-t border-slate-100">
                <button onClick={() => setIsModalOpen(false)}
                  className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 transition-colors shadow-[0_4px_14px_rgba(15,23,42,0.2)] active:scale-[0.98]">
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

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