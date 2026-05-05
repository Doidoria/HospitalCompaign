'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, Award, Briefcase, Star, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { managerApi, authApi } from '@/src/api/index';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

export default function ManagerProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState("");
  
  const [profileForm, setProfileForm] = useState({
    introduction: '',
    career: '',
    certifications: ''
  });

  // 1. 기존 정보 불러오기
  useEffect(() => {
    let isMounted = true;
    const fetchMyProfile = async () => {
      try {
        const meRes = await authApi.getMe();
        if (!isMounted) return;
        setUserName(meRes.data.name);

        const profileRes = await managerApi.getManagerProfile(meRes.data.id);
        if (isMounted && profileRes.data) {
          setProfileForm({
            introduction: profileRes.data.introduction || '',
            career: profileRes.data.career || '',
            certifications: profileRes.data.certifications || ''
          });
        }
      } catch (error) {
        console.error('프로필 로딩 에러:', error);
        Toast.fire({ icon: 'error', title: '정보를 불러오지 못했습니다.' });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMyProfile();
    return () => { isMounted = false; };
  }, []);

  // 2. 입력 핸들러 최적화
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // 3. 저장 로직
  const handleSave = async () => {
    if (!profileForm.introduction.trim()) {
      Toast.fire({ icon: 'warning', title: '한 줄 소개는 필수입니다.' });
      return;
    }

    setIsSaving(true);
    try {
      await managerApi.updateManagerProfile(profileForm);
      Toast.fire({ icon: 'success', title: '프로필이 업데이트되었습니다.' });
      router.push('/manager/dashboard');
    } catch (error) {
      Toast.fire({ icon: 'error', title: '저장에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 프로필 완성도 계산
  const completeness = useMemo(() => {
    let score = 0;
    if (profileForm.introduction.length >= 10) score += 40;
    if (profileForm.career.trim()) score += 30;
    if (profileForm.certifications.trim()) score += 30;
    return score;
  }, [profileForm]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-2xl px-4 animate-pulse space-y-4">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-[400px] bg-white rounded-[28px] border border-slate-100" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      <header className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-slate-200/50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">프로필 편집</h1>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-600">완성도 {completeness}%</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 수정 폼 */}
        <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 프로필 정보 입력
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> 한 줄 소개 (인사말) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="introduction"
                  value={profileForm.introduction}
                  onChange={handleChange}
                  placeholder="환자분들이 매니저님을 처음 만나는 인사말이에요."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none h-28"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> 경력 및 경험
                </label>
                <textarea
                  name="career"
                  value={profileForm.career}
                  onChange={handleChange}
                  placeholder="관련 업무 경험을 적어주시면 신뢰도가 높아져요."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none h-32"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Award className="w-4 h-4 text-indigo-500" /> 보유 자격증
                </label>
                <input
                  type="text"
                  name="certifications"
                  value={profileForm.certifications}
                  onChange={handleChange}
                  placeholder="자격증을 쉼표(,)로 구분해서 입력해주세요."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-slate-900 text-white font-bold py-4.5 rounded-[20px] shadow-xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <span className="animate-pulse">저장 중...</span> : <><Save className="w-5 h-5" /> 프로필 저장하기</>}
          </button>
        </motion.section>

        {/* 오른쪽: 실시간 미리보기 (Live Preview) */}
        <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block sticky top-8 h-fit">
          <h2 className="text-sm font-bold text-slate-400 mb-4 ml-2 flex items-center gap-2">
            <Eye className="w-4 h-4" /> 고객에게 보여질 모습
          </h2>
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />
            
            <div className="flex items-center gap-5 mb-8 relative">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-100">
                {userName ? userName[0] : '?'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-extrabold text-slate-900">{userName || "매니저 성함"}</h3>
                  <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-md">인증됨</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                  <Star className="w-4 h-4 fill-current" /> 5.0 <span className="text-slate-300 font-medium ml-1">(리뷰 0개)</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 relative">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                "{profileForm.introduction || "작성된 인사말이 없습니다."}"
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-2">보유 자격증</h4>
                <div className="flex flex-wrap gap-2">
                  {profileForm.certifications ? profileForm.certifications.split(',').map((cert, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                      {cert.trim()}
                    </span>
                  )) : <span className="text-slate-300 text-xs">등록된 자격증이 없습니다.</span>}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">주요 경력</h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {profileForm.career || "매니저님의 멋진 경력을 소개해 주세요."}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2 items-center px-4">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <p className="text-[11px] text-slate-400">실제 앱에서는 리뷰와 상세 평점이 자동으로 추가됩니다.</p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}