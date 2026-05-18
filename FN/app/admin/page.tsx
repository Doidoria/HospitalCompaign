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

    // 매니저 배정 버튼
    const result = await MySwal.fire({
      title: '매니저 배정',
      html: <ManagerListModalContent managers={allManagers} onSelect={(email) => { confirmedEmail = email; }} />,
      width: '42em',
      showCancelButton: true,
      confirmButtonText: '배정하기',
      cancelButtonText: '취소',
      customClass: { 
        popup: 'bg-white rounded-[28px] shadow-2xl p-6 !max-w-4xl w-full' 
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
    MySwal.fire({
      title: '회원 상세 정보',
      html: (
        <div className="text-left space-y-3 px-1 mt-0">
          {/* 1. 기본 정보 */}
          <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
            <h4 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100"><User className="w-4 h-4 text-slate-600"/></div>
              기본 정보
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <span className="font-bold text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> 이름</span>
                <span className="font-extrabold text-slate-800">{member.name}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <span className="font-bold text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> 이메일</span>
                <span className="font-medium text-slate-600">{member.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> 연락처</span>
                <span className="font-extrabold text-blue-600">{member.phoneNumber || member.phone || '정보 없음'}</span>
              </div>
            </div>
          </div>
          {/* 2. 보호자 정보 */}
          <div className="bg-white p-5 rounded-[20px] border border-blue-50 shadow-[0_2px_10px_rgb(59,130,246,0.04)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400"></div>
            <h4 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg"><ShieldCheck className="w-4 h-4 text-blue-600"/></div>
              보호자 정보
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <span className="font-bold text-slate-400">보호자 성함</span>
                <span className="font-bold text-slate-700">{member.guardianName || '정보 없음'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400">보호자 연락처</span>
                <span className="font-bold text-slate-700">{member.guardianPhone || '정보 없음'}</span>
              </div>
            </div>
          </div>
          {/* 3. 자택 주소지 */}
          <div className="bg-white p-5 rounded-[20px] border border-emerald-50 shadow-[0_2px_10px_rgb(16,185,129,0.04)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400"></div>
            <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg"><Home className="w-4 h-4 text-emerald-600"/></div>
              자택 주소지
            </h4>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm">
              {member.zipCode && <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-extrabold rounded-md mb-2 border border-emerald-100">우편번호 {member.zipCode}</span>}
              <p className="text-slate-700 font-bold leading-relaxed break-words">
                {member.address || '등록된 주소 정보가 없습니다.'} 
                {member.detailAddress ? ` ${member.detailAddress}` : ''}
              </p>
            </div>
          </div>
        </div>
      ),
      confirmButtonText: '확인 완료',
      buttonsStyling: false,
      customClass: { 
        popup: 'bg-[#F8FAFC] rounded-[32px] shadow-2xl border border-slate-100 p-4 !max-w-md w-full',
        title: 'text-xl font-extrabold text-slate-800 pt-2 pb-0',
        confirmButton: 'w-full bg-slate-800 text-white rounded-2xl py-4 px-4 text-sm font-bold hover:bg-slate-900 transition-colors shadow-md active:scale-[0.98]'
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