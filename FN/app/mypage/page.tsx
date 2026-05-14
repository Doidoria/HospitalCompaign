'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock, MapPin, User, FileText, ChevronRight, Activity, CalendarDays, GraduationCap, Settings, Star, Crown, LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { STATUS_MAP, StatusKey } from '@/src/constants/statusMap';
import { reservationApi, authApi } from '@/src/api/index';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function MyPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("고객"); 
  const [upcomingReservation, setUpcomingReservation] = useState<any>(null);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPeriod, setFilterPeriod] = useState('ALL'); // '1M', '3M', '6M', 'ALL'

  // 상태별 정렬 순서 정의
  const statusOrder: Record<string, number> = {
    'CONFIRMED': 1, // 예약 확정
    'WAITING': 2,   // 매칭 대기
    'CANCELLED': 3, // 예약 취소
    'COMPLETED': 4  // 이용 완료
  };

  // 필터링 및 정렬이 완료된 데이터 생성
  const filteredAndSortedRecords = pastRecords
    .filter((record) => {
      // 상태 필터
      const matchStatus = filterStatus === 'ALL' || record.status === filterStatus;
      
      // 검색어 필터 (날짜 제외, 병원명만 직관적으로 검색)
      const term = searchTerm.toLowerCase();
      const matchSearch = term === '' || record.hospital.toLowerCase().includes(term);

      // 기간 필터 (기존 "2024. 05. 09. (목)" 형태의 문자열에서 날짜를 안전하게 추출하여 계산)
      let matchPeriod = true;
      if (filterPeriod !== 'ALL') {
        const parts = record.date.match(/\d+/g);
        if (parts && parts.length >= 3) {
          const recordDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const limitDate = new Date();
          
          if (filterPeriod === '1M') limitDate.setMonth(limitDate.getMonth() - 1);
          else if (filterPeriod === '3M') limitDate.setMonth(limitDate.getMonth() - 3);
          else if (filterPeriod === '6M') limitDate.setMonth(limitDate.getMonth() - 6);
          
          matchPeriod = recordDate >= limitDate;
        }
      }
        
      return matchStatus && matchSearch && matchPeriod;
    })
    .sort((a, b) => {
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      return orderA - orderB;
    });

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        Swal.fire({ icon: 'warning', title: '로그인 필요', text: '로그인 후 이용해 주세요.' });
        router.push('/login');
        return;
      }

      try {
        const [userRes, response] = await Promise.all([
          authApi.getMe(),
          reservationApi.getMyList()
        ]);
        
        if (!isMounted) return;

        if (userRes.data && userRes.data.name) {
          setUserName(userRes.data.name);

          // 카카오 최초 가입자(가짜 번호)인 경우 정보 수정 페이지로 강제 이동
          if (userRes.data.phoneNumber === '010-0000-0000') {
            Swal.fire({
              icon: 'info',
              title: '추가 정보 입력 필요',
              text: '원활한 매니저 매칭을 위해 연락처와 기본 주소를 먼저 입력해 주세요!',
              confirmButtonText: '입력하러 가기',
              allowOutsideClick: false // 바깥 클릭 방지
            }).then(() => {
              router.push('/mypage/edit');
            });
            return; // 아래 리스트 렌더링을 멈추고 바로 이동
          }
        }

        const data = response.data;
        const processedData = data.map((res: any) => {
          const dateObj = new Date(res.reservationTime);
          const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
          const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
          const cleanStatus = res.status ? res.status.trim().toUpperCase() : 'WAITING';

          return {
            id: res.id,
            date: dateStr,
            time: timeStr,
            hospital: res.hospitalName,
            status: cleanStatus,
            patientName: res.patientName,
            reportAvailable: cleanStatus === 'COMPLETED',
            reviewRating: res.reviewRating,
            managerId: res.managerId || null, 
            managerName: res.managerName || null,
          };
        });

        const upcoming = processedData.find((res: any) => 
            res.status !== 'COMPLETED' && res.status !== 'CANCELLED'
        );
        const past = processedData.filter((res: any) => res.id !== upcoming?.id);

        setUpcomingReservation(upcoming || null);
        setPastRecords(past);

      } catch (error) {
        console.error('마이페이지 데이터 조회 에러:', error);
        localStorage.removeItem('accessToken');
        router.push('/login');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [router]);

  const handleCheckManagerStatus = async () => {
    try {
      const res = await authApi.getManagerAppStatus();
      const { status, title, description, rejectionReason } = res.data;

      let iconColor = ''; let iconEmoji = '';
      if (status === 'APPROVED') { iconColor = '#10b981'; iconEmoji = '🎉'; } 
      else if (status === 'WAITING') { iconColor = '#f59e0b'; iconEmoji = '⏳'; } 
      else if (status === 'REJECTED') { iconColor = '#ef4444'; iconEmoji = '😥'; } 
      else { iconColor = '#3b82f6'; iconEmoji = '📝'; }

      let htmlContent = `
        <div style="padding: 15px 0;">
          <div style="font-size: 65px; margin-bottom: 15px;">${iconEmoji}</div>
          <h3 style="font-weight: 900; font-size: 22px; color: #1e293b; margin-bottom: 12px;">${title}</h3>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; word-break: keep-all;">${description}</p>
      `;

      if (status === 'REJECTED') {
        const displayReason = rejectionReason || '사유가 기재되지 않았습니다.';
        htmlContent += `
          <div style="margin-top: 20px; text-align: left; background: #fef2f2; padding: 15px; border-radius: 12px; border: 1px solid #fca5a5;">
            <p style="font-size: 13px; font-weight: bold; color: #b91c1c; margin-bottom: 5px;">[반려 사유]</p>
            <p style="font-size: 14px; color: #991b1b; line-height: 1.5; white-space: pre-wrap; word-break: break-all;">${displayReason}</p>
          </div>
        `;
      }
      htmlContent += `</div>`;

      let confirmText = '확인';
      if (status === 'NONE') confirmText = '매니저 지원하러 가기';
      if (status === 'REJECTED') confirmText = '다시 지원하기';

      Swal.fire({
        html: htmlContent, confirmButtonText: confirmText, confirmButtonColor: iconColor,
        showCancelButton: status === 'NONE' || status === 'REJECTED',
        cancelButtonText: '닫기', customClass: { popup: 'rounded-[32px]' }
      }).then((result) => {
        if ((status === 'NONE' || status === 'REJECTED') && result.isConfirmed) router.push('/manager'); 
      });
    } catch (error) {
      Swal.fire('오류', '신청 상태를 불러올 수 없습니다.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-5 space-y-6 max-w-6xl mx-auto pt-10">
      <div className="h-32 bg-slate-200 rounded-[28px] animate-pulse mb-8"></div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 h-[400px] bg-white rounded-[32px] animate-pulse"></div>
        <div className="lg:col-span-2 h-[400px] bg-white rounded-[32px] animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 selection:bg-indigo-100 selection:text-indigo-900">
      <motion.main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10" initial="hidden" animate="visible" variants={containerVariants}>
        
        {/* 상단 헤더 배너 */}
        <motion.div variants={itemVariants} className="mb-10 bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-900 p-8 rounded-[28px] shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">마이페이지</h2>
            <p className="text-indigo-200 font-medium text-sm sm:text-base">예약 내역과 케어 리포트를 한곳에서 관리하세요.</p>
          </div>
          <Crown className="w-16 h-16 text-white/10 relative z-10 hidden sm:block" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* 1. 다가오는 예약 (좌측 메인) */}
          <motion.div variants={itemVariants} className="order-2 lg:order-1 lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between ml-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" /> 다가오는 예약 일정
              </h3>
              <Link href="/apply" className="text-xs font-bold text-white bg-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                + 새 예약 신청
              </Link>
            </div>

            {/* 👉 탭 메뉴 버튼 */}
            <div className="flex items-center gap-6 border-b border-slate-200 mt-2">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`pb-3 font-bold text-sm sm:text-base transition-colors relative ${
                  activeTab === 'upcoming' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                다가오는 예약
                {activeTab === 'upcoming' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`pb-3 font-bold text-sm sm:text-base transition-colors relative ${
                  activeTab === 'past' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                과거 내역 및 리포트
                {activeTab === 'past' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-t-full" />
                )}
              </button>
            </div>

            {/* 👉 탭 내용 렌더링 */}
            <div className="pt-2">
              {activeTab === 'upcoming' ? (
                /* 다가오는 예약 화면 */
                upcomingReservation ? (
                  <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group">
                    {/* ... (기존 다가오는 예약 코드 그대로 유지) ... */}
                    {/* 상단 뱃지부터 Activity 아이콘까지 기존 코드와 동일 */}
                    <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100 relative z-10">
                      <span className={`text-[13px] font-bold px-3 py-1.5 rounded-lg border ${STATUS_MAP[upcomingReservation.status as StatusKey]?.colorClass || 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {STATUS_MAP[upcomingReservation.status as StatusKey]?.label || upcomingReservation.status}
                      </span>
                      <span className="text-[13px] text-slate-400 font-semibold tracking-wide">NO. {upcomingReservation.id}</span>
                    </div>

                    <Link href={`/reservation/${upcomingReservation.id}`} className="block relative z-10">
                      <div className="bg-slate-50/50 rounded-2xl p-5 mb-5 space-y-5 border border-slate-100/60 transition-colors group-hover:bg-indigo-50/30 group-hover:border-indigo-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[12px] text-slate-500 font-bold mb-0.5">방문 일시</p>
                            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{upcomingReservation.date} <span className="text-indigo-600">{upcomingReservation.time}</span></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 shadow-sm">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[12px] text-slate-500 font-bold mb-0.5">방문 병원</p>
                            <p className="text-lg font-bold text-slate-800">{upcomingReservation.hospital}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end text-sm text-indigo-600 font-bold items-center gap-1 group-hover:text-indigo-700">
                        상세 정보 보기 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    {upcomingReservation.managerId && (
                      <div className="mt-6 pt-6 border-t border-slate-100 relative z-10">
                        <Link href={`/manager/profile/${upcomingReservation.managerId}`}>
                          <div className="flex items-center gap-4 p-4 sm:p-5 bg-emerald-50/80 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-colors group/manager cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[11px] text-emerald-600 font-bold mb-1 tracking-wide">배정된 매니저</p>
                              <p className="text-base font-extrabold text-slate-900 group-hover/manager:text-emerald-800 transition-colors">
                                {upcomingReservation.managerName} <span className="font-medium text-sm text-emerald-700">매니저</span>
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-emerald-400 ml-auto group-hover/manager:translate-x-1 transition-transform" />
                          </div>
                        </Link>
                      </div>
                    )}
                    <Activity className="absolute -bottom-10 -right-10 w-56 h-56 text-indigo-50/60 pointer-events-none transition-transform group-hover:scale-110 duration-500 z-0" />
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-[32px] shadow-sm border border-slate-200/60 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
                      <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 mb-6 font-bold text-base">현재 예정된 동행 서비스가 없습니다.</p>
                  </div>
                )
              ) : (
                /* 과거 내역 화면 */
                <div className="space-y-4">
                  {/* 검색 및 필터 UI */}
                  <div className="flex flex-col gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    
                    {/* 검색창 (오직 병원명만) */}
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="병원명으로 내역 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* 모바일에서 터치하기 편한 나란한 드롭다운 */}
                    <div className="flex gap-2">
                      <select
                        value={filterPeriod}
                        onChange={(e) => {
                          setFilterPeriod(e.target.value);
                          setVisibleCount(3);
                        }}
                        className="flex-1 px-3 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer text-center appearance-none"
                      >
                        <option value="ALL">전체 기간</option>
                        <option value="1M">최근 1개월</option>
                        <option value="3M">최근 3개월</option>
                        <option value="6M">최근 6개월</option>
                      </select>

                      <select
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setVisibleCount(3);
                        }}
                        className="flex-1 px-3 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer text-center appearance-none"
                      >
                        <option value="ALL">전체 상태</option>
                        <option value="CONFIRMED">예약 확정</option>
                        <option value="WAITING">매칭 대기</option>
                        <option value="CANCELLED">예약 취소</option>
                        <option value="COMPLETED">이용 완료</option>
                      </select>
                    </div>
                  </div>
                  {filteredAndSortedRecords.length > 0 ? (
                  <>
                    {filteredAndSortedRecords.slice(0, visibleCount).map((record) => (
                      <div key={record.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm relative hover:border-slate-300 transition-colors flex flex-col gap-2">
                        {record.status === 'COMPLETED' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-2xl" />}
                        
                        <div className="flex justify-between items-center mb-2 pl-2">
                          <span className="text-sm text-slate-400 font-semibold">{record.date}</span>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${STATUS_MAP[record.status as StatusKey]?.colorClass || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {STATUS_MAP[record.status as StatusKey]?.label || record.status}
                          </span>
                        </div>

                        <div className="pl-2 mb-3">
                          <h4 className="text-lg font-extrabold text-slate-900 truncate mb-1">{record.hospital}</h4>
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                            <User className="w-4 h-4" /> {record.patientName} 님 동행
                          </p>
                        </div>
                        
                        <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100 pl-2">
                          <Link href={`/reservation/${record.id}`} className="flex-1">
                            <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors">
                              상세 보기
                            </button>
                          </Link>
                          
                          {record.reportAvailable && (
                            <Link href={`/report/${record.id}`} className="flex-1">
                              <button className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-colors ring-1 ring-indigo-200/50 flex items-center justify-center gap-1">
                                리포트 보기
                              </button>
                            </Link>
                          )}

                          {record.status === 'COMPLETED' && !record.reviewRating && (
                            <Link href={`/reservation/survey/${record.id}`} className="flex-1">
                              <button className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-bold rounded-xl transition-colors ring-1 ring-amber-200/50 flex items-center justify-center gap-1">
                                <Star className="w-4 h-4 fill-amber-500" /> 후기 작성
                              </button>
                            </Link>
                          )}
                          {record.reviewRating && (
                            <button disabled className="flex-1 py-3 px-3 bg-slate-50 text-slate-400 text-sm font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-200 cursor-not-allowed whitespace-nowrap">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 작성 완료
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* 더보기 버튼 (필터링된 결과 갯수에 맞춰 표시) */}
                    {filteredAndSortedRecords.length > visibleCount && (
                      <button 
                        onClick={() => setVisibleCount(prev => prev + 3)}
                        className="w-full mt-6 py-4 text-sm text-slate-500 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                        과거 내역 더보기 ({visibleCount} / {filteredAndSortedRecords.length})
                      </button>
                    )}
                  </>
                ) : (
                  <div className="py-16 text-center bg-white rounded-[32px] border border-slate-200 shadow-sm">
                    <p className="text-slate-400 font-bold text-base mb-2">조회된 내역이 없습니다.</p>
                    {searchTerm !== '' && <p className="text-sm text-slate-400">검색어와 필터 조건을 확인해 주세요.</p>}
                  </div>
                )}
              </div>
              )}
            </div>
          </motion.div>

          {/* 2. 내 정보 및 과거 내역 (우측 사이드바) */}
          <motion.div variants={itemVariants} className="order-1 lg:order-2 lg:col-span-2 flex flex-col gap-6">
            
            {/* 프로필 요약 카드 */}
            <div className="bg-white rounded-[32px] shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 p-7 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-extrabold text-slate-400 tracking-wider">내 정보</h3>
                <Link href="/mypage/edit" className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-indigo-600 transition-colors" title="정보 수정">
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-extrabold text-xl shrink-0">
                  {userName.charAt(0)}
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{userName} <span className="text-base font-bold text-slate-400">님</span></p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">예스케어와 함께하는 건강한 일상</p>
                </div>
              </div>

              <button onClick={handleCheckManagerStatus}
                className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-600 py-3.5 rounded-2xl font-bold text-sm border border-slate-200/60 hover:bg-slate-100 transition-all active:scale-[0.98]">
                <GraduationCap className="w-4 h-4 text-slate-400" /> 매니저 교육·지원 현황
              </button>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}