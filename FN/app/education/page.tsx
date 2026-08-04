// app/education/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, ChevronLeft, ChevronRight, GraduationCap, ShieldCheck, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EducationLandingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // 쌤플 교육 사진 슬라이드 데이터 (대표님의 실제 이미지 에셋 경로로 교체해 쓰시면 됩니다)
  const slideImages = [
    { url: '/images/education/edu-slide-01.jpg', title: '계명문화대학교 강의 현장' },
    { url: '/images/education/edu-slide-02.jpg', title: '전문적이고 체계적인 이론 교육 현장' },
    { url: '/images/education/edu-slide-03.jpg', title: '노사발전재단 교육 현장' },
    { url: '/images/education/edu-slide-04.jpg', title: '칠곡군 교육 강의 현장' },
    { url: '/images/education/edu-slide-05.jpg', title: '남구노인대학 강의 현장' },
    { url: '/images/education/edu-slide-06.jpg', title: '상주 교육 강의 현장' },
  ];

  // 5초마다 슬라이드 자동 재생 (오토 슬라이드)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slideImages.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slideImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slideImages.length) % slideImages.length);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      
      {/* 상단 히어로 배너 */}
      <section className="bg-gradient-to-b from-blue-950 to-slate-900 text-white py-16 md:py-24 px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full font-bold text-xs border border-emerald-500/30 tracking-wide mx-auto">
            <GraduationCap className="w-4 h-4" /> 최고 수준의 동행 매니저 양성
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight break-keep">
            예스케어 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">교육원</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto break-keep leading-relaxed">
            단순한 이동 보조를 넘어, 환자의 심리적 안정과 전문 의료 행정 조력까지 수행하는 대한민국 1% 병원동행 전문가를 양성합니다.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 ml-1">
            ● 예스케어 생생한 교육 현장
          </h3>
          {/* 슬라이드 UI */}
          <div className="relative h-[300px] md:h-[480px] w-full rounded-[32px] overflow-hidden shadow-2xl border border-gray-200 bg-slate-900 group">
            <AnimatePresence initial={false}>
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0 w-full h-full flex items-end"
                style={{ backgroundImage: `url(${slideImages[currentSlide].url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="relative z-20 p-8 md:p-12 w-full"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-emerald-500/80 text-white backdrop-blur-md rounded-full text-[11px] font-extrabold shadow-sm">
                      교육 강의 {currentSlide + 1} / {slideImages.length}
                    </span>
                  </div>
                  <h3 className="text-white text-2xl md:text-3xl font-extrabold drop-shadow-lg break-keep">
                    {slideImages[currentSlide].title}
                  </h3>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* 글래스모피즘(반투명) 좌우 컨트롤 버튼 */}
            <button onClick={prevSlide} className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 text-white backdrop-blur-xl hover:bg-white/30 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextSlide} className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 text-white backdrop-blur-xl hover:bg-white/30 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20">
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* 상단 넷플릭스 스타일 자동 진행 프로그레스 바 */}
            <div className="absolute top-6 left-6 right-6 z-30 flex gap-2">
              {slideImages.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden backdrop-blur-sm">
                  {idx === currentSlide && (
                    <motion.div 
                      key={currentSlide}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                    />
                  )}
                  {idx < currentSlide && <div className="h-full w-full bg-emerald-400" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 📚 교육 과정 핵심 강점 및 특전 고지 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2"><Award className="w-5 h-5" /></div>
            <h4 className="font-extrabold text-slate-800 text-base">공식 인증 자격증 발급</h4>
            <p className="text-gray-500 text-xs leading-relaxed break-keep">한국직업능률개발원의 정식 자격증이 발급되어 전문 스펙으로 활용 가능합니다.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-2"><ShieldCheck className="w-5 h-5" /></div>
            <h4 className="font-extrabold text-slate-800 text-base">활동 자격 즉시 부여</h4>
            <p className="text-gray-500 text-xs leading-relaxed break-keep">90% 이상 이수 및 테스트 통과 시 예스케어 프리랜서 매니저 매칭 풀에 즉시 우대 등록됩니다.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-2"><Star className="w-5 h-5" /></div>
            <h4 className="font-extrabold text-slate-800 text-base">체계적인 사후 피드백</h4>
            <p className="text-gray-500 text-xs leading-relaxed break-keep">수료 후에도 실제 동행 현장에서 발생하는 다양한 사례에 대한 보수 교육을 상시 제공합니다.</p>
          </div>
        </section>

        {/* 📋 간단 커리큘럼 요약표 */}
        <section className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-gray-50 pb-3">운영 과정 가이드</h3>
          <div className="space-y-4 text-sm font-medium">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-800 block">1. 병원동행 매니저 자격증반</span>
                <span className="text-xs text-gray-500 block mt-0.5">기초 의료 행정 이론, 노인 장기요양 보험 제도의 이해, 매니저 기본 직무 소양 교육</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-800 block">2. 예스케어 전문 심화반</span>
                <span className="text-xs text-gray-500 block mt-0.5">상황별 응급 처치 가이드(CPR), 휠체어/이동 보조 실습, 진료 동석 리포트 작성 기법</span>
              </div>
            </div>
          </div>
        </section>

        {/* 실제 신청 페이지인 /education-apply 로 넘겨주는 최종 CTA 버튼 영역 */}
        <section className="pt-4">
          <Link href="/education/apply">
            <button className="group w-full bg-blue-950 text-white text-xl font-bold py-5 md:py-6 rounded-[24px] shadow-xl hover:bg-blue-900 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
              <span>수강 내역 입력 및 교육 신청하기</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            * 원활한 마감을 위해 기수별 선착순 모집으로 진행됩니다.<br/>
            기본적인 성함, 연락처 등은 로그인된 예스케어 계정의 정보로 자동 안전 접수됩니다.
          </p>
        </section>

      </main>
    </div>
  );
}