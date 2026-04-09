'use client';

import React, { useState } from 'react';
import { motion, Variants } from "framer-motion";
import { BookOpen, ShieldCheck, HeartHandshake, ArrowLeft, CheckCircle2, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function ManagerApplyPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    hasLicense: 'none', // 요양보호사, 사회복지사 등 자격 여부
    motivation: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('매니저 지원 데이터:', formData);
    alert('매니저 교육 신청이 완료되었습니다. 개별 연락드리겠습니다.');
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
      
      {/* 상단 네비게이션바 */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 md:px-6 flex items-center justify-between">
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors">
              <ArrowLeft className="w-6 h-6 md:w-5 md:h-5 md:mr-2" />
              <span className="hidden md:inline font-medium">메인으로</span>
            </Link>
          </div>
          <h1 className="font-bold text-lg md:text-xl text-blue-950 whitespace-nowrap">매니저 교육 및 지원</h1>
          <div className="flex-1"></div> 
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="bg-blue-950 text-white py-16 px-6 text-center">
        <motion.div 
          className="max-w-3xl mx-auto space-y-4"
          initial="hidden" animate="visible" variants={pageVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center justify-center bg-blue-900/50 p-3 rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-extrabold leading-tight">
            예스케어와 함께할 <br />
            <span className="text-emerald-400">전문 동행 매니저</span>를 모십니다.
          </motion.h2>
          <motion.p variants={itemVariants} className="text-blue-200 text-lg break-keep leading-relaxed pt-4">
            체계적인 전문 교육을 통해 단순한 이동 보조를 넘어,<br className="hidden md:block" /> 
            환자와 보호자에게 안심을 전하는 의료 소통 전문가로 성장하세요.
          </motion.p>
        </motion.div>
      </section>

      <motion.main 
        className="max-w-6xl mx-auto px-6 pt-16 grid grid-cols-1 lg:grid-cols-2 gap-12"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        {/* 좌측: 교육 커리큘럼 소개 (PPT 내용 반영) */}
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">예스케어 매니저 필수 교육 과정</h3>
            <div className="space-y-5">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                <div className="bg-emerald-100 p-3 rounded-xl h-fit text-emerald-700">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-blue-950 mb-1">공감 중심 의사소통 기술</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">나-메시지(I-Message) 전달법, 진료 내용의 정확한 기록 및 보호자 전달, 의료진과의 원활한 소통 방법 학습</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                <div className="bg-blue-100 p-3 rounded-xl h-fit text-blue-700">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-blue-950 mb-1">질환별 맞춤 케어 (치매/뇌졸중 등)</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">뇌졸중 골든타임 대처법, 치매 환자의 인지 기능 지원 및 투석/암 환자 동행 시 주의사항 숙지</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                <div className="bg-orange-100 p-3 rounded-xl h-fit text-orange-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-blue-950 mb-1">안전 및 위기 관리 (HUHN 낙상 평가)</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">HUHN 낙상 위험도 평가 도구를 활용한 사전 위험 인지 및 응급 상황 발생 시 대처 매뉴얼 훈련</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 우측: 지원 폼 */}
        <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100 h-fit">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">교육 수강 및 지원 신청</h3>
          <p className="text-gray-500 mb-8 text-sm">정보를 남겨주시면 교육 일정 및 채용 절차를 안내해 드립니다.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
              <input 
                type="text" name="name" onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">연락처</label>
              <input 
                type="tel" name="phone" placeholder="010-0000-0000" onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">보유 자격증 (선택)</label>
              <select 
                name="hasLicense" onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all"
              >
                <option value="none">없음 (신규 교육 희망)</option>
                <option value="caregiver">요양보호사</option>
                <option value="socialworker">사회복지사</option>
                <option value="nurse">간호사/간호조무사</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">지원 동기 (선택)</label>
              <textarea 
                name="motivation" rows={3} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 text-white text-lg font-bold py-4 rounded-2xl shadow-md hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>지원서 제출하기</span>
            </button>
          </form>
        </div>
      </motion.main>
    </div>
  );
}