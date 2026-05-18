// src/components/admin/tabs/MemberTab.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, UserCog, CheckCircle2, XCircle, Search, Loader2, FileText } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { adminApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import EmptyState from '../ui/EmptyState';

const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
const tabVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function MemberTab({ handleViewMemberProfile }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('');
  const [memberPage, setMemberPage] = useState(0);
  const [memberTotalPages, setMemberTotalPages] = useState(0);

  const fetchMembers = useCallback(async (page: number, role: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getAllMembers(page, role);
      setMembers(res.data?.content || []); 
      setMemberTotalPages(res.data?.totalPages || 0);
    } catch (error) {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMembers(memberPage, memberRoleFilter);
  }, [memberPage, memberRoleFilter, fetchMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      (m.name || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
      (m.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
    );
  }, [members, memberSearchTerm]);

  const handleChangeRole = async (memberId: number, newRole: string) => {
    const result = await YesAlert.fire({
      title: '권한 변경',
      html: '해당 회원의 권한을 정말 변경하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '변경하기',
      cancelButtonText: '취소'
    });

    if (result.isConfirmed) {
      try {
        await adminApi.changeMemberRole(memberId, newRole);
        Toast.fire({ icon: 'success', title: '권한이 변경되었습니다.' });
        fetchMembers(memberPage, memberRoleFilter);
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '오류', html: '권한 변경에 실패했습니다.' });
      }
    }
  };

  const handleToggleStatus = async (member: any) => {
    const currentActive = member.active ?? member.isActive ?? true; 
    const targetActivate = !currentActive;

    const result = await YesAlert.fire({ 
      title: currentActive ? '계정 정지' : '정지 해제', 
      html: `${member.name} 회원을 처리하시겠습니까?`, icon: 'warning', 
      showCancelButton: true, confirmButtonText: '확인' 
    });
    
    if (result.isConfirmed) {
      await adminApi.updateMemberStatus(member.id, targetActivate);
      Toast.fire({ icon: 'success', title: '성공적으로 처리되었습니다.' });
      fetchMembers(memberPage, memberRoleFilter);
    }
  };

  return (
    <>
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={containerVariants} initial="hidden" animate="visible">
        {[
          { title: '전체 회원', value: `${members.length}명`, icon: <Users className="w-6 h-6 text-purple-500" /> },
          { title: '일반 고객', value: `${members.filter(m => m.role.includes('USER')).length}명`, icon: <UserCog className="w-6 h-6 text-slate-500" /> },
          { title: '매니저', value: `${members.filter(m => m.role.includes('MANAGER')).length}명`, icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
          { title: '정지 계정', value: `${members.filter(m => m.active === false).length}명`, icon: <XCircle className="w-6 h-6 text-red-500" /> },
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
      
      <motion.div variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col mt-6">
        <div className="p-5 border-b border-slate-100 bg-purple-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-purple-600" /> 전체 회원 목록
          </h2>
          <div className="flex items-center w-full sm:w-auto gap-2">
            <select value={memberRoleFilter} onChange={(e) => {setMemberRoleFilter(e.target.value); setMemberPage(0);}} className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer">
              <option value="">전체 권한</option><option value="USER">일반 고객</option><option value="MANAGER">매니저</option><option value="ADMIN">관리자</option>
            </select>
            <div className="relative w-full sm:w-64">
              <input type="text" placeholder="이름/이메일 검색..." value={memberSearchTerm} onChange={(e) => setMemberSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm placeholder:text-slate-400" />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold pl-6">회원 ID</th>
                <th className="p-4 font-bold">이메일</th>
                <th className="p-4 font-bold">이름</th>
                <th className="p-4 font-bold">권한</th>
                <th className="p-4 font-bold text-center pr-6">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {loading ? (
                <tr><td colSpan={5} className="p-16 text-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" /></td></tr>
              ) : filteredMembers.length > 0 ? filteredMembers.map((member) => {
                const isAccountActive = member.active ?? member.isActive ?? true;
                return (
                  <tr key={member.id} className={`border-b border-slate-100 ${!isAccountActive ? 'bg-red-50/50' : 'hover:bg-slate-50/50 transition-colors'}`}>
                    <td className="p-4 pl-6 text-slate-400 font-medium">#{member.id}</td>
                    <td className="p-4 text-slate-600">{member.email}</td>
                    <td className="p-4 text-slate-800 font-bold">{member.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${member.role.includes('ADMIN') ? 'bg-purple-50 text-purple-700 border-purple-200' : member.role.includes('MANAGER') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {member.role.includes('ADMIN') ? '관리자' : member.role.includes('MANAGER') ? '매니저' : '일반 고객'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <div className="flex justify-center gap-2 items-center">
                        <button onClick={() => handleViewMemberProfile(member)} className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all font-bold shadow-sm flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> 프로필
                        </button>
                        
                        {member.role.includes('ADMIN') ? (
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60">관리 불가</span>
                        ) : (
                          <>
                            <select
                              value={member.role.includes('MANAGER') ? 'MANAGER' : 'USER'}
                              onChange={(e) => handleChangeRole(member.id, e.target.value)}
                              className="bg-white border border-slate-200 text-xs font-bold text-slate-600 py-1.5 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                              <option value="USER">일반 고객</option>
                              <option value="MANAGER">매니저</option>
                              <option value="ADMIN">관리자</option>
                            </select>

                            <button onClick={() => handleToggleStatus(member)} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm ${isAccountActive ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'}`}>
                              {isAccountActive ? '계정 정지' : '정지 해제'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <EmptyState message="검색 결과가 없습니다." colSpan={5} />
              )}
            </tbody>
          </table>
        </div>

        {/* 2. 모바일 뷰: 카드형 리스트 */}
        <div className="md:hidden flex flex-col gap-3 p-4 flex-1 overflow-y-auto bg-slate-50/50">
          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" /></div>
          ) : filteredMembers.length > 0 ? filteredMembers.map((member) => {
            const isAccountActive = member.active ?? member.isActive ?? true;
            return (
              <div key={member.id} className={`p-4 rounded-xl border shadow-sm flex flex-col gap-3 ${!isAccountActive ? 'bg-red-50/30 border-red-100' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-slate-400 font-bold text-xs mr-1">#{member.id}</span>
                    <span className="font-extrabold text-slate-800 text-sm">{member.name}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${member.role.includes('ADMIN') ? 'bg-purple-50 text-purple-700 border-purple-200' : member.role.includes('MANAGER') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {member.role.includes('ADMIN') ? '관리자' : member.role.includes('MANAGER') ? '매니저' : '일반 고객'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => handleViewMemberProfile(member)} className="flex-[0.5] py-2 text-xs text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 font-bold shadow-sm flex justify-center items-center gap-1">
                    <FileText className="w-3 h-3" /> 프로필
                  </button>
                  
                  {member.role.includes('ADMIN') ? (
                    <span className="flex-1 text-center py-2 text-xs font-bold text-slate-400 bg-slate-50 rounded-lg border border-slate-200">관리 불가</span>
                  ) : (
                    <>
                      <select value={member.role.includes('MANAGER') ? 'MANAGER' : 'USER'} onChange={(e) => handleChangeRole(member.id, e.target.value)} className="flex-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 py-2 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm">
                        <option value="USER">일반 고객</option>
                        <option value="MANAGER">매니저</option>
                        <option value="ADMIN">관리자</option>
                      </select>
                      <button onClick={() => handleToggleStatus(member)} className={`flex-1 py-2 text-xs rounded-lg font-bold shadow-sm ${isAccountActive ? 'bg-white border border-red-200 text-red-600' : 'bg-emerald-600 text-white'}`}>
                        {isAccountActive ? '계정 정지' : '정지 해제'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }) : (
            <EmptyState message="검색 결과가 없습니다." />
          )}
        </div>
        
        {memberTotalPages > 0 && (
          <div className="flex justify-center items-center gap-1.5 p-5 border-t border-slate-100 bg-white">
            <button disabled={memberPage === 0} onClick={() => setMemberPage(prev => prev - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">이전</button>
            {[...Array(memberTotalPages)].map((_, i) => (
              <button key={i} onClick={() => setMemberPage(i)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${memberPage === i ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{i + 1}</button>
            ))}
            <button disabled={memberPage >= memberTotalPages - 1} onClick={() => setMemberPage(prev => prev + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors">다음</button>
          </div>
        )}
      </motion.div>
    </>
  );
}