'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  LayoutDashboard, Users, CalendarDays, Activity, 
  Search, CheckCircle2, XCircle, UserPlus,
  FileText, MapPin, X, UserCog, Star, Loader2, Inbox
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { adminApi, reservationApi } from '@/src/api/index';

type AdminTab = 'dashboard' | 'managers' | 'members' | 'reviews';

// 전역 Toast 알림 설정
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

const containerVariants: Variants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const itemVariants: Variants = { 
  hidden: { opacity: 0, y: 10 }, 
  visible: { opacity: 1, y: 0 } 
};

const tabVariants: Variants = { 
  hidden: { opacity: 0, y: 15 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } 
};

const StatusBadge = ({ status }: { status: string }) => {
  const isWaiting = status === 'WAITING' || status === '매칭 대기';
  const isConfirmed = status === 'CONFIRMED' || status === '예약 확정';
  const isCompleted = status === 'COMPLETED' || status === '이용 완료';
  const isCanceled = status === 'CANCELLED' || status === '취소됨';

  const colorClass = isWaiting ? 'bg-orange-100 text-orange-700 border-orange-200' 
    : isConfirmed ? 'bg-blue-100 text-blue-700 border-blue-200' 
    : isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    : isCanceled ? 'bg-red-100 text-red-700 border-red-200' 
    : 'bg-gray-100 text-gray-700 border-gray-200';
  const displayStatus = isWaiting ? '매칭 대기' : isConfirmed ? '예약 확정' : isCompleted ? '이용 완료' : isCanceled ? '취소됨' : status;

  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass} shadow-sm`}>{displayStatus}</span>;
};

const EmptyState = ({ message }: { message: string }) => (
  <tr>
    <td colSpan={10}>
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Inbox className="w-12 h-12 mb-3 text-slate-300" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </td>
  </tr>
);

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState<any[]>([]);
  const [pendingManagers, setPendingManagers] = useState<any[]>([]);
  const [managerCount, setManagerCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [members, setMembers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [memberPage, setMemberPage] = useState(0);
  const [memberTotalPages, setMemberTotalPages] = useState(0);
  
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      (m.name || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
      (m.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
    );
  }, [members, memberSearchTerm]);
  
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => 
      (r.comment || '').toLowerCase().includes(reviewSearchTerm.toLowerCase()) || 
      String(r.reservationId || '').includes(reviewSearchTerm)
    );
  }, [reviews, reviewSearchTerm]);

  const getPageTitle = () => {
    switch(activeTab) {
      case 'dashboard': return '예약 및 매칭 현황';
      case 'managers': return '매니저 승인 관리';
      case 'members': return '전체 회원 관리';
      case 'reviews': return '리뷰 및 리포트 모니터링';
      default: return '관리자 시스템';
    }
  };

  const fetchReservations = useCallback(async (page: number, keyword: string, status: string) => {
    setLoading(true);
    try {
      const res = (keyword || status) 
        ? await adminApi.searchReservations(keyword, status, page)
        : await adminApi.getReservations(page); 
      
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
  }, []);

  const fetchManagerCount = useCallback(async () => {
    try {
      const res = await adminApi.getManagerCount();
      setManagerCount(res.data);
    } catch (error) {}
  }, []);

  const fetchPendingManagers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingManagers();
      setPendingManagers(res.data);
    } catch (error) {} finally { setLoading(false); }
  }, []);

  const fetchMembers = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const res = await adminApi.getAllMembers(page);
      setMembers(res.data?.content || []); 
      setMemberTotalPages(res.data?.totalPages || 0);
    } catch (error) {} finally { setLoading(false); }
  }, []);

  const fetchReviews = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const res = await adminApi.getAllReviews(page);
      setReviews(res.data?.content || []);
      setReviewTotalPages(res.data?.totalPages || 0);
    } catch (error) {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 0) setCurrentPage(0); 
      else fetchReservations(0, searchTerm, statusFilter);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, activeTab, fetchReservations, currentPage]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchReservations(currentPage, searchTerm, statusFilter);
    }
  }, [currentPage, activeTab, searchTerm, statusFilter, fetchReservations]);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchReservations(0, '', ''),
        fetchPendingManagers(),
        fetchManagerCount()
      ]);
      setLoading(false);
    };
    loadAllData();
  }, [fetchReservations, fetchPendingManagers, fetchManagerCount]);

  useEffect(() => {
    if (activeTab === 'members') fetchMembers(memberPage);
    if (activeTab === 'reviews') fetchReviews(reviewPage);
    if (activeTab === 'managers') fetchPendingManagers();
  }, [activeTab, fetchMembers, fetchReviews, fetchPendingManagers, memberPage, reviewPage]);

  const handleOpenDetail = async (id: number) => {
    try {
      const res = await reservationApi.getDetail(String(id));
      setSelectedRequest(res.data);
      setIsModalOpen(true);
    } catch (error) {
      Swal.fire('오류', '상세 정보를 불러올 수 없습니다.', 'error');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await reservationApi.updateStatus(id, newStatus);
      Toast.fire({ icon: 'success', title: '상태가 업데이트되었습니다.' });
      fetchReservations(currentPage, searchTerm, statusFilter);
    } catch (error) {
      Toast.fire({ icon: 'error', title: '변경 실패' });
    }
  };

  const handleApproveManager = async (memberId: number, name: string) => {
    const result = await Swal.fire({
      title: '매니저 승인', text: `${name} 님의 매니저 자격을 승인하시겠습니까?`, icon: 'question',
      showCancelButton: true, confirmButtonText: '승인', cancelButtonText: '취소', confirmButtonColor: '#059669', 
    });
    if (!result.isConfirmed) return;

    try {
      await adminApi.approveManager(memberId);
      Toast.fire({ icon: 'success', title: `${name} 님이 승인되었습니다.` });
      fetchPendingManagers();
    } catch (error) {
      Swal.fire({ icon: 'error', title: '오류', text: '승인 처리 중 오류가 발생했습니다.' });
    }
  };

  const handleRejectManager = async (applicationId: number, name: string) => {
    const { value: reason } = await Swal.fire({
      title: '지원 반려 사유 입력', input: 'textarea', inputLabel: `${name} 님에게 전달할 반려 사유를 상세히 적어주세요.`,
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: '반려 처리', cancelButtonText: '취소',
      inputValidator: (value) => { if (!value) return '반려 사유를 필수로 입력해야 합니다!'; }
    });

    if (reason) {
      try {
        await adminApi.rejectManagerApp(applicationId, { rejectionReason: reason });
        Toast.fire({ icon: 'success', title: '지원이 반려되었습니다.' });
        fetchPendingManagers(); 
      } catch (error) {
        Swal.fire({ icon: 'error', title: '오류', text: '반려 처리 중 오류가 발생했습니다.' });
      }
    }
  };

  const handleChangeRole = async (memberId: number, currentRole: string) => {
    const { value: newRole } = await Swal.fire({
      title: '권한 변경', input: 'select',
      inputOptions: { 'USER': '일반 고객', 'MANAGER': '매니저', 'ADMIN': '관리자' },
      inputValue: currentRole, showCancelButton: true
    });
    
    if (newRole && newRole !== currentRole) {
      try {
        await adminApi.changeMemberRole(memberId, newRole);
        Toast.fire({ icon: 'success', title: '권한이 변경되었습니다.' });
        fetchMembers(memberPage);
      } catch (error) {
        Swal.fire('오류', '권한 변경 중 문제가 발생했습니다.', 'error');
      }
    }
  };

  const handleToggleStatus = async (member: any) => {
    const currentActive = member.active ?? member.isActive ?? true; 
    const actionText = currentActive ? '계정 정지' : '정지 해제';
    const targetActivate = !currentActive;

    const result = await Swal.fire({ 
      title: actionText, 
      text: `${member.name} 회원을 ${actionText} 하시겠습니까?`, 
      icon: 'warning', 
      showCancelButton: true, confirmButtonText: actionText 
    });
    
    if (result.isConfirmed) {
      try {
        await adminApi.updateMemberStatus(member.id, targetActivate);
        Toast.fire({ icon: 'success', title: `성공적으로 ${actionText} 되었습니다.` });
        fetchMembers(memberPage); 
      } catch (error) {
        Swal.fire('오류', '처리에 실패했습니다.', 'error');
      }
    }
  };

  const handleDeleteReview = async (id: number) => {
    const result = await Swal.fire({
      title: '리뷰 삭제', text: '정말 이 리뷰를 삭제하시겠습니까? (악성 리뷰 제재용)', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: '삭제', cancelButtonText: '취소'
    });

    if (result.isConfirmed) {
      try {
        await adminApi.deleteReview(id);
        Toast.fire({ icon: 'success', title: '리뷰가 삭제되었습니다.' });
        fetchReviews(reviewPage); 
      } catch (error) {
        Swal.fire('오류', '리뷰 삭제 중 문제가 발생했습니다.', 'error');
      }
    }
  };

  const getStats = () => {
    switch (activeTab) {
      case 'dashboard':
        return [
          { title: '전체 예약', value: `${reservations.length}건`, icon: <CalendarDays className="w-6 h-6 text-blue-500" /> },
          { title: '매칭 대기', value: `${reservations.filter(r => r.status === 'WAITING' || r.status === '매칭 대기').length}건`, icon: <Activity className="w-6 h-6 text-orange-500" /> },
          { title: '활동 중인 매니저', value: `${managerCount}명`, icon: <Users className="w-6 h-6 text-emerald-500" /> },
          { title: '가입 승인 대기', value: `${pendingManagers.length}명`, icon: <UserPlus className="w-6 h-6 text-purple-500" /> },
        ];
      case 'managers':
        return [
          { title: '총 지원자', value: `${pendingManagers.length}명`, icon: <FileText className="w-6 h-6 text-slate-500" /> },
          { title: '요양보호사 자격', value: `${pendingManagers.filter(m => m.licenseName === 'caregiver').length}명`, icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
          { title: '사회복지사 자격', value: `${pendingManagers.filter(m => m.licenseName === 'socialworker').length}명`, icon: <CheckCircle2 className="w-6 h-6 text-blue-500" /> },
          { title: '기타/자격 없음', value: `${pendingManagers.filter(m => m.licenseName === 'none' || !m.licenseName).length}명`, icon: <UserPlus className="w-6 h-6 text-orange-500" /> },
        ];
      case 'members':
        return [
          { title: '전체 회원', value: `${members.length}명`, icon: <Users className="w-6 h-6 text-purple-500" /> },
          { title: '일반 고객', value: `${members.filter(m => m.role.includes('USER')).length}명`, icon: <UserCog className="w-6 h-6 text-slate-500" /> },
          { title: '매니저', value: `${members.filter(m => m.role.includes('MANAGER')).length}명`, icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
          { title: '정지된 계정', value: `${members.filter(m => m.active === false || m.isActive === false).length}명`, icon: <XCircle className="w-6 h-6 text-red-500" /> },
        ];
      case 'reviews':
        const avgRating = reviews.length > 0 ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1) : 0;
        return [
          { title: '전체 리뷰', value: `${reviews.length}건`, icon: <Star className="w-6 h-6 text-amber-500" /> },
          { title: '평균 평점', value: `${avgRating}점`, icon: <Activity className="w-6 h-6 text-blue-500" /> },
          { title: '만점(5점) 리뷰', value: `${reviews.filter(r => r.rating === 5).length}건`, icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
          { title: '주의(2점 이하) 리뷰', value: `${reviews.filter(r => r.rating <= 2).length}건`, icon: <XCircle className="w-6 h-6 text-red-500" /> },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-gray-900 flex flex-col md:flex-row relative selection:bg-blue-100">
      {/* 상세 정보 모달 */}
      <AnimatePresence>
        {isModalOpen && selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
                  예약 상세 정보 <span className="text-sm font-medium text-slate-400 ml-1">#{selectedRequest.id}</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Users className="w-4 h-4"/> 고객 정보</h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                    <p><span className="font-semibold text-slate-900 block mb-1">환자명</span> {selectedRequest.patientName} ({selectedRequest.patientPhone})</p>
                    <p><span className="font-semibold text-slate-900 block mb-1">보호자명</span> {selectedRequest.guardianName || '-'} ({selectedRequest.guardianPhone || '-'})</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4"/> 일정 및 장소</h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 space-y-3 border border-slate-100">
                    <p><span className="font-semibold text-slate-900 w-20 inline-block">일시</span> {selectedRequest.reservationTime.replace('T', ' ').substring(0, 16)}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 w-20 inline-block shrink-0">목적지</span> 
                      <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(selectedRequest.hospitalName)}`, '_blank')} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                        {selectedRequest.hospitalName} <MapPin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 w-20 inline-block shrink-0">만나는 장소</span> 
                      <span className="text-slate-800 font-medium">
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

                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 mb-1.5">보호자 특별 요청사항</h4>
                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap border border-slate-200/60 leading-relaxed">
                      {selectedRequest.requirements || selectedRequest.memo || '요청사항이 없습니다.'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-600 mb-1.5">상세 진료 및 검사 내용</h4>
                    <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-slate-800 border border-blue-100/50 whitespace-pre-wrap leading-relaxed">
                      {selectedRequest.detailedContent || '상세 내용이 없습니다.'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-600 mb-1.5">의사 선생님께 꼭 여쭤봐야 할 질문</h4>
                    <div className="bg-amber-50/50 p-4 rounded-xl text-sm text-amber-900 font-bold whitespace-pre-wrap border border-amber-100/50 leading-relaxed">
                      {selectedRequest.doctorInquiry || '질문 사항이 없습니다.'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 좌측 사이드바 */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col shadow-2xl z-20 sticky top-0 md:h-screen">
        <div className="px-6 py-8 border-b border-slate-800/80 flex flex-col gap-1">
          <Link href="/" className="text-2xl font-black text-white tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white"><LayoutDashboard className="w-5 h-5" /></div>
            YesCare
          </Link>
          <p className="text-slate-400 text-[11px] font-medium tracking-wide pl-10">통합 관리 시스템</p>
        </div>
        
        <nav className="flex flex-row md:flex-col gap-1.5 p-4 overflow-x-auto no-scrollbar md:flex-1 md:overflow-y-auto">
          {[
            { id: 'dashboard', icon: CalendarDays, label: '예약 관리' },
            { id: 'managers', icon: UserPlus, label: '매니저 승인 관리', badge: pendingManagers.length },
            { id: 'members', icon: UserCog, label: '전체 회원 관리' },
            { id: 'reviews', icon: Star, label: '리뷰 모니터링' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)} 
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all whitespace-nowrap outline-none
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-200' : ''}`} /> 
                {item.label}
              </div>
              {item.badge ? (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? 'bg-white text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              {getPageTitle()}
              {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            </h1>
            
            <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial="hidden" animate="visible" variants={containerVariants}>
              {getStats().map((stat, idx) => (
                <motion.div key={`${activeTab}-${idx}`} variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className="p-3.5 bg-slate-50 group-hover:bg-blue-50 transition-colors rounded-xl border border-slate-100">{stat.icon}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1 tracking-wide">{stat.title}</p>
                    <p className="text-xl md:text-2xl font-black text-slate-800">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {/* 탭 1: 전체 예약 내역 */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mt-6 flex flex-col">
                 <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-800">예약 리스트</h2>
                  
                  <form onSubmit={(e) => e.preventDefault()} className="flex items-center w-full sm:w-auto gap-2">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all cursor-pointer hover:border-slate-300">
                      <option value="">상태 전체</option>
                      <option value="WAITING">매칭 대기</option>
                      <option value="CONFIRMED">예약 확정</option>
                      <option value="COMPLETED">이용 완료</option>
                      <option value="CANCELLED">취소됨</option>
                    </select>
                    <div className="relative w-full sm:w-64">
                      <input 
                        type="text" placeholder="환자명, 병원명 검색..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all placeholder:text-slate-400"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </form>
                </div>
                
                {/* 모바일 뷰 */}
                <div className="md:hidden divide-y divide-slate-100 bg-white">
                  {loading && reservations.length === 0 ? (
                    <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
                  ) : reservations.length > 0 ? reservations.map((res) => (
                    <div key={res.id} className="p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded">#{res.id}</span>
                        <StatusBadge status={res.status} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">
                          {res.patient} <span className="text-xs font-medium text-slate-400 ml-1">| {res.hospital}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium"><CalendarDays className="w-3.5 h-3.5" />{res.date} {res.time}</p>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl mt-3 border border-slate-100">
                        <button onClick={() => handleOpenDetail(res.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                          상세 보기
                        </button>
                        <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
                          <option value="WAITING">매칭 대기</option><option value="CONFIRMED">예약 확정</option><option value="COMPLETED">이용 완료</option><option value="CANCELLED">취소됨</option>
                        </select>
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-400 text-sm">조회된 예약이 없습니다.</div>
                  )}
                </div>

                {/* 데스크탑 뷰 */}
                <div className="hidden md:block overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 shadow-sm">
                      <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="p-4 font-bold whitespace-nowrap pl-6">예약번호</th>
                        <th className="p-4 font-bold whitespace-nowrap">일시</th>
                        <th className="p-4 font-bold whitespace-nowrap">환자/병원</th>
                        <th className="p-4 font-bold whitespace-nowrap">현재 상태</th>
                        <th className="p-4 font-bold whitespace-nowrap text-center pr-6">상세 및 상태 관리</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm bg-white">
                      {loading && reservations.length === 0 ? (
                        <tr><td colSpan={5} className="p-16 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></td></tr>
                      ) : reservations.length > 0 ? reservations.map((res) => (
                        <tr key={res.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4 pl-6 text-slate-400 font-medium">#{res.id}</td>
                          <td className="p-4"><p className="font-semibold text-slate-800">{res.date}</p><p className="text-xs text-slate-500 mt-0.5">{res.time}</p></td>
                          <td className="p-4"><p className="font-bold text-slate-800">{res.patient}</p><p className="text-xs text-slate-500 mt-0.5">{res.hospital}</p></td>
                          <td className="p-4"><StatusBadge status={res.status} /></td>
                          <td className="p-4 pr-6 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button onClick={() => handleOpenDetail(res.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm whitespace-nowrap">
                                상세 보기
                              </button>
                              <select value={res.status} onChange={(e) => handleStatusChange(res.id, e.target.value)} className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm hover:border-slate-300 transition-all">
                                <option value="WAITING">매칭 대기</option><option value="CONFIRMED">예약 확정</option><option value="COMPLETED">이용 완료</option><option value="CANCELLED">취소됨</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      )) : <EmptyState message="조건에 맞는 예약이 없습니다." />}
                    </tbody>
                  </table>
                </div>
                
                {/* 페이지네이션 */}
                {totalPages > 0 && (
                  <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i} onClick={() => setCurrentPage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                        {i + 1}
                      </button>
                    ))}
                    <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 탭 2: 매니저 가입 승인 관리 */}
            {activeTab === 'managers' && (
              <motion.div key="managers" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mt-6">
                <div className="p-5 border-b border-slate-100 bg-emerald-50/30">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-600" /> 가입 승인 대기 목록
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">면접 및 교육 수료가 확인된 매니저의 계정을 검토 후 승인해 주세요.</p>
                </div>
                
                {/* 모바일 뷰 */}
                <div className="md:hidden divide-y divide-slate-100">
                  {loading && pendingManagers.length === 0 ? (
                    <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
                  ) : pendingManagers.length > 0 ? pendingManagers.map((mgr) => (
                    <div key={mgr.id} className="p-5 space-y-3 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-slate-400">지원일: {mgr.applyDate}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md">
                          {mgr.licenseName === 'none' ? '자격증 없음' : mgr.licenseName === 'caregiver' ? '요양보호사' : mgr.licenseName === 'socialworker' ? '사회복지사' : mgr.licenseName}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase tracking-wider">Available:</span>
                        {mgr.availableDays?.split(',').map((day: string) => (
                          <span key={day} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {day}
                          </span>
                        ))}
                        <span className="text-[10px] text-slate-500 ml-1 font-medium">({mgr.availableTime})</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">
                          {mgr.name} <span className="text-xs font-medium text-slate-500 ml-1">| {mgr.phone}</span>
                        </h3>
                        {mgr.certificateUrl && (
                          <a href={`${process.env.NEXT_PUBLIC_API_URL}${mgr.certificateUrl}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm">
                            📄 증빙서류 확인
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleApproveManager(mgr.memberId, mgr.name)} className="flex-1 flex justify-center items-center gap-1.5 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20">
                          <CheckCircle2 className="w-4 h-4" /> 승인
                        </button>
                        <button onClick={() => handleRejectManager(mgr.id, mgr.name)} className="flex-1 flex justify-center items-center gap-1.5 bg-white border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors shadow-sm">
                          <XCircle className="w-4 h-4" /> 반려
                        </button>
                      </div>
                    </div>
                  )) : <div className="p-10 text-center text-slate-400 text-sm">현재 대기 중인 지원서가 없습니다.</div>}
                </div>

                {/* 데스크탑 뷰 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4 font-bold whitespace-nowrap pl-6">지원일자</th>
                        <th className="p-4 font-bold whitespace-nowrap">이름/연락처</th>
                        <th className="p-4 font-bold whitespace-nowrap">보유 자격증</th>
                        <th className="p-4 font-bold whitespace-nowrap text-center">근무 가능 시간</th>
                        <th className="p-4 font-bold whitespace-nowrap text-center">첨부파일</th>
                        <th className="p-4 font-bold whitespace-nowrap text-right pr-6">계정 승인</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm bg-white">
                      {loading && pendingManagers.length === 0 ? (
                        <tr><td colSpan={6} className="p-16 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></td></tr>
                      ) : pendingManagers.length > 0 ? pendingManagers.map((mgr) => (
                        <tr key={mgr.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6 text-slate-500 font-medium">{mgr.applyDate}</td>
                          <td className="p-4"><p className="font-bold text-slate-800">{mgr.name}</p><p className="text-xs text-slate-500 mt-0.5">{mgr.phone}</p></td>
                          <td className="p-4">
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100">
                              {mgr.licenseName === 'none' ? '없음' : mgr.licenseName === 'caregiver' ? '요양보호사' : mgr.licenseName === 'socialworker' ? '사회복지사' : mgr.licenseName === 'nurse' ? '간호사' : mgr.licenseName}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex gap-1 flex-wrap justify-center">
                                {mgr.availableDays?.split(',').map((day: string) => (
                                  <span key={day} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                    {day}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">{mgr.availableTime}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {mgr.certificateUrl ? (
                              <a href={`${process.env.NEXT_PUBLIC_API_URL}${mgr.certificateUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
                                <FileText className="w-3.5 h-3.5" /> 보기
                              </a>
                            ) : <span className="text-slate-300 text-xs font-medium">없음</span>}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleApproveManager(mgr.memberId, mgr.name)} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20">
                                <CheckCircle2 className="w-4 h-4" /> 승인
                              </button>
                              <button onClick={() => handleRejectManager(mgr.id, mgr.name)} className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-all shadow-sm">
                                <XCircle className="w-4 h-4" /> 반려
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : <EmptyState message="대기 중인 지원서가 없습니다." />}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 탭 3: 전체 회원 관리 */}
            {activeTab === 'members' && (
               <motion.div key="members" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mt-6">
                 <div className="p-5 border-b border-slate-100 bg-purple-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <UserCog className="w-5 h-5 text-purple-600" /> 전체 회원 목록
                   </h2>
                   <form onSubmit={(e) => e.preventDefault()} className="flex items-center w-full sm:w-auto">
                     <div className="relative w-full sm:w-64">
                        <input type="text" placeholder="이름 또는 이메일 검색..." value={memberSearchTerm} onChange={(e) => setMemberSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all placeholder:text-slate-400" />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                     </div>
                   </form>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[700px]">
                     <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                       <tr>
                         <th className="p-4 font-bold pl-6">회원 ID</th>
                         <th className="p-4 font-bold">이메일</th>
                         <th className="p-4 font-bold">이름</th>
                         <th className="p-4 font-bold">권한 (Role)</th>
                         <th className="p-4 font-bold text-center pr-6">관리</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm bg-white">
                      {loading && filteredMembers.length === 0 ? (
                        <tr><td colSpan={5} className="p-16 text-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" /></td></tr>
                      ) : filteredMembers.length > 0 ? filteredMembers.map((member) => {
                        const isAccountActive = member.active ?? member.isActive ?? true;
                        return (
                          <tr key={member.id} className={`border-b border-slate-100 transition-colors group ${!isAccountActive ? 'bg-red-50/50' : 'hover:bg-slate-50/50'}`}>
                            <td className="p-4 pl-6 text-slate-400 font-medium">#{member.id}</td>
                            <td className="p-4 text-slate-600 font-medium">{member.email}</td>
                            <td className="p-4 text-slate-800 font-bold">{member.name}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border 
                                ${member.role.includes('ADMIN') ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                  member.role.includes('MANAGER') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {member.role.includes('ADMIN') ? '관리자' : member.role.includes('MANAGER') ? '매니저' : '일반 고객'}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-center">
                              <div className="flex justify-center gap-2 items-center">
                                {member.role.includes('ADMIN') ? (
                                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60">관리 불가</span>
                                ) : (
                                  <>
                                    <button onClick={() => handleChangeRole(member.id, member.role)} className="text-xs text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-all font-bold shadow-sm">
                                      권한변경
                                    </button>
                                    <button 
                                      onClick={() => handleToggleStatus(member)} 
                                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm ${
                                        isAccountActive 
                                          ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' 
                                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                                      }`}
                                    >
                                      {isAccountActive ? '계정 정지' : '정지 해제'}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }) : <EmptyState message="검색 결과가 없습니다." />}
                     </tbody>
                    </table>
                  </div>
                  {memberTotalPages > 0 && (
                  <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
                    <button disabled={memberPage === 0} onClick={() => setMemberPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
                    {[...Array(memberTotalPages)].map((_, i) => (
                      <button key={i} onClick={() => setMemberPage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${memberPage === i ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                        {i + 1}
                      </button>
                    ))}
                    <button disabled={memberPage >= memberTotalPages - 1} onClick={() => setMemberPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
                  </div>
                )}
                </motion.div>
            )}

            {/* 탭 4: 리뷰 및 리포트 모니터링 */}
            {activeTab === 'reviews' && (
               <motion.div key="reviews" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mt-6">
                 <div className="p-5 border-b border-slate-100 bg-amber-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <Star className="w-5 h-5 text-amber-500" /> 작성된 리뷰 모니터링
                   </h2>
                   <form onSubmit={(e) => e.preventDefault()} className="flex items-center w-full sm:w-auto">
                     <div className="relative w-full sm:w-64">
                        <input type="text" placeholder="예약번호 또는 내용 검색..." value={reviewSearchTerm} onChange={(e) => setReviewSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition-all placeholder:text-slate-400" />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                     </div>
                   </form>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[800px]">
                     <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                       <tr>
                         <th className="p-4 font-bold pl-6">리뷰 ID</th>
                         <th className="p-4 font-bold">예약 번호 / 작성자</th>
                         <th className="p-4 font-bold">평점</th>
                         <th className="p-4 font-bold w-2/5">리뷰 내용</th>
                         <th className="p-4 font-bold text-center pr-6">관리</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm bg-white">
                      {loading && filteredReviews.length === 0 ? (
                        <tr><td colSpan={5} className="p-16 text-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" /></td></tr>
                      ) : filteredReviews.length > 0 ? filteredReviews.map((review) => (
                         <tr key={review.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                           <td className="p-4 pl-6 text-slate-400 font-medium">#{review.id}</td>
                           <td className="p-4">
                             <button className="text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-1" onClick={() => handleOpenDetail(review.reservationId)}>
                               예약 #{review.reservationId} <FileText className="w-3 h-3" />
                             </button>
                           </td>
                           <td className="p-4">
                             <div className="flex items-center text-amber-400">
                               {[...Array(5)].map((_, i) => (
                                 <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                               ))}
                               <span className="ml-1.5 text-slate-700 font-bold text-xs">{review.rating}</span>
                             </div>
                           </td>
                           <td className="p-4 text-slate-600 font-medium leading-relaxed max-w-xs break-all" title={review.comment}>
                             {review.comment}
                           </td>
                           <td className="p-4 pr-6 text-center">
                             <button onClick={() => handleDeleteReview(review.id)} className="text-xs flex items-center justify-center gap-1 mx-auto bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-50 hover:text-red-700 transition-all shadow-sm opacity-80 group-hover:opacity-100">
                               <XCircle className="w-3.5 h-3.5" /> 삭제
                             </button>
                           </td>
                         </tr>
                       )) : <EmptyState message="등록된 리뷰가 없습니다." />}
                     </tbody>
                   </table>
                 </div>
                 {reviewTotalPages > 0 && (
                  <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
                    <button disabled={reviewPage === 0} onClick={() => setReviewPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
                    {[...Array(reviewTotalPages)].map((_, i) => (
                      <button key={i} onClick={() => setReviewPage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${reviewPage === i ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                        {i + 1}
                      </button>
                    ))}
                    <button disabled={reviewPage >= reviewTotalPages - 1} onClick={() => setReviewPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
                  </div>
                )}
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}