'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  BriefcaseMedical, CalendarDays, Activity, ChevronRight, CheckCircle2,
  MapPin, Clock, FileText, ArrowLeft, ShieldCheck, X
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
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 권한 확인 및 데이터 로딩
  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No token');
        }

        // 권한이 매니저인지 확인
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
      <main className="max-w-4xl mx-auto px-5 pt-8">
        {/* 환영 메시지 */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{managerName} 매니저님, 환영합니다!</h1>
            <p className="text-slate-500 text-sm">오늘도 따뜻한 동행 부탁드립니다.</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <BriefcaseMedical className="w-6 h-6"/>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'available' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            <Activity className="w-4 h-4" /> 신규 동행 요청 ({availableRequests.length})
          </button>
          <button onClick={() => setActiveTab('my-schedule')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'my-schedule' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
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
                  <motion.div key={req.id} variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors">
                    {/* 1. 다채로운 뱃지 영역 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg">매칭 대기</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${req.category === '정밀 검사' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {req.category || '일반 진료'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${req.mobility === '독립 보행 가능' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {req.mobility || '거동 정보 없음'}
                      </span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                        {req.transportation || '이동 수단 미정'}
                      </span>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{req.patientName} 환자님</h3>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p className="font-bold text-slate-700">{date}</p>
                        <p>{time}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-5">
                      <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <p><span className="font-semibold text-slate-700">목적지:</span> {req.hospitalName}</p>
                      </div>

                      {/* 2. 상세 요청사항 모달 띄우기 버튼 */}
                      <button onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }}
                        className="w-full text-sm text-blue-600 bg-blue-50/50 border border-blue-100 py-2.5 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                        상세 요청사항 및 미팅 장소 확인하기 →
                      </button>
                    </div>

                    <button onClick={() => handleAcceptRequest(req.id, req.patientName)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm">
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
        {/* 상세 정보 모달창 */}
        {isModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" /> 예약 상세 정보
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-white flex-1 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 mb-2">동행 기본 정보</h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 space-y-2 border border-slate-100">
                    <p><span className="font-semibold text-slate-900 w-20 inline-block">환자명</span> {selectedRequest.patientName}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 w-20 inline-block shrink-0">만나는 장소</span> 
                      <span className="text-blue-700 font-bold">{selectedRequest.meetingPoint || '자택 앞 (연락 요망)'}</span>
                      
                      {/* 만나는 장소가 '자택'인 경우 지도 버튼 노출 */}
                      {selectedRequest.meetingPoint === '자택' && (
                        <button 
                          onClick={() => {
                            const address = selectedRequest.patientAddress; // 백엔드에서 넘겨받을 주소 정보
                            if (!address) {
                              Swal.fire({ icon: 'warning', title: '주소 미등록', text: '환자 정보에 등록된 자택 주소가 없습니다. 고객에게 연락해 주세요.' });
                              return;
                            }
                            // 카카오맵 URL 연결
                            window.open(`https://map.kakao.com/link/search/${encodeURIComponent(address)}`, '_blank');
                          }}
                          className="ml-2 px-3 py-1 bg-[#FEE500] text-[#191919] text-xs font-bold rounded-lg hover:bg-[#FADA0A] transition-colors flex items-center gap-1 shadow-sm shrink-0"
                        >
                          카카오맵 확인 🗺️
                        </button>
                      )}
                    </div>
                    <p><span className="font-semibold text-slate-900 w-20 inline-block">이동 수단</span> {selectedRequest.transportation}</p>
                  </div>
                </div>
                <div className="space-y-5 border-t border-slate-100 pt-5">
                  {/* 1. 보호자 요청사항 (회색 박스) */}
                  {selectedRequest.memo && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 mb-2">보호자 특별 요청사항</h4>
                      <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
                        {selectedRequest.memo}
                      </div>
                    </div>
                  )}

                  {/* 2. 상세 진료 내용 (파란색 박스 - 마이페이지와 동일한 불렛 포인트 적용) */}
                  {selectedRequest.detailedContent && (
                    <div>
                      <h4 className="text-sm font-bold text-blue-600 mb-2">상세 진료 및 검사 내용</h4>
                      <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-slate-800 border border-blue-100">
                        <div className="space-y-1.5">
                          {selectedRequest.detailedContent.split('\n').map((line: string, index: number) => (
                            <div key={index} className="flex items-start gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                              <p className="leading-relaxed font-medium">{line.replace('- ', '')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. 의사 질의 (주황색 박스 - 매니저가 절대 놓치지 않도록 강조!) */}
                  {selectedRequest.doctorInquiry && (
                    <div>
                      <h4 className="text-sm font-bold text-amber-600 mb-2">의사 선생님께 꼭 여쭤봐야 할 질문</h4>
                      <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-900 font-bold whitespace-pre-wrap leading-relaxed border border-amber-200 shadow-sm">
                        {selectedRequest.doctorInquiry}
                      </div>
                    </div>
                  )}
                  {/* 만약 세 가지 정보가 모두 없다면 표시할 기본 문구 */}
                  {!selectedRequest.memo && !selectedRequest.detailedContent && !selectedRequest.doctorInquiry && (
                    <p className="text-sm text-slate-400 text-center py-4">특별히 남겨진 요청사항이 없습니다.</p>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white">
                <button onClick={() => setIsModalOpen(false)}
                  className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-900 transition">
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}