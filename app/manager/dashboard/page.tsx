'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  BriefcaseMedical, CalendarDays, Activity, ChevronRight, CheckCircle2,
  MapPin, Clock, FileText, ArrowLeft, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { reservationApi, authApi } from '@/src/api/index';
import axios from 'axios';

export default function ManagerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'available' | 'my-schedule'>('available');
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [mySchedules, setMySchedules] = useState<any[]>([]);
  const [managerName, setManagerName] = useState('매니저');
  const [loading, setLoading] = useState(true);

  // 🌟 1. 권한 확인 및 데이터 로딩
  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No token');
        }

        // 1. 권한이 매니저인지 확인
        const meRes = await authApi.getMe();
        if (meRes.data.role !== 'MANAGER' && meRes.data.role !== 'ADMIN') {
          Swal.fire({ icon: 'error', title: '접근 제한', text: '매니저 전용 페이지입니다.' });
          router.push('/');
          return;
        }
        setManagerName(meRes.data.name);

        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [waitingRes, mySchedulesRes] = await Promise.all([
          reservationApi.getWaiting(),
          reservationApi.getManagerSchedules()
        ]);

        // 백엔드에서 이미 필터링된 데이터를そのまま 넣어줍니다.
        setAvailableRequests(waitingRes.data);
        setMySchedules(mySchedulesRes.data);

      } catch (error) {
        console.error('대시보드 로딩 에러:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  // 2. 동행 수락 로직
  const handleAcceptRequest = async (reservationId: number, patientName: string) => {
    const isConfirm = window.confirm(`${patientName} 환자님의 동행 요청을 수락하시겠습니까?`);
    if (!isConfirm) return;

    try {
      // updateStatus 대신 새롭게 만든 accept API를 호출합니다!
      await reservationApi.accept(reservationId);
      
      Swal.fire({ icon: 'success', title: '배정 완료', text: '나의 일정에 추가되었습니다.' });
      
      // 화면 즉시 갱신 (대기 목록에서 빼고 내 일정으로 넘김)
      const acceptedReq = availableRequests.find(r => r.id === reservationId);
      if (acceptedReq) {
        acceptedReq.status = 'CONFIRMED';
        setAvailableRequests(prev => prev.filter(r => r.id !== reservationId));
        setMySchedules(prev => [acceptedReq, ...prev]);
      }
    } catch (error: any) {
      // 🌟 다른 매니저가 0.1초 차이로 먼저 눌렀을 때의 에러 처리
      const errorMsg = error.response?.data || '서버 오류가 발생했습니다.';
      Swal.fire({ icon: 'warning', title: '배정 실패', text: errorMsg });
      
      // 이미 뺏긴 예약이라면 화면에서도 즉시 지워줍니다.
      setAvailableRequests(prev => prev.filter(r => r.id !== reservationId));
    }
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  // 날짜/시간 포맷팅 함수
  const formatDateTime = (dateString: string) => {
    const dateObj = new Date(dateString);
    return {
      date: dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-emerald-600 font-bold">데이터를 불러오는 중입니다...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* 상단 네비게이션 */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-emerald-100 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> <span className="font-medium">홈으로</span>
          </Link>
          <div className="font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5" />매니저 시스템</div>
          <div className="w-16"></div> {/* 균형 맞추기 */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pt-8">
        {/* 환영 메시지 */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{managerName} 매니저님, 환영합니다!</h1>
            <p className="text-slate-500 text-sm">오늘도 따뜻한 동행 부탁드립니다.</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <BriefcaseMedical className="w-6 h-6" />
          </div>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('available')} 
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'available' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Activity className="w-4 h-4" /> 신규 동행 요청 ({availableRequests.length})
          </button>
          <button 
            onClick={() => setActiveTab('my-schedule')} 
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'my-schedule' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            <CalendarDays className="w-4 h-4" /> 나의 일정 ({mySchedules.length})
          </button>
        </div>

        {/* 탭 1: 신규 요청 목록 */}
        {activeTab === 'available' && (
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
            {availableRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">현재 대기 중인 신규 동행 요청이 없습니다.</p>
              </div>
            ) : (
              availableRequests.map((req) => {
                const { date, time } = formatDateTime(req.reservationTime);
                return (
                  <motion.div key={req.id} variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full mb-2">매칭 대기</span>
                        <h3 className="text-lg font-bold text-slate-800">{req.patientName} 환자님</h3>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p className="font-bold text-slate-700">{date}</p>
                        <p>{time}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                      <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><p><span className="font-semibold text-slate-700">목적지:</span> {req.hospitalName}</p></div>
                      <div className="flex items-start gap-2"><FileText className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><p><span className="font-semibold text-slate-700">요청사항:</span> {req.requirements || '없음'}</p></div>
                    </div>

                    <button 
                      onClick={() => handleAcceptRequest(req.id, req.patientName)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" /> 이 동행 수락하기
                    </button>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* 탭 2: 나의 일정 목록 */}
        {activeTab === 'my-schedule' && (
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
            {mySchedules.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">예정된 동행 일정이 없습니다.</p>
              </div>
            ) : (
              mySchedules.map((req) => {
                const { date, time } = formatDateTime(req.reservationTime);
                const isCompleted = req.status === 'COMPLETED' || req.status === '이용 완료';
                
                return (
                  <motion.div key={req.id} variants={itemVariants} className={`bg-white rounded-2xl p-5 shadow-sm border ${isCompleted ? 'border-slate-100 opacity-70' : 'border-emerald-100 border-l-4 border-l-emerald-500'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full mb-2 ${isCompleted ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isCompleted ? '이용 완료' : '예약 확정'}
                        </span>
                        <h3 className="text-lg font-bold text-slate-800">{req.patientName} 환자님</h3>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p className="font-bold text-slate-700">{date}</p>
                        <p>{time}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-500" /> {req.hospitalName}</p>
                    
                    {!isCompleted && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                        <Link href={`/manager/report/${req.id}`} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg transition-colors text-center text-sm">
                          케어 리포트 작성
                        </Link>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}