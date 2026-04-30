'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  LayoutDashboard, Users, CalendarDays, Activity, 
  Search, CheckCircle2, XCircle, ChevronRight, UserPlus,
  FileText, MapPin, X // 🌟 모달용 아이콘 추가
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

  // 🌟 모달창 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

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
      setTotalPages(res.data.totalPages);
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

  // 실제 매니저 대기 목록 불러오기
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

  // 🌟 예약 상세 정보 불러오기 로직 추가
  const handleOpenDetail = async (id: number) => {
    try {
      const res = await reservationApi.getDetail(String(id));
      setSelectedRequest(res.data);
      setIsModalOpen(true);
    } catch (error) {
      Swal.fire('오류', '상세 정보를 불러올 수 없습니다.', 'error');
    }
  };

  // 예약 상태 변경 로직
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await reservationApi.updateStatus(id, newStatus);
      Swal.fire({ icon: 'success', title: '상태 변경 완료', text: '업데이트되었습니다.', timer: 1500, showConfirmButton: false });
      fetchReservations(currentPage);
    } catch (error) {
      Swal.fire({ icon: 'error', title: '변경 실패', text: '오류가 발생했습니다.' });
    }
  };

  // 매니저 승인 로직
  const handleApproveManager = async (memberId: number, name: string) => {
    const result = await Swal.fire({
      title: '매니저 승인',
      text: `${name} 님의 매니저 자격을 승인하시겠습니까?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '승인',
      cancelButtonText: '취소',
      confirmButtonColor: '#059669', // emerald-600
    });

    if (!result.isConfirmed) return;

    try {
      await adminApi.approveManager(memberId);
      Swal.fire({ icon: 'success', title: '승인 완료', text: `${name} 님이 매니저로 승인되었습니다.` });
      fetchPendingManagers();
    } catch (error) {
      Swal.fire({ icon: 'error', title: '오류', text: '승인 처리 중 오류가 발생했습니다.' });
    }
  };

  const handleRejectManager = async (applicationId: number, name: string) => {
    const result = await Swal.fire({
      title: '지원 반려',
      text: `${name} 님의 매니저 지원을 반려하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '반려',
      cancelButtonText: '취소',
      confirmButtonColor: '#dc2626', // red-600
    });

    if (!result.isConfirmed) return;

    try {
      await adminApi.rejectManager(applicationId);
      Swal.fire({ icon: 'success', title: '반려 완료', text: '지원이 반려되었습니다.' });
      fetchPendingManagers();
    } catch (error) {
      Swal.fire({ icon: 'error', title: '오류', text: '반려 처리 중 오류가 발생했습니다.' });
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
    const isCanceled = status === 'CANCELLED' || status === '취소됨';

    const colorClass = isWaiting ? 'bg-orange-100 text-orange-700' : isConfirmed ? 'bg-blue-100 text-blue-700' : isCompleted ? 'bg-emerald-100 text-emerald-700' : isCanceled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
    const displayStatus = isWaiting ? '매칭 대기' : isConfirmed ? '예약 확정' : isCompleted ? '이용 완료' : isCanceled ? '취소됨' : status;

    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>{displayStatus}</span>;
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex flex-col md:flex-row relative">
      
      {/* 🌟 예약 상세 정보 팝업 (모달창) */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                예약 상세 정보 <span className="text-sm font-normal text-slate-500">#{selectedRequest.id}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-2">고객 정보</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <p><span className="font-semibold text-slate-900 block mb-1">환자명</span> {selectedRequest.patientName} ({selectedRequest.patientPhone})</p>
                  <p><span className="font-semibold text-slate-900 block mb-1">보호자명</span> {selectedRequest.guardianName || '-'} ({selectedRequest.guardianPhone || '-'})</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-2">일정 및 장소</h4>
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 space-y-3 border border-slate-100">
                  <p><span className="font-semibold text-slate-900 w-20 inline-block">일시</span> {selectedRequest.reservationTime.replace('T', ' ').substring(0, 16)}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 w-20 inline-block shrink-0">목적지</span> 
                    <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(selectedRequest.hospitalName)}`, '_blank')} className="text-emerald-700 font-bold hover:underline decoration-emerald-300 flex items-center gap-1">
                      {selectedRequest.hospitalName} <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 w-20 inline-block shrink-0">만나는 장소</span> 
                    <span className="text-blue-700 font-bold">
                      {selectedRequest.meetingPoint ? selectedRequest.meetingPoint.replace(' /// ', ' ') : '자택'}
                    </span>
                    <button onClick={() => {
                        const rawPoint = selectedRequest.meetingPoint || '자택';
                        const searchTarget = rawPoint === '자택' ? selectedRequest.patientAddress : rawPoint.split(' /// ')[0];
                        
                        if (!searchTarget) return Swal.fire('알림', '주소 정보가 없습니다.', 'warning');
                        window.open(`https://map.kakao.com/link/search/${encodeURIComponent(searchTarget)}`, '_blank');
                      }}
                      className="ml-2 px-2.5 py-1 bg-[#FEE500] text-[#191919] text-[11px] font-bold rounded-md hover:bg-[#FADA0A] transition-colors flex items-center gap-1 shadow-sm"
                    >
                      지도 보기
                    </button>
                  </div>
                  <p><span className="font-semibold text-slate-900 w-20 inline-block">이동 수단</span> {selectedRequest.transportation || '미기재'}</p>
                </div>
              </div>

              {/* 3단 분할 상세 요청사항 */}
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 mb-1.5">보호자 특별 요청사항</h4>
                  <div className="bg-slate-50 p-3.5 rounded-xl text-sm text-slate-700 whitespace-pre-wrap border border-slate-200">
                    {selectedRequest.requirements || selectedRequest.memo || '요청사항이 없습니다.'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-600 mb-1.5">상세 진료 및 검사 내용</h4>
                  <div className="bg-blue-50/50 p-3.5 rounded-xl text-sm text-slate-800 border border-blue-100 whitespace-pre-wrap">
                    {selectedRequest.detailedContent || '상세 내용이 없습니다.'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-600 mb-1.5">의사 선생님께 꼭 여쭤봐야 할 질문</h4>
                  <div className="bg-amber-50 p-3.5 rounded-xl text-sm text-amber-900 font-bold whitespace-pre-wrap border border-amber-200">
                    {selectedRequest.doctorInquiry || '질문 사항이 없습니다.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
             <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800">전체 예약 내역</h2>
            </div>
            
            {/* 🌟 모바일 뷰 카드에 상세 보기 버튼 추가 */}
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
                    <button onClick={() => handleOpenDetail(res.id)} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors">
                      상세 보기
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-600">상태:</span>
                      <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-1.5 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="WAITING">매칭 대기</option><option value="CONFIRMED">예약 확정</option><option value="COMPLETED">이용 완료</option><option value="CANCELED">취소됨</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 🌟 데스크톱 뷰 테이블에 상세 보기 버튼 추가 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                    <th className="p-4 font-semibold whitespace-nowrap">예약번호</th>
                    <th className="p-4 font-semibold whitespace-nowrap">일시</th>
                    <th className="p-4 font-semibold whitespace-nowrap">환자/병원</th>
                    <th className="p-4 font-semibold whitespace-nowrap">현재 상태</th>
                    <th className="p-4 font-semibold whitespace-nowrap text-center">상세 및 상태 관리</th>
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
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => handleOpenDetail(res.id)} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors whitespace-nowrap">
                            상세 보기
                          </button>
                          <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors">
                            <option value="WAITING">매칭 대기</option><option value="CONFIRMED">예약 확정</option><option value="COMPLETED">이용 완료</option><option value="CANCELED">취소됨</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && !loading && (<tr><td colSpan={6} className="p-8 text-center text-slate-500">조회된 예약이 없습니다.</td></tr>)}
                </tbody>
              </table>
            </div>
            
            {/* 페이지네이션 유지 */}
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

        {/* 탭 2: 매니저 가입 승인 관리 테이블 (기존 내용 완벽 유지) */}
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
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">Available:</span>
                    {mgr.availableDays?.split(',').map((day: string) => (
                      <span key={day} className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                        {day}
                      </span>
                    ))}
                    <span className="text-[11px] text-slate-500 ml-1">({mgr.availableTime})</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {mgr.name} <span className="text-sm font-medium text-slate-500 font-normal">| {mgr.phone}</span>
                    </h3>
                    {mgr.certificateUrl && (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}${mgr.certificateUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200">
                        📄 증빙서류 확인
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleApproveManager(mgr.memberId, mgr.name)}
                      className="flex-1 flex justify-center items-center gap-1.5 bg-emerald-100 text-emerald-700 py-3 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors">
                      <CheckCircle2 className="w-5 h-5" /> 승인
                    </button>
                    <button onClick={() => handleRejectManager(mgr.id, mgr.name)} className="flex-1 flex justify-center items-center gap-1.5 bg-red-50 text-red-600 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
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
                    <th className="p-4 font-semibold whitespace-nowrap text-center">근무 가능 시간</th>
                    <th className="p-4 font-semibold whitespace-nowrap text-center">첨부파일</th>
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
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex gap-1">
                            {mgr.availableDays?.split(',').map((day: string) => (
                              <span key={day} className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                                {day}
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">{mgr.availableTime}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {mgr.certificateUrl ? (
                          <a href={`${process.env.NEXT_PUBLIC_API_URL}${mgr.certificateUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                            파일 보기
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">없음</span>
                        )}
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
                  {pendingManagers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">현재 대기 중인 지원서가 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}