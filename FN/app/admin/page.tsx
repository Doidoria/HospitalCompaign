// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { adminApi, reservationApi } from '@/src/api/index';
import { User, Mail, Phone, ShieldCheck, Home } from 'lucide-react';
import { Toast, YesAlert, MySwal, WideSwal } from '@/src/utils/alert';

// UI & Layout
import Sidebar from '@/src/components/admin/ui/Sidebar';
import DetailModal from '@/src/components/admin/modals/DetailModal';
import ManagerListModalContent from '@/src/components/admin/modals/ManagerListModalContent';

// Tabs
import ReservationTab from '@/src/components/admin/tabs/ReservationTab';
import ManagerTab from '@/src/components/admin/tabs/ManagerTab';
import MemberTab from '@/src/components/admin/tabs/MemberTab';
import ReviewTab from '@/src/components/admin/tabs/ReviewTab';
import NoticeTab from '@/src/components/admin/tabs/NoticeTab';
import InquiryTab from '@/src/components/admin/tabs/InquiryTab';

import PopupTab from '@/src/components/admin/tabs/PopupTab';

type AdminTab = 'dashboard' | 'managers' | 'members' | 'reviews' | 'inquiries' | 'notices' | 'popups';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [pendingManagerCount, setPendingManagerCount] = useState(0);
  const [allManagers, setAllManagers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    const loadGlobalData = async () => {
      setLoading(true);
      try {
        const pendingRes = await adminApi.getPendingManagers('WAITING');
        setPendingManagerCount(pendingRes.data?.length || 0);

        const memberRes = await adminApi.getAllMembers(0); 
        const allMembers = memberRes.data?.content || [];
        setMembers(allMembers);
        setAllManagers(allMembers.filter((m: any) => m.role.includes('MANAGER')));
      } catch (error) {
        console.error('공통 데이터 로드 실패', error);
      } finally {
        setLoading(false);
      }
    };
    loadGlobalData();
  }, []);

  const handleOpenDetail = async (id: number) => {
    setSelectedRequest(null); 
    setIsDetailModalOpen(true);
    try {
      const res = await reservationApi.getDetail(String(id));
      setSelectedRequest(res.data);
    } catch (error) {
      setIsDetailModalOpen(false);
      YesAlert.fire({ icon: 'error', title: '오류', html: '상세 정보를 불러올 수 없습니다.' });
    }
  };

  const handleAssignManager = async (reservationId: number) => {
    if (allManagers.length === 0) {
      YesAlert.fire({ icon: 'warning', title: '알림', html: '배정 가능한 매니저가 없습니다.' });
      return false;
    }
    let confirmedEmail = ''; 

    const result = await MySwal.fire({
      title: '매니저 배정',
      html: <ManagerListModalContent managers={allManagers} onSelect={(email) => { confirmedEmail = email; }} />,
      showCancelButton: true,
      confirmButtonText: '배정하기',
      cancelButtonText: '취소',
      buttonsStyling: false,
      customClass: { 
        popup: '!bg-white !rounded-[16px] sm:!rounded-[24px] !shadow-2xl !shadow-slate-200/80 !border !border-slate-100 !p-3 !sm:p-6 !max-w-2xl !w-[92%] sm:!w-full',
        title: '!text-3xl !font-extrabold !text-slate-800 !mt-3 sm:!mt-1 !mb-0',
        htmlContainer: '!mx-0 !mt-0 !mb-0 !px-0',
        actions: '!flex !gap-2 sm:!gap-3 !w-full !mt-4 !px-1 !pb-1',
        confirmButton: '!flex-1 !bg-blue-600 !text-white !rounded-2xl !py-3 !sm:py-3.5 !px-4 !text-sm !font-bold !hover:bg-blue-700 !transition-all !shadow-md !shadow-blue-500/25 !whitespace-nowrap',
        cancelButton: '!flex-1 !bg-slate-100 !text-slate-600 !rounded-2xl !py-3 sm:!py-3.5 !px-4 !text-sm !font-bold !hover:bg-slate-200 !transition-all !whitespace-nowrap'
      },
      preConfirm: () => {
        if (!confirmedEmail) {
          WideSwal.showValidationMessage('매니저를 선택해주세요.');
          return false;
        }
        return confirmedEmail;
      }
    });

    if (result.isConfirmed && confirmedEmail) {
      try {
        await adminApi.assignManager(reservationId, confirmedEmail); 
        Toast.fire({ icon: 'success', title: '배정 완료' });
        return true;
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '배정 실패', html: '오류가 발생했습니다.' });
        return false;
      }
    }
    return false;
  };

  const handleCancelAssign = async (reservationId: number) => {
    const result = await YesAlert.fire({ title: '배정 취소', html: '배정을 취소하시겠습니까?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        await adminApi.cancelAssignManager(reservationId);
        Toast.fire({ icon: 'success', title: '취소 완료' });
        return true;
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '실패', html: '오류가 발생했습니다.' });
        return false;
      }
    }
    return false;
  };

  const handleViewMemberProfile = (member: any) => {
    const isAdmin = member.role.includes('ADMIN');
    const isManager = member.role.includes('MANAGER');
    
    MySwal.fire({
      title: '',
      html: (
        <div className="text-left w-full">
          {/* 1. 상단 프로필 헤더 영역 */}
          <div className="bg-slate-900 px-6 pt-10 pb-12 flex flex-col items-center justify-center text-center">
            {/* 이니셜 아바타 */}
            <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center text-2xl font-black mb-3 border border-white/20 shadow-inner">
              {member.name.substring(0, 1)}
            </div>
            {/* 권한 뱃지 */}
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold mb-1.5 border ${
              isAdmin ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' :
              isManager ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' :
              'bg-slate-500/30 text-slate-300 border-slate-500/30'
            }`}>
              {isAdmin ? '최고 관리자' : isManager ? '동행 매니저' : '일반 고객'}
            </span>
            <h3 className="text-white text-xl font-extrabold">{member.name}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{member.email}</p>
          </div>

          {/* 2. 하단 상세 정보 영역 */}
          <div className="bg-white p-5 -mt-6 rounded-t-[24px] relative z-10 flex flex-col gap-3">
            
            {/* 연락처 */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Phone className="w-4 h-4"/></div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold mb-0.5">연락처</p>
                <p className="text-sm font-bold text-slate-800">{member.phoneNumber || member.phone || '정보 없음'}</p>
              </div>
            </div>

            {/* 보호자 정보 (존재할 때만 표시) */}
            {(member.guardianName || member.guardianPhone) && (
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><ShieldCheck className="w-4 h-4"/></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold mb-0.5">보호자 (비상연락처)</p>
                  <p className="text-sm font-bold text-slate-800">
                    {member.guardianName || '-'} <span className="text-xs text-slate-500 font-medium ml-1">({member.guardianPhone || '-'})</span>
                  </p>
                </div>
              </div>
            )}

            {/* 자택 주소지 */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0 mt-0.5"><Home className="w-4 h-4"/></div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold mb-1">등록된 주소지</p>
                {member.zipCode && <span className="inline-block px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 text-[9px] font-bold rounded mb-1">우편번호 {member.zipCode}</span>}
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {member.address || '주소 정보가 없습니다.'} {member.detailAddress}
                </p>
              </div>
            </div>

          </div>
        </div>
      ),
      showConfirmButton: true,
      confirmButtonText: '확인 완료',
      buttonsStyling: false,
      customClass: { 
        popup: '!bg-[#F8FAFC] !rounded-[32px] !shadow-2xl !p-0 !max-w-md !w-[90%] !overflow-hidden',
        title: '!text-xl !font-extrabold !text-slate-800 !pt-6 !pb-2',
        htmlContainer: '!m-0 !p-0',
        actions: '!flex !flex-col !w-full !mt-0 !mb-2 !gap-0 !px-4',
        confirmButton: '!w-full !bg-slate-800 !text-white !rounded-2xl !py-4 !px-4 !text-sm !font-bold hover:!bg-slate-900 !transition-colors !shadow-md active:!scale-[0.98]'
      },
    });
  };

  const getPageTitle = () => {
    switch(activeTab) {
      case 'dashboard': return '예약 및 매칭 현황';
      case 'managers': return '매니저 승인 관리';
      case 'members': return '전체 회원 관리';
      case 'reviews': return '리뷰 및 리포트 모니터링';
      case 'notices': return '공지사항 관리';
      case 'inquiries': return '고객센터 관리';
      case 'popups': return '이벤트 팝업 관리';
      default: return '관리자 시스템';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-gray-900 flex flex-col md:flex-row relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} pendingManagerCount={pendingManagerCount} />

      <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              {getPageTitle()}
            </h1>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <ReservationTab 
                key="dashboard" 
                handleOpenDetail={handleOpenDetail} 
                members={members} 
                allManagers={allManagers} 
                handleAssignManager={handleAssignManager} 
                handleCancelAssign={handleCancelAssign} 
                handleViewMemberProfile={handleViewMemberProfile} 
              />
            )}
            {activeTab === 'managers' && <ManagerTab key="managers" />}
            {activeTab === 'members' && <MemberTab key="members" handleViewMemberProfile={handleViewMemberProfile} />}
            {activeTab === 'reviews' && (
              <ReviewTab 
                key="reviews" 
                handleOpenDetail={handleOpenDetail} 
                handleViewMemberProfile={(name) => {
                  const manager = members.find(m => m.name === name);
                  if (manager) handleViewMemberProfile(manager);
                  else YesAlert.fire({ icon: 'warning', title: '알림', html: '정보를 찾을 수 없습니다.' });
                }} 
              />
            )}
            {activeTab === 'notices' && <NoticeTab key="notices" />}
            {activeTab === 'inquiries' && <InquiryTab key="inquiries" />}
            {activeTab === 'popups' && <PopupTab key="popups" />}
          </AnimatePresence>
        </div>
      </main>

      <DetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} selectedRequest={selectedRequest} />
    </div>
  );
}