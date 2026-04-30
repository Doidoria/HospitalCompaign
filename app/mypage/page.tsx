'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock, MapPin, User, FileText, LogOut, ChevronRight, Activity, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { STATUS_MAP, StatusKey } from '@/src/constants/statusMap';
import { reservationApi } from '@/src/api/index';

export default function MyPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("고객"); // 추후 유저 정보 API가 있다면 대체 가능
  const [upcomingReservation, setUpcomingReservation] = useState<any>(null);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 컴포넌트가 마운트될 때 백엔드 API 호출
  useEffect(() => {
    const fetchReservations = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        Swal.fire({ icon: 'warning', title: '로그인 필요', text: '로그인 후 이용해 주세요.' });
        router.push('/login');
        return;
      }

      try {
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
            reportAvailable: cleanStatus === 'COMPLETED',
            category: res.category || '일반 진료'
          };
        });

        const upcoming = processedData.filter((res: any) => res.status !== 'COMPLETED' && res.status !== 'CANCELLED');
        const past = processedData.filter((res: any) => res.status === 'COMPLETED' || res.status === 'CANCELLED');

        setUpcomingReservation(upcoming.length > 0 ? upcoming[0] : null);
        setPastRecords(past);

      } catch (error) {
        console.error('예약 내역 조회 에러:', error);
        localStorage.removeItem('accessToken');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  // 페이지 전체를 감싸는 컨테이너용 애니메이션
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        type: "spring", 
        stiffness: 250, 
        damping: 25,    
        staggerChildren: 0.08 
      } 
    }
  };

  // 내부 카드나 리스트 아이템용 애니메이션
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-gray-500">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      <motion.main 
        className="max-w-6xl mx-auto px-6 pt-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-10">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">마이페이지</h2>
          <p className="text-gray-500">예약 내역과 케어 리포트를 한곳에서 관리하세요.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 좌측: 다가오는 예약 (메인) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                다가오는 예약 일정
              </h3>
              <Link href="/apply" className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                + 새 예약 신청
              </Link>
            </div>

            {upcomingReservation ? (
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-blue-100 relative overflow-hidden group">
                {/* 상단 뱃지 */}
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                    STATUS_MAP[upcomingReservation.status as StatusKey]?.colorClass || 'bg-gray-100 text-gray-500'
                  }`}>
                    {STATUS_MAP[upcomingReservation.status as StatusKey]?.label || upcomingReservation.status}
                  </span>
                  <span className="text-sm text-gray-400 font-medium">예약번호 #{upcomingReservation.id}</span>
                </div>

                {/* 상세 정보 */}
                <Link href={`/reservation/${upcomingReservation.id}`} className="block relative z-10">
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">방문 일시</p>
                        <p className="text-xl font-bold text-gray-800">{upcomingReservation.date} {upcomingReservation.time}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">방문 병원</p>
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
                
                <Activity className="absolute -bottom-10 -right-10 w-56 h-56 text-blue-50/50 pointer-events-none transition-transform group-hover:scale-110 duration-500" />
              </div>
            ) : (
              <div className="bg-white p-12 rounded-[32px] shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 mb-6 font-medium">현재 예정된 동행 서비스가 없습니다.</p>
                <Link href="/apply">
                  <button className="bg-blue-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-950 transition-colors shadow-md">
                    서비스 신청하기
                  </button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* 우측: 지난 이용 내역 및 케어 리포트 */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              케어 리포트 및 과거 내역
            </h3>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6">
              <div className="space-y-4">
                {pastRecords.length > 0 ? (
                  pastRecords.map((record) => (
                    // 🌟 UI 개선 포인트: 정보가 한눈에 들어오는 모바일 친화적 카드 UI
                    <div key={record.id} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition-all group flex flex-col gap-2">
                      
                      {/* 🌟 완료된 내역은 에메랄드색 포인트 선 추가 */}
                      {record.status === 'COMPLETED' && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                      )}

                      {/* 상단: 날짜 및 상태 */}
                      <div className="flex justify-between items-center pl-1 mb-1">
                        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{record.date}</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          STATUS_MAP[record.status as StatusKey]?.colorClass || 'bg-gray-100 text-gray-500'
                        }`}>
                          {STATUS_MAP[record.status as StatusKey]?.label || record.status}
                        </span>
                      </div>

                      {/* 중단: 병원명 및 환자명 */}
                      <div className="pl-1 mb-2">
                        <h4 className="text-lg font-extrabold text-gray-900 truncate">
                          {record.hospital}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                          <User className="w-4 h-4" /> {record.patientName} 님 동행
                        </p>
                      </div>

                      {/* 하단: 액션 버튼들 */}
                      <div className="flex gap-2 mt-2 pt-4 border-t border-gray-50">
                        <Link href={`/reservation/${record.id}`} className="flex-1">
                          <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1">
                            상세 보기
                          </button>
                        </Link>
                        
                        {/* 🌟 리포트가 있을 때만 강조된 버튼 표시 */}
                        {record.reportAvailable && (
                          <Link href={`/report/${record.id}`} className="flex-1">
                            <button className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ring-1 ring-emerald-200/50 shadow-sm">
                              <FileText className="w-4 h-4" /> 리포트
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">조회된 내역이 없습니다.</p>
                  </div>
                )}
              </div>
              
              {pastRecords.length > 0 && (
                <button className="w-full mt-6 py-3 text-sm text-gray-500 font-bold bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
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