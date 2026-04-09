'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  LayoutDashboard, Users, CalendarDays, Activity, 
  Search, CheckCircle2, XCircle, ChevronRight, UserPlus 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  // 현재 탭 상태 관리 (대시보드 메인 vs 매니저 승인)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'managers'>('dashboard');

  // 임시(Mock) 데이터: 상단 통계
  const stats = [
    { title: '오늘의 예약', value: '12건', icon: <CalendarDays className="w-6 h-6 text-blue-500" /> },
    { title: '매칭 대기', value: '5건', icon: <Activity className="w-6 h-6 text-orange-500" /> },
    { title: '활동 중인 매니저', value: '34명', icon: <Users className="w-6 h-6 text-emerald-500" /> },
    { title: '가입 승인 대기', value: '3명', icon: <UserPlus className="w-6 h-6 text-purple-500" /> },
  ];

  // 임시(Mock) 데이터: 최근 예약 목록
  const reservations = [
    { id: 'RES-001', date: '2026.04.09', time: '10:00', patient: '김부모', hospital: '서울대병원', status: '매칭 대기', manager: '-' },
    { id: 'RES-002', date: '2026.04.09', time: '14:00', patient: '이환자', hospital: '세브란스병원', status: '예약 확정', manager: '박동행' },
    { id: 'RES-003', date: '2026.04.10', time: '09:30', patient: '최건강', hospital: '아산병원', status: '결제 대기', manager: '김매니저' },
  ];

  // 임시(Mock) 데이터: 매니저 가입 승인 대기 목록
  const pendingManagers = [
    { id: 'MGR-001', name: '정성실', phone: '010-1234-5678', license: '요양보호사 1급', applyDate: '2026.04.07' },
    { id: 'MGR-002', name: '박친절', phone: '010-9876-5432', license: '사회복지사 2급', applyDate: '2026.04.08' },
  ];

  // 액션 핸들러
  const handleMatch = (resId: string) => {
    alert(`${resId} 예약에 매니저를 매칭하는 창을 띄웁니다.`);
  };

  const handleApproveManager = (mgrId: string) => {
    const isConfirm = window.confirm('해당 매니저의 가입을 승인하시겠습니까?');
    if (isConfirm) alert(`${mgrId} 매니저 승인 완료!`);
  };

  // 애니메이션
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // 상태 뱃지 컴포넌트
  const StatusBadge = ({ status }: { status: string }) => {
    const colorClass = 
      status === '매칭 대기' ? 'bg-orange-100 text-orange-700' :
      status === '결제 대기' ? 'bg-blue-100 text-blue-700' :
      status === '예약 확정' ? 'bg-emerald-100 text-emerald-700' : 
      'bg-gray-100 text-gray-700';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex flex-col md:flex-row">
      
      {/* 1. 사이드바 (데스크탑 좌측 메뉴) */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col p-4 shadow-xl z-20">
        <div className="px-4 py-6 mb-4 border-b border-slate-800">
          <Link href="/" className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-400" />
            Admin
          </Link>
          <p className="text-slate-500 text-xs mt-1">예스케어 통합 관리 시스템</p>
        </div>
        
        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <CalendarDays className="w-5 h-5" />
            예약 관리
          </button>
          <button 
            onClick={() => setActiveTab('managers')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'managers' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
            매니저 승인 관리
          </button>
        </nav>
      </aside>

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="flex-1 p-6 md:p-10 w-full overflow-x-hidden">
        
        {/* 헤더 및 통계 위젯 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">
            {activeTab === 'dashboard' ? '예약 및 매칭 현황' : '매니저 승인 관리'}
          </h1>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial="hidden" animate="visible" variants={containerVariants}
          >
            {stats.map((stat, idx) => (
              <motion.div key={idx} variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">{stat.icon}</div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{stat.title}</p>
                  <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* 탭 1: 예약 관리 테이블 */}
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800">전체 예약 내역</h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="예약자명 또는 병원 검색" className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            
            {/* 📱 모바일 전용 UI (카드형) */}
            <div className="md:hidden divide-y divide-slate-100">
              {reservations.map((res) => (
                <div key={res.id} className="p-5 space-y-3 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">{res.id}</span>
                    <StatusBadge status={res.status} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {res.patient} <span className="text-sm font-medium text-slate-500 ml-1">| {res.hospital}</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      {res.date} {res.time}
                    </p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl mt-3 border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">
                      담당: {res.manager !== '-' ? <span className="text-blue-600 font-bold">{res.manager}</span> : '미정'}
                    </span>
                    {res.status === '매칭 대기' ? (
                      <button onClick={() => handleMatch(res.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">매칭하기</button>
                    ) : (
                      <button className="text-slate-400 hover:text-slate-600 p-1"><ChevronRight className="w-5 h-5 mx-auto" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 💻 데스크톱 전용 UI (표형) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="p-4 font-semibold whitespace-nowrap">예약번호</th>
                    <th className="p-4 font-semibold whitespace-nowrap">일시</th>
                    <th className="p-4 font-semibold whitespace-nowrap">환자/병원</th>
                    <th className="p-4 font-semibold whitespace-nowrap">진행 상태</th>
                    <th className="p-4 font-semibold whitespace-nowrap">담당 매니저</th>
                    <th className="p-4 font-semibold whitespace-nowrap text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {reservations.map((res) => (
                    <tr key={res.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500">{res.id}</td>
                      <td className="p-4"><p className="font-medium text-slate-800">{res.date}</p><p className="text-xs text-slate-500">{res.time}</p></td>
                      <td className="p-4"><p className="font-bold text-slate-800">{res.patient}</p><p className="text-xs text-slate-500">{res.hospital}</p></td>
                      <td className="p-4"><StatusBadge status={res.status} /></td>
                      <td className="p-4">{res.manager !== '-' ? <span className="font-medium text-blue-700">{res.manager}</span> : <span className="text-slate-400">-</span>}</td>
                      <td className="p-4 text-center">
                        {res.status === '매칭 대기' ? (
                          <button onClick={() => handleMatch(res.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">매칭하기</button>
                        ) : (
                          <button className="text-slate-400 hover:text-slate-600 p-1"><ChevronRight className="w-5 h-5 mx-auto" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* 탭 2: 매니저 가입 승인 관리 테이블 */}
        {activeTab === 'managers' && (
          <motion.div 
            key="managers"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">가입 승인 대기 목록</h2>
              <p className="text-sm text-slate-500 mt-1">면접 및 교육 수료가 확인된 매니저의 계정을 승인해 주세요.</p>
            </div>
            
            {/* 📱 모바일 전용 UI (카드형) */}
            <div className="md:hidden divide-y divide-slate-100">
              {pendingManagers.map((mgr) => (
                <div key={mgr.id} className="p-5 space-y-3 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">지원일: {mgr.applyDate}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      {mgr.license}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {mgr.name} 
                      <span className="text-sm font-medium text-slate-500 font-normal">| {mgr.phone}</span>
                    </h3>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleApproveManager(mgr.id)} 
                      className="flex-1 flex justify-center items-center gap-1.5 bg-emerald-100 text-emerald-700 py-3 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" /> 승인
                    </button>
                    <button 
                      className="flex-1 flex justify-center items-center gap-1.5 bg-red-50 text-red-600 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-5 h-5" /> 반려
                    </button>
                  </div>
                </div>
              ))}
              
              {pendingManagers.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  현재 대기 중인 매니저 가입 신청이 없습니다.
                </div>
              )}
            </div>

            {/* 💻 데스크톱 전용 UI (표형) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-emerald-50/50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="p-4 font-semibold whitespace-nowrap">지원일자</th>
                    <th className="p-4 font-semibold whitespace-nowrap">이름/연락처</th>
                    <th className="p-4 font-semibold whitespace-nowrap">보유 자격증</th>
                    <th className="p-4 font-semibold whitespace-nowrap text-right">계정 승인</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingManagers.map((mgr) => (
                    <tr key={mgr.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500">{mgr.applyDate}</td>
                      <td className="p-4"><p className="font-bold text-slate-800">{mgr.name}</p><p className="text-xs text-slate-500">{mgr.phone}</p></td>
                      <td className="p-4 text-emerald-700 font-medium">{mgr.license}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApproveManager(mgr.id)} className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors">
                            <CheckCircle2 className="w-4 h-4" /> 승인
                          </button>
                          <button className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                            <XCircle className="w-4 h-4" /> 반려
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingManagers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">현재 대기 중인 매니저 가입 신청이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}