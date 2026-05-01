'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock, MapPin, User, FileText, LogOut, ChevronRight, Activity, CalendarDays, GraduationCap, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { STATUS_MAP, StatusKey } from '@/src/constants/statusMap';
import { reservationApi, authApi } from '@/src/api/index';

export default function MyPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("고객"); 
  const [upcomingReservation, setUpcomingReservation] = useState<any>(null);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 컴포넌트가 마운트될 때 백엔드 API 호출
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        Swal.fire({ icon: 'warning', title: '로그인 필요', text: '로그인 후 이용해 주세요.' });
        router.push('/login');
        return;
      }

      try {
        // 1. 로그인한 유저 정보 가져오기 (실제 이름 연동)
        const userRes = await authApi.getMe();
        if (userRes.data && userRes.data.name) {
          setUserName(userRes.data.name);
        }

        // 2. 예약 내역 가져오기
        const response = await reservationApi.getMyList();
        const data = response.data;

        // 백엔드 데이터를 프론트엔드 UI에 맞게 가공
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
            reportAvailable: cleanStatus === 'COMPLETED'
          };
        });

        // 데이터 분류 로직 (가장 가까운 미완료 예약을 메인으로)
        const upcoming = processedData.find((res: any) => 
            res.status !== 'COMPLETED' && res.status !== 'CANCELLED'
        );
        
        // 나머지는 '지난 이용 내역(또는 전체 내역)'으로 분류
        const past = processedData.filter((res: any) => res.id !== upcoming?.id);

        setUpcomingReservation(upcoming || null);
        setPastRecords(past);

      } catch (error) {
        console.error('마이페이지 데이터 조회 에러:', error);
        localStorage.removeItem('accessToken');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 매니저 교육 및 가입 신청 상태 확인 팝업 핸들러
  const handleCheckManagerStatus = async () => {
    try {
      const res = await authApi.getManagerAppStatus();
      const { status, title, description, rejectionReason } = res.data;

      let iconColor = '';
      let iconEmoji = '';

      if (status === 'APPROVED') {
        iconColor = '#10b981'; // 에메랄드(초록)
        iconEmoji = '🎉';
      } else if (status === 'WAITING') {
        iconColor = '#f59e0b'; // 앰버(주황)
        iconEmoji = '⏳';
      } else if (status === 'REJECTED') {
        iconColor = '#ef4444'; // 빨강
        iconEmoji = '😥';
      } else {
        iconColor = '#3b82f6'; // 블루
        iconEmoji = '📝';
      }

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
        html: htmlContent,
        confirmButtonText: confirmText,
        confirmButtonColor: iconColor,
        showCancelButton: status === 'NONE' || status === 'REJECTED', // 반려 시에도 닫기 버튼 표시
        cancelButtonText: '닫기',
        customClass: { popup: 'rounded-[32px]' }
      }).then((result) => {
        if ((status === 'NONE' || status === 'REJECTED') && result.isConfirmed) {
          router.push('/manager'); 
        }
      });
    } catch (error) {
      Swal.fire('오류', '신청 상태를 불러올 수 없습니다.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  // 페이지 전체를 감싸는 컨테이너용 애니메이션
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 250, damping: 25, staggerChildren: 0.08 } }
  };

  // 내부 카드나 리스트 아이템용 애니메이션
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* 🌟 헤더(Header) 영역 삭제 완료! (글로벌 헤더 사용) */}

      <motion.main 
        className="max-w-6xl mx-auto px-4 sm:px-6 pt-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-10">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">마이페이지</h2>
          <p className="text-gray-500 font-medium">예약 내역과 케어 리포트를 한곳에서 관리하세요.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 좌측: 다가오는 예약 (메인) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                다가오는 예약 일정
              </h3>
              <Link href="/apply" className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
                + 새 예약 신청
              </Link>
            </div>

            {upcomingReservation ? (
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                {/* 상단 뱃지 */}
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${STATUS_MAP[upcomingReservation.status as StatusKey]?.colorClass || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_MAP[upcomingReservation.status as StatusKey]?.label || upcomingReservation.status}
                  </span>
                  <span className="text-sm text-gray-400 font-medium">예약번호 #{upcomingReservation.id}</span>
                </div>

                {/* 상세 정보 */}
                <Link href={`/reservation/${upcomingReservation.id}`} className="block relative z-10">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <CalendarDays className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">방문 일시</p>
                        <p className="text-2xl font-extrabold text-gray-800">{upcomingReservation.date} {upcomingReservation.time}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <MapPin className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">방문 병원</p>
                        <p className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{upcomingReservation.hospital}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end">
                    <button className="flex items-center gap-1 text-blue-600 font-bold hover:gap-2 transition-all">
                      상세 정보 보기 <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </Link>
                
                <Activity className="absolute -bottom-10 -right-10 w-56 h-56 text-blue-50/40 pointer-events-none transition-transform group-hover:scale-110 duration-500" />
              </div>
            ) : (
              <div className="bg-white p-12 rounded-[32px] shadow-sm border border-gray-100 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Calendar className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 mb-6 font-bold text-lg">현재 예정된 동행 서비스가 없습니다.</p>
                <Link href="/apply">
                  <button className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-950 transition-colors shadow-md text-lg active:scale-95">
                    동행 서비스 신청하기
                  </button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* 우측 사이드바: 내 정보 및 과거 내역 */}
          <motion.div variants={itemVariants} className="space-y-6">
            
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-7 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-extrabold text-gray-800">내 정보</h3>
                <Link href="/mypage/edit" className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-colors border border-gray-200 shadow-sm" title="내 정보 수정">
                  <Settings className="w-4 h-4" /> 내 정보 수정
                </Link>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{userName} <span className="text-base font-bold text-gray-500">님</span></p>
                  <p className="text-sm text-gray-500 mt-0.5 font-medium">예스케어와 함께하는 건강한 일상</p>
                </div>
              </div>

              {/* 매니저 교육·지원 현황 버튼 */}
              <button onClick={handleCheckManagerStatus}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-4 rounded-2xl font-bold hover:bg-blue-100 transition-all shadow-sm active:scale-[0.98] border border-blue-100"
              >
                <GraduationCap className="w-5 h-5" /> 매니저 교육·지원 현황
              </button>
            </div>

            {/* 과거 내역 및 리포트 */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-7">
              <h3 className="text-lg font-extrabold text-gray-800 mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                케어 리포트 및 과거 내역
              </h3>

              <div className="space-y-4">
                {pastRecords.length > 0 ? (
                  pastRecords.map((record) => (
                    <div key={record.id} className="bg-white rounded-[24px] p-5 border border-gray-100 relative overflow-hidden hover:shadow-md transition-all group flex flex-col gap-2">
                      {record.status === 'COMPLETED' && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                      )}

                      <div className="flex justify-between items-center pl-1 mb-1">
                        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{record.date}</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${STATUS_MAP[record.status as StatusKey]?.colorClass || 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_MAP[record.status as StatusKey]?.label || record.status}
                        </span>
                      </div>

                      <div className="pl-1 mb-2">
                        <h4 className="text-lg font-extrabold text-gray-900 truncate">
                          {record.hospital}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                          <User className="w-4 h-4" /> {record.patientName} 님 동행
                        </p>
                      </div>

                      <div className="flex gap-2 mt-2 pt-4 border-t border-gray-50">
                        <Link href={`/reservation/${record.id}`} className="flex-1">
                          <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1">
                            상세 보기
                          </button>
                        </Link>
                        
                        {record.reportAvailable && (
                          <Link href={`/report/${record.id}`} className="flex-1">
                            <button className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ring-1 ring-emerald-200/50 shadow-sm">
                              <FileText className="w-4 h-4" /> 리포트 보기
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center bg-gray-50 rounded-2xl">
                    <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm">조회된 내역이 없습니다.</p>
                  </div>
                )}
              </div>
              
              {pastRecords.length > 0 && (
                <button className="w-full mt-6 py-3.5 text-sm text-gray-500 font-bold bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  과거 내역 더보기
                </button>
              )}
            </div>

          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}