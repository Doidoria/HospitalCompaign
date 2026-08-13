// app/components/admin/tabs/EducationTab.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { adminApi } from '@/src/api/index';
import { BookOpen, CheckCircle2, XCircle, Clock, Loader2, User, Phone, Search, GraduationCap, Mail } from 'lucide-react';
import { Toast, YesAlert } from '@/src/utils/alert';
import dayjs from 'dayjs';
import EmptyState from '../ui/EmptyState';
// import { adminApi } from '@/src/api'; // 실제 API 연동 시 주석 해제

// 프론트엔드용 DTO 인터페이스
interface EducationApp {
  id: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  courseType: string;
  status: 'WAITING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
}

const tabVariants: Variants = { 
  hidden: { opacity: 0, y: 15 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } 
};

export default function EducationTab() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<EducationApp[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 데이터 로딩 (임시 더미 데이터 세팅 - 백엔드 API 연결 시 교체)
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEducations(); 
      setApplications(res.data.data || res.data); 
    } catch (error) {
      console.error('교육 신청 목록 로딩 실패:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // 승인/거절 처리 핸들러
  const handleUpdateStatus = async (id: number, currentName: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const isApprove = newStatus === 'APPROVED';
    if (!isApprove) {
      const { isConfirmed, value: reasonText } = await YesAlert.fire({
        title: '교육 신청 거절',
        html: `<strong>[${currentName}]</strong>님의 교육 신청을 거절하시겠습니까?<br/>반려 사유를 입력해 주세요.`,
        icon: 'warning',
        input: 'textarea',
        inputPlaceholder: '예: 선착순 정원 초과로 인해 다음 기수로 자동 이월 예정입니다.',
        inputAttributes: { 'aria-label': '반려 사유 입력' },
        showCancelButton: true,
        confirmButtonText: '거절 처리',
        cancelButtonText: '취소',
        confirmButtonColor: '#E11D48',
        inputValidator: (value: string) => {
          if (!value) return '마이페이지에 노출될 반려 사유를 반드시 입력해야 합니다!';
        }
      });

      if (isConfirmed && reasonText) {
        try {
          await adminApi.updateEducationStatus(id, 'REJECTED', reasonText);
          setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'REJECTED' } : app));
          Toast.fire({ icon: 'success', title: '거절 처리 및 사유 등록이 완료되었습니다.' });
        } catch (error) {
          YesAlert.fire({ icon: 'error', title: '실패', text: '오류가 발생했습니다.' });
        }
      }
      return;
    }

    // 승인 로직
    const confirm = await YesAlert.fire({
      title: '예스케어 매니저 승인',
      html: `<strong>[${currentName}]</strong>님을 <strong>예스케어 매니저(PRO)</strong>로 승인하시겠습니까?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '승인하기',
      cancelButtonText: '취소',
      confirmButtonColor: '#059669',
    });

    if (confirm.isConfirmed) {
      try {
        await adminApi.updateEducationStatus(id, 'APPROVED');
        setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'APPROVED' } : app));
        Toast.fire({ icon: 'success', title: '예스케어 PRO 매니저로 정상 승인되었습니다.' });
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '실패', text: '오류가 발생했습니다.' });
      }
    }
  };

  // 필터링 적용
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchStatus = filterStatus === 'ALL' || app.status === filterStatus;
      const matchSearch = app.applicantName.includes(searchTerm) || app.applicantPhone.includes(searchTerm);
      return matchStatus && matchSearch;
    });
  }, [applications, filterStatus, searchTerm]);

  // 상태 배지 렌더링 헬퍼
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold"><Clock className="w-3 h-3" /> 대기중</span>;
      case 'APPROVED': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> 승인완료</span>;
      case 'REJECTED': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 text-xs font-bold"><XCircle className="w-3 h-3" /> 거절됨</span>;
      default: return null;
    }
  };

  return (
    <motion.div variants={tabVariants} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col min-h-[600px]">
      
      {/* 1. 상단 헤더 및 통계/필터 영역 */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> 교육 신청 관리
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">예스케어 교육 과정 신청 내역을 확인하고 승인/거절을 관리합니다.</p>
          </div>
          <div className="flex gap-3 text-sm font-bold">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <span className="text-slate-400 text-[10px]">전체 신청</span>
              <span className="text-slate-800">{applications.length}건</span>
            </div>
            <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 shadow-sm flex flex-col items-center">
              <span className="text-amber-600 text-[10px]">대기 중</span>
              <span className="text-amber-700">{applications.filter(a => a.status === 'WAITING').length}건</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {['ALL', 'WAITING', 'APPROVED', 'REJECTED'].map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === status ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {status === 'ALL' ? '전체' : status === 'WAITING' ? '대기' : status === 'APPROVED' ? '승인' : '거절'}
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-xs ml-auto">
            <input type="text" placeholder="이름 또는 연락처 검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 shadow-sm outline-none" />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 2. 데이터 리스트 영역 */}
      <div className="flex-1 bg-slate-50/30">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
        ) : filteredApps.length === 0 ? (
          <div className="py-20"><EmptyState message="해당하는 교육 신청 내역이 없습니다." isTable={false} /></div>
        ) : (
          <>
            {/* PC 뷰 (테이블) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/50 text-slate-500 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4 pl-6 font-bold">신청일 / 상태</th>
                    <th className="p-4 font-bold">신청자 정보</th>
                    <th className="p-4 font-bold">신청 과정</th>
                    <th className="p-4 pr-6 font-bold text-right">관리 (승인/거절)</th>
                  </tr>
                </thead>
                <tbody className="text-sm bg-white">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-xs text-slate-400 font-medium">{dayjs(app.appliedAt).format('YYYY.MM.DD HH:mm')}</span>
                          {renderStatusBadge(app.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400"/> {app.applicantName}</span>
                          <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5"><Mail className="w-3 h-3"/> {app.applicantEmail}</span> {/* 이메일 추가 */}
                          <span className="text-slate-500 text-xs flex items-center gap-1.5"><Phone className="w-3 h-3"/> {app.applicantPhone}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
                          <GraduationCap className="w-4 h-4"/> {app.courseType}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {app.status === 'WAITING' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleUpdateStatus(app.id, app.applicantName, 'APPROVED')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
                              승인
                            </button>
                            <button onClick={() => handleUpdateStatus(app.id, app.applicantName, 'REJECTED')} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors shadow-sm">
                              거절
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">처리완료</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 뷰 (카드 리스트) */}
            <div className="lg:hidden p-4 space-y-3">
              {filteredApps.map((app) => (
                <div key={app.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                    {renderStatusBadge(app.status)}
                    <span className="text-[11px] text-slate-400 font-medium">{dayjs(app.appliedAt).format('YY.MM.DD HH:mm')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-slate-800 text-base">{app.applicantName}</p>
                      <p className="text-slate-400 text-xs font-semibold">{app.applicantEmail}</p> {/* 이메일 추가 */}
                      <p className="text-slate-500 text-xs mt-0.5">{app.applicantPhone}</p>
                    </div>
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                      {app.courseType}
                    </span>
                  </div>

                  {app.status === 'WAITING' && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-50">
                      <button onClick={() => handleUpdateStatus(app.id, app.applicantName, 'REJECTED')} className="py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold shadow-sm">거절하기</button>
                      <button onClick={() => handleUpdateStatus(app.id, app.applicantName, 'APPROVED')} className="py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-sm">승인하기</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}