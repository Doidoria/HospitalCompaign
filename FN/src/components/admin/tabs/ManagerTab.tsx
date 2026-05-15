// src/components/admin/tabs/ManagerTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Loader2, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { adminApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import EmptyState from '../ui/EmptyState'; // ✅ 누락된 EmptyState 추가

const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
const tabVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function ManagerTab() {
  const [pendingManagers, setPendingManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mgrAppStatus, setMgrAppStatus] = useState('WAITING');

  const fetchManagerApplications = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingManagers(status);
      setPendingManagers(res.data);
    } catch (error) { 
      Toast.fire({ icon: 'error', title: '지원서 목록을 불러오지 못했습니다.' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchManagerApplications(mgrAppStatus); }, [mgrAppStatus, fetchManagerApplications]);

  const handleApprove = async (memberId: number, name: string) => {
    const result = await YesAlert.fire({
      title: '매니저 승인', html: `${name} 님의 매니저 자격을 승인하시겠습니까?`, icon: 'question',
      showCancelButton: true, confirmButtonText: '승인',
    });
    if (result.isConfirmed) {
      await adminApi.approveManager(memberId);
      Toast.fire({ icon: 'success', title: `${name} 님이 승인되었습니다.` });
      fetchManagerApplications(mgrAppStatus);
    }
  };

  const handleReject = async (applicationId: number, name: string) => {
    const { value: reason } = await YesAlert.fire({
      title: '반려 사유 입력', input: 'textarea',
      showCancelButton: true, confirmButtonText: '반려 처리',
      inputValidator: (value) => !value ? '반려 사유를 입력해야 합니다!' : null
    });
    if (reason) {
      await adminApi.rejectManagerApp(applicationId, { rejectionReason: reason });
      Toast.fire({ icon: 'success', title: '지원이 반려되었습니다.' });
      fetchManagerApplications(mgrAppStatus);
    }
  };

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {[
          { title: '총 지원자', value: `${pendingManagers.length}명`, icon: <FileText className="w-6 h-6 text-slate-500" /> },
          { title: '요양보호사', value: `${pendingManagers.filter(m => m.licenseName === 'caregiver').length}명`, icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
          { title: '사회복지사', value: `${pendingManagers.filter(m => m.licenseName === 'socialworker').length}명`, icon: <CheckCircle2 className="w-6 h-6 text-blue-500" /> },
          { title: '자격 미지정', value: `${pendingManagers.filter(m => !m.licenseName || m.licenseName === 'none').length}명`, icon: <UserPlus className="w-6 h-6 text-orange-500" /> },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">{stat.icon}</div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">{stat.title}</p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mt-6">
        {/* ✅ 헤더 flex 속성 변경으로 필터 버튼 오른쪽 끝으로 배치 */}
        <div className="p-5 border-b border-slate-100 bg-emerald-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" /> 가입 승인 대기 목록
          </h2>
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
            {['WAITING', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setMgrAppStatus(s)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mgrAppStatus === s ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {s === 'WAITING' ? '신규 대기' : s === 'APPROVED' ? '승인 완료' : '반려 내역'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-4 font-bold pl-6">지원일자</th>
                <th className="p-4 font-bold">이름/연락처</th>
                <th className="p-4 font-bold">보유 자격증</th>
                <th className="p-4 font-bold text-center">근무 가능 시간</th>
                <th className="p-4 font-bold text-center">첨부파일</th>
                <th className="p-4 font-bold text-right pr-6">계정 승인</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading ? (
                <tr><td colSpan={6} className="p-16 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></td></tr>
              ) : pendingManagers.length > 0 ? pendingManagers.map((mgr) => (
                <tr key={mgr.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-slate-500 font-medium">{mgr.applyDate}</td>
                  <td className="p-4"><p className="font-bold text-slate-800">{mgr.name}</p><p className="text-xs text-slate-500 mt-0.5">{mgr.phone}</p></td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100">
                      {mgr.licenseName === 'caregiver' ? '요양보호사' : mgr.licenseName === 'socialworker' ? '사회복지사' : mgr.licenseName === 'none' ? '없음' : mgr.licenseName}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {/* ✅ 누락되었던 근무 가능 요일(availableDays) UI 복구 */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex gap-1 flex-wrap justify-center">
                        {mgr.availableDays?.split(',').map((day: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            {day.trim()}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">{mgr.availableTime}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {mgr.certificateUrl ? (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}${mgr.certificateUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm"><FileText className="w-3.5 h-3.5" /> 보기</a>
                    ) : <span className="text-slate-300 text-xs font-medium">없음</span>}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {mgrAppStatus === 'WAITING' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(mgr.memberId, mgr.name)} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"><CheckCircle2 className="w-4 h-4" /> 승인</button>
                        <button onClick={() => handleReject(mgr.id, mgr.name)} className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 shadow-sm"><XCircle className="w-4 h-4" /> 반려</button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                /* ✅ EmptyState 컴포넌트로 통일성 부여 */
                <EmptyState message="대기 중인 지원서가 없습니다." colSpan={6} />
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}