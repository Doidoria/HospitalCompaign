'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  LayoutDashboard, Users, CalendarDays, Activity, 
  Search, CheckCircle2, XCircle, ChevronRight, UserPlus 
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { adminApi, reservationApi } from '@/src/api/index';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'managers'>('dashboard');
  const [pendingManagers, setPendingManagers] = useState<any[]>([]);
  const [managerCount, setManagerCount] = useState(0);
  const [reservations, setReservations] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. 예약 데이터 불러오기
  const fetchReservations = async (page: number) => {
    setLoading(true);
    try {
      const res = await adminApi.getReservations(page); 
      const formattedData = res.data.content.map((r: any) => {
        const dateObj = new Date(r.reservationTime);
        return {
          id: r.id, 
          date: dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          time: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          patient: r.patientName,
          hospital: r.hospitalName,
          status: r.status, 
          manager: '-' 
        };
      });
      setReservations(formattedData);
      setTotalPages(res.data.totalPages); // 👉 전체 페이지 수 저장
    } catch (error) {
      console.error('예약 로딩 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations(currentPage);
  }, [currentPage]);

  const fetchManagerCount = async () => {
    try {
      const res = await adminApi.getManagerCount();
      setManagerCount(res.data);
    } catch (error) {
      console.error('매니저 카운트 로딩 에러:', error);
    }
  };

  // 🌟 2. 실제 매니저 대기 목록 불러오기
  const fetchPendingManagers = async () => {
    try {
      const res = await adminApi.getPendingManagers();
      setPendingManagers(res.data);
    } catch (error) {
      console.error('매니저 목록 로딩 에러:', error);
    }
  };

  // 초기 렌더링 시 두 데이터 모두 불러오기
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await fetchReservations(0);
      await fetchPendingManagers();
      await fetchManagerCount();
      setLoading(false);
    };
    loadAllData();
  }, []);

  // 3. 예약 상태 변경 로직
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await reservationApi.updateStatus(id, newStatus);
      Swal.fire({ icon: 'success', title: '상태 변경 완료', text: '업데이트되었습니다.', timer: 1500, showConfirmButton: false });
      fetchReservations(currentPage);
    } catch (error) {
      Swal.fire({ icon: 'error', title: '변경 실패', text: '오류가 발생했습니다.' });
    }
  };

  // 🌟 4. 매니저 승인 로직
  const handleApproveManager = async (memberId: number, name: string) => {
    const isConfirm = window.confirm(`${name} 님을 매니저로 승인하시겠습니까?`);
    if (!isConfirm) return;

    try {
      await adminApi.approveManager(memberId);
      Swal.fire({ icon: 'success', title: '승인 완료', text: `${name} 님이 매니저로 승인되었습니다.` });
      fetchPendingManagers(); // 승인 후 목록 다시 불러오기 (화면 갱신)
    } catch (error) {
      Swal.fire({ icon: 'error', title: '승인 실패', text: '서버 오류가 발생했습니다.' });
    }
  };

  // 1. 반려 함수 추가
  const handleRejectManager = async (applicationId: number, name: string) => {
    const isConfirm = window.confirm(`${name} 님의 지원을 반려하시겠습니까? (데이터가 삭제됩니다)`);
    if (!isConfirm) return;

    try {
      await adminApi.rejectManager(applicationId);
      Swal.fire({ icon: 'success', title: '반려 완료', text: '지원서가 삭제되었습니다.' });
      fetchPendingManagers(); // 목록 새로고침
    } catch (error) {
      Swal.fire({ icon: 'error', title: '반려 실패', text: '오류가 발생했습니다.' });
    }
  };

  const stats = [
    { title: '전체 예약', value: `${reservations.length}건`, icon: <CalendarDays className="w-6 h-6 text-blue-500" /> },
    { title: '매칭 대기', value: `${reservations.filter(r => r.status === 'WAITING' || r.status === '매칭 대기').length}건`, icon: <Activity className="w-6 h-6 text-orange-500" /> },
    { title: '활동 중인 매니저', value: `${managerCount}명`, icon: <Users className="w-6 h-6 text-emerald-500" /> },
    { title: '가입 승인 대기', value: `${pendingManagers.length}명`, icon: <UserPlus className="w-6 h-6 text-purple-500" /> },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const isWaiting = status === 'WAITING' || status === '매칭 대기';
    const isConfirmed = status === 'CONFIRMED' || status === '예약 확정';
    const isCompleted = status === 'COMPLETED' || status === '이용 완료';
    const isCanceled = status === 'CANCELED' || status === '취소됨';

    const colorClass = isWaiting ? 'bg-orange-100 text-orange-700' : isConfirmed ? 'bg-blue-100 text-blue-700' : isCompleted ? 'bg-emerald-100 text-emerald-700' : isCanceled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
    const displayStatus = isWaiting ? '매칭 대기' : isConfirmed ? '예약 확정' : isCompleted ? '이용 완료' : isCanceled ? '취소됨' : status;

    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>{displayStatus}</span>;
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col p-4 shadow-xl z-20">
        <div className="px-4 py-6 mb-4 border-b border-slate-800">
          <Link href="/" className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-400" />
            Admin
          </Link>
          <p className="text-slate-500 text-xs mt-1">예스케어 통합 관리 시스템</p>
        </div>
        
        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}>
            <CalendarDays className="w-5 h-5" /> 예약 관리
          </button>
          <button onClick={() => setActiveTab('managers')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'managers' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users className="w-5 h-5" /> 매니저 승인 관리
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 w-full overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">
            {activeTab === 'dashboard' ? '예약 및 매칭 현황' : '매니저 승인 관리'}
          </h1>
          
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial="hidden" animate="visible" variants={containerVariants}>
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

        {activeTab === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             {/* 예약 관리 탭 UI 유지 */}
             <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800">전체 예약 내역</h2>
            </div>
            
            <div className="md:hidden divide-y divide-slate-100">
              {reservations.map((res) => (
                <div key={res.id} className="p-5 space-y-3 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">#{res.id}</span>
                    <StatusBadge status={res.status} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {res.patient} <span className="text-sm font-medium text-slate-500 ml-1">| {res.hospital}</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{res.date} {res.time}</p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl mt-3 border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">상태 변경:</span>
                    <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="WAITING">매칭 대기</option><option value="CONFIRMED">예약 확정</option><option value="COMPLETED">이용 완료</option><option value="CANCELED">취소됨</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="p-4 font-semibold whitespace-nowrap">예약번호</th><th className="p-4 font-semibold whitespace-nowrap">일시</th><th className="p-4 font-semibold whitespace-nowrap">환자/병원</th><th className="p-4 font-semibold whitespace-nowrap">현재 상태</th><th className="p-4 font-semibold whitespace-nowrap text-center">상태 관리</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {reservations.map((res) => (
                    <tr key={res.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500">#{res.id}</td>
                      <td className="p-4"><p className="font-medium text-slate-800">{res.date}</p><p className="text-xs text-slate-500">{res.time}</p></td>
                      <td className="p-4"><p className="font-bold text-slate-800">{res.patient}</p><p className="text-xs text-slate-500">{res.hospital}</p></td>
                      <td className="p-4"><StatusBadge status={res.status} /></td>
                      <td className="p-4 text-center">
                        <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors">
                          <option value="WAITING">매칭 대기</option><option value="CONFIRMED">예약 확정</option><option value="COMPLETED">이용 완료</option><option value="CANCELED">취소됨</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && !loading && (<tr><td colSpan={6} className="p-8 text-center text-slate-500">조회된 예약이 없습니다.</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center items-center gap-2 p-6 border-t border-slate-100">
              <button 
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                이전
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-10 h-10 rounded-lg border text-sm font-bold transition-colors ${
                    currentPage === i 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                disabled={currentPage === totalPages - 1 || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                다음
              </button>
            </div>
          </motion.div>
        )}

        {/* 🌟 탭 2: 매니저 가입 승인 관리 테이블 (실제 데이터 연동 완료) */}
        {activeTab === 'managers' && (
          <motion.div key="managers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">가입 승인 대기 목록</h2>
              <p className="text-sm text-slate-500 mt-1">면접 및 교육 수료가 확인된 매니저의 계정을 승인해 주세요.</p>
            </div>
            
            <div className="md:hidden divide-y divide-slate-100">
              {pendingManagers.map((mgr) => (
                <div key={mgr.id} className="p-5 space-y-3 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">지원일: {mgr.applyDate}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      {mgr.licenseName === 'none' ? '자격증 없음' : mgr.licenseName === 'caregiver' ? '요양보호사' : mgr.licenseName === 'socialworker' ? '사회복지사' : mgr.licenseName}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {mgr.name} <span className="text-sm font-medium text-slate-500 font-normal">| {mgr.phone}</span>
                    </h3>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleApproveManager(mgr.memberId, mgr.name)}
                      className="flex-1 flex justify-center items-center gap-1.5 bg-emerald-100 text-emerald-700 py-3 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" /> 승인
                    </button>
                    <button className="flex-1 flex justify-center items-center gap-1.5 bg-red-50 text-red-600 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                      <XCircle className="w-5 h-5" /> 반려
                    </button>
                  </div>
                </div>
              ))}
              {pendingManagers.length === 0 && <div className="p-8 text-center text-slate-500">현재 대기 중인 지원서가 없습니다.</div>}
            </div>

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
                      <td className="p-4 text-emerald-700 font-medium">
                        {mgr.licenseName === 'none' ? '없음' : 
                          mgr.licenseName === 'caregiver' ? '요양보호사' : 
                          mgr.licenseName === 'socialworker' ? '사회복지사' : 
                          mgr.licenseName === 'nurse' ? '간호사/간호조무사' : mgr.licenseName}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApproveManager(mgr.memberId, mgr.name)}
                            className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors">
                            <CheckCircle2 className="w-4 h-4" /> 승인
                          </button>
                          <button onClick={() => handleRejectManager(mgr.id, mgr.name)} 
                            className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                            <XCircle className="w-4 h-4" /> 반려
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingManagers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">현재 대기 중인 지원서가 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}