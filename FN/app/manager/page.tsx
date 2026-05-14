'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from "framer-motion";
import { BookOpen, ShieldCheck, HeartHandshake, CheckCircle2, GraduationCap, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/src/api/index';
import { apiClient } from '@/src/api/client';
import { Toast } from '@/src/utils/alert';
import Swal from 'sweetalert2';

export default function ManagerApplyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 제출 방지 상태

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.getMe()
        .then(res => {
          if (res.data.role === 'MANAGER' || res.data.role === 'ADMIN') {
            // [UX 개선] 불필요한 Alert 제거 후 즉시 리다이렉트
            router.replace('/manager/dashboard'); 
          }
        })
        .catch(() => {});
    }
  }, [router]);
  
  const [formData, setFormData] = useState({
    licenseName: 'none',
    experience: '',
    motivation: '',
    availableDays: [] as string[],
    availableTime: '종일 (09:00~22:00)'
  });

  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      const days = prev.availableDays;
      if (days.includes(day)) {
        return { ...prev, availableDays: days.filter(d => d !== day) };
      } else {
        return { ...prev, availableDays: [...days, day] };
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      Toast.fire({ icon: 'warning', title: '로그인 후 이용해주세요.' });
      router.push('/login');
      return;
    }

    if (formData.availableDays.length === 0) {
      Toast.fire({ icon: 'warning', title: '근무 가능 요일을 1개 이상 선택해주세요.' });
      return;
    }

    setIsSubmitting(true); // 로딩 시작 (중복 클릭 방지)

    try {
      const submitData = new FormData();
      submitData.append(
        "request",
        new Blob([JSON.stringify(formData)], { type: "application/json" })
      );

      if (certificateFile) {
        submitData.append("file", certificateFile);
      }

      await apiClient.post('/api/members/apply-manager', submitData);
      
      // 중요한 최종 완료 메시지만 모달 유지 (디자인 개선)
      await Swal.fire({
        icon: 'success', 
        title: '신청이 완료되었습니다', 
        text: '관리자 심사 후 매니저 권한이 부여됩니다.',
        confirmButtonColor: '#059669',
        confirmButtonText: '확인'
      });
      router.push('/mypage');

    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false); // 로딩 종료
    }
  };

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.15 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">

      {/* 1. 히어로 섹션 (빛 효과 제거 및 깔끔한 그라데이션으로 변경) */}
      <section className="bg-gradient-to-b from-blue-950 via-blue-900 to-gray-900 text-white py-16 md:py-20 px-6 text-center relative overflow-hidden">
        <motion.div 
          className="max-w-3xl mx-auto space-y-4 relative z-10"
          initial="hidden" animate="visible" variants={pageVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center justify-center bg-white/10 border border-white/20 p-4 rounded-2xl mb-4 backdrop-blur-md shadow-lg">
            <GraduationCap className="w-10 h-10 text-emerald-300" />
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
            예스케어와 함께할 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-blue-300">전문 동행 매니저</span>를 모십니다
          </motion.h2>
          <motion.p variants={itemVariants} className="text-blue-100/90 text-lg break-keep leading-relaxed pt-4">
            체계적인 전문 교육을 통해 단순한 이동 보조를 넘어,<br className="hidden md:block" /> 
            환자와 보호자에게 안심을 전하는 의료 소통 전문가로 성장하세요.
          </motion.p>
        </motion.div>
      </section>

      <motion.main 
        className="max-w-7xl mx-auto px-6 pt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16"
        initial="hidden" animate="visible" variants={pageVariants}
      >
        {/* 2. 좌측: 교육 커리큘럼 소개 (크기 비율 조정 lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">필수 교육 커리큘럼</h3>
            <div className="space-y-4">
              
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="bg-emerald-50 p-4 rounded-2xl h-fit text-emerald-600">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 mb-1.5">공감 중심 의사소통 기술</h4>
                  <p className="text-gray-500 text-sm leading-relaxed break-keep">나-메시지(I-Message) 전달법, 진료 내용의 정확한 기록 및 보호자 전달, 의료진과의 원활한 소통 방법 학습</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="bg-blue-50 p-4 rounded-2xl h-fit text-blue-600">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 mb-1.5">질환별 맞춤 케어</h4>
                  <p className="text-gray-500 text-sm leading-relaxed break-keep">뇌졸중 골든타임 대처법, 치매 환자의 인지 기능 지원 및 투석/암 환자 동행 시 주의사항 숙지</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="bg-orange-50 p-4 rounded-2xl h-fit text-orange-500">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 mb-1.5">안전 및 위기 관리</h4>
                  <p className="text-gray-500 text-sm leading-relaxed break-keep">HUHN 낙상 위험도 평가 도구를 활용한 사전 위험 인지 및 응급 상황 발생 시 대처 매뉴얼 훈련</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 3. 우측: 지원 폼 (크기 비율 조정 lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 h-fit">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">교육 수강 및 지원 신청</h3>
          <p className="text-gray-500 mb-8 text-sm break-keep">정보를 남겨주시면 교육 일정 및 채용 절차를 안내해 드립니다.</p>
          
          <form onSubmit={handleSubmit} className="space-y-7">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 자격증 선택 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">보유 자격증 <span className="text-gray-400 font-normal">(선택)</span></label>
                <select 
                  name="licenseName" onChange={handleChange} value={formData.licenseName}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50 hover:bg-white focus:bg-white transition-all text-gray-700"
                >
                  <option value="none">없음 (신규 교육 희망)</option>
                  <option value="caregiver">요양보호사</option>
                  <option value="socialworker">사회복지사</option>
                  <option value="nurse">간호사/간호조무사</option>
                  <option value="other">기타</option>
                </select>
              </div>
              
              {/* 파일 업로드 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">자격증명 사본 <span className="text-gray-400 font-normal">(PDF)</span></label>
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none bg-gray-50 hover:bg-white transition-all cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 text-sm text-gray-600"
                />
              </div>
            </div>

            {/* 근무 가능 요일 선택 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">근무 가능 요일 <span className="text-emerald-600">*</span></label>
              <div className="flex flex-wrap gap-2.5">
                {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`w-12 h-12 rounded-full text-sm font-bold transition-all duration-200 ${
                      formData.availableDays.includes(day)
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-105'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* 근무 가능 시간 선택 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">근무 가능 시간 <span className="text-emerald-600">*</span></label>
              <select 
                name="availableTime" 
                onChange={handleChange} 
                value={formData.availableTime}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50 hover:bg-white focus:bg-white transition-all text-gray-700"
              >
                <option value="오전 (09:00~13:00)">오전 (09:00~13:00)</option>
                <option value="오후 (14:00~22:00)">오후 (14:00~22:00)</option>
                <option value="종일 (09:00~22:00)">종일 (09:00~22:00)</option>
                <option value="시간 협의">시간 협의 가능</option>
              </select>
            </div>

            {/* 관련 경력 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">관련 경력 <span className="text-gray-400 font-normal">(선택)</span></label>
              <textarea 
                name="experience" rows={2} onChange={handleChange} value={formData.experience}
                placeholder="관련 업무 경험이 있다면 간략히 적어주세요."
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none bg-gray-50 hover:bg-white focus:bg-white transition-all text-gray-700 text-sm"
              ></textarea>
            </div>

            {/* 지원 동기 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">지원 동기 <span className="text-emerald-600">*</span></label>
              <textarea 
                name="motivation" rows={4} onChange={handleChange} value={formData.motivation}
                placeholder="예스케어 매니저에 지원하시는 이유를 적어주세요." required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none bg-gray-50 hover:bg-white focus:bg-white transition-all text-gray-700 text-sm"
              ></textarea>
            </div>

            {/* 제출 버튼 (로딩 상태 적용) */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full text-white text-lg font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6
                ${isSubmitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-emerald-500/30'}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>제출 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span>지원서 제출하기</span>
                </>
              )}
            </button>
          </form>
        </div>
      </motion.main>
    </div>
  );
}