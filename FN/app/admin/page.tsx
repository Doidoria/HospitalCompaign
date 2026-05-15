// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { adminApi, reservationApi } from '@/src/api/index';
import { Toast, YesAlert, MySwal } from '@/src/utils/alert';

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
      width: '32em',
      showCancelButton: true,
      confirmButtonText: '배정하기',
      cancelButtonText: '취소',
      customClass: { popup: 'rounded-[28px] shadow-2xl p-2' }, 
      preConfirm: () => {
        if (!confirmedEmail) {
          MySwal.showValidationMessage('매니저를 선택해주세요.');
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
    MySwal.fire({
      title: '회원 상세 정보',
      html: (
        <div className="text-left space-y-4 p-2 text-sm mt-2">
          {/* 기본 정보 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="mb-2 flex items-center"><span className="font-bold text-slate-500 w-24 shrink-0">이름</span> <span className="font-bold text-slate-800">{member.name}</span></p>
            <p className="mb-2 flex items-center"><span className="font-bold text-slate-500 w-24 shrink-0">이메일</span> <span className="text-slate-700">{member.email}</span></p>
            <p className="flex items-center"><span className="font-bold text-slate-500 w-24 shrink-0">휴대폰 번호</span> <span className="text-blue-600 font-bold">{member.phoneNumber || member.phone || '정보 없음'}</span></p>
          </div>
          
          {/* 보호자 정보 */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-sm">
            <h4 className="font-extrabold text-blue-700 mb-2.5 border-b border-blue-100/80 pb-2">보호자 정보</h4>
            <p className="mb-1.5 flex items-center"><span className="font-semibold text-slate-500 w-24 shrink-0">보호자 성함</span> <span className="text-slate-700 font-medium">{member.guardianName || '정보 없음'}</span></p>
            <p className="flex items-center"><span className="font-semibold text-slate-500 w-24 shrink-0">보호자 연락처</span> <span className="text-slate-700 font-medium">{member.guardianPhone || '정보 없음'}</span></p>
          </div>

          {/* 자택 주소지 */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 shadow-sm">
            <h4 className="font-extrabold text-emerald-700 mb-2.5 border-b border-emerald-100/80 pb-2">자택 주소지</h4>
            <p className="text-slate-700 font-medium leading-relaxed">
              {member.zipCode ? <span className="text-emerald-600 font-bold mr-1">[{member.zipCode}]</span> : ''}
              {member.address || '등록된 주소 정보가 없습니다.'} 
              {member.detailAddress ? ` ${member.detailAddress}` : ''}
            </p>
          </div>
        </div>
      ),
      confirmButtonText: '닫기',
      confirmButtonColor: '#334155',
      customClass: { popup: 'rounded-[24px]' },
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

      <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
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