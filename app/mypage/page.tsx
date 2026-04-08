'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock, MapPin, User, FileText, LogOut, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default function MyPage() {
  // TODO: 실제 백엔드 연동 시 API에서 받아올 임시(Mock) 데이터
  const userName = "김보호";
  
  const upcomingReservation = {
    id: 'RES-2026-001',
    date: '2026. 04. 15 (수)',
    time: '오전 10:00',
    hospital: '서울대학교병원 본원',
    status: '매칭 완료',
    managerName: '이동행 매니저',
  };

  const pastRecords = [
    {
      id: 'RES-2026-000',
      date: '2026. 03. 20 (금)',
      hospital: '연세세브란스병원',
      reportAvailable: true,
    },
    {
      id: 'RES-2025-099',
      date: '2025. 12. 10 (수)',
      hospital: '서울아산병원',
      reportAvailable: true,
    }
  ];

  // 애니메이션 설정
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* 헤더 (로그인 상태) */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl text-blue-950 tracking-tight">
            예스케어
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-600 hidden md:block">
              <span className="text-blue-700 font-bold">{userName}</span>님, 환영합니다
            </span>
            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <motion.main 
        className="max-w-5xl mx-auto px-6 pt-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* 환영 메시지 및 요약 */}
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
              <Link href="/apply" className="text-sm font-medium text-blue-600 hover:underline">
                + 새 예약 신청
              </Link>
            </div>

            {upcomingReservation ? (
              <div className="bg-white p-8 rounded-[32px] shadow-md border border-blue-100 relative overflow-hidden">
                {/* 상단 뱃지 */}
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                    {upcomingReservation.status}
                  </span>
                  <span className="text-sm text-gray-400">예약번호: {upcomingReservation.id}</span>
                </div>

                {/* 상세 정보 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-0.5">예약 일자</p>
                      <p className="text-lg font-bold text-gray-800">{upcomingReservation.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-0.5">방문 시간</p>
                      <p className="text-lg font-bold text-gray-800">{upcomingReservation.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-0.5">병원 정보</p>
                      <p className="text-lg font-bold text-gray-800">{upcomingReservation.hospital}</p>
                    </div>
                  </div>

                  {upcomingReservation.managerName && (
                    <div className="flex items-center gap-4 pt-4 mt-2 border-t border-dashed border-gray-100">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-700 font-medium mb-0.5">담당 매니저</p>
                        <p className="text-lg font-bold text-gray-800">{upcomingReservation.managerName}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 배경 장식 */}
                <Activity className="absolute -bottom-10 -right-10 w-48 h-48 text-blue-50 opacity-50 pointer-events-none" />
              </div>
            ) : (
              <div className="bg-white p-12 rounded-[32px] shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500 mb-4">현재 예정된 동행 서비스가 없습니다.</p>
                <Link href="/apply">
                  <button className="bg-blue-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-950 transition-colors">
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
              케어 리포트
            </h3>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6">
              <div className="space-y-4">
                {pastRecords.map((record) => (
                  <div key={record.id} className="p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group cursor-pointer flex flex-col gap-3">
                    <div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md mb-2 inline-block">이용 완료</span>
                      <h4 className="font-bold text-gray-800">{record.hospital}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{record.date}</p>
                    </div>
                    
                    {record.reportAvailable && (
                      <button className="w-full flex items-center justify-between bg-white border border-emerald-200 text-emerald-700 text-sm font-bold py-2 px-4 rounded-xl group-hover:bg-emerald-50 transition-colors">
                        <span>리포트 보기</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 text-sm text-gray-500 font-medium hover:text-gray-800 transition-colors">
                과거 내역 전체보기
              </button>
            </div>
          </motion.div>

        </div>
      </motion.main>
    </div>
  );
}