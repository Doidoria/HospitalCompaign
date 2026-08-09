// app/education/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, ChevronLeft, ChevronRight, GraduationCap, ShieldCheck, Star, 
  BookOpen, Users, Info } from 'lucide-react';
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
            <p className="text-gray-500 text-xs leading-relaxed break-keep">한국직업능력연구원에 등록된 민간 자격증이 발급되어 전문 스펙으로 활용 가능합니다.</p>
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

        {/* 상세 교육과정 및 수강 안내 */}
        <section className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>병원동행매니저 교육과정 안내</span>
            </h3>
            <p className="text-gray-500 text-xs mt-1">
              전문 동행 매니저로 성장하기 위한 체계적인 교육 프로그램 및 수강 정보를 안내해 드립니다.
            </p>
          </div>

          {/* 1. 교육 대상 & 수혜 혜택 (2단 카드) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 교육 대상 */}
            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100/80">
              <h4 className="font-extrabold text-blue-950 text-sm mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>교육 대상</span>
              </h4>
              <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  <span>요양보호사, 사회복지사, 간호사/간호조무사 자격 소지자</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  <span>병원동행 전문가로 활동 및 취업을 희망하는 일반인 누구나</span>
                </li>
              </ul>
            </div>

            {/* 수강 혜택 */}
            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100/80">
              <h4 className="font-extrabold text-emerald-950 text-sm mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>수강 및 수료 혜택</span>
              </h4>
              <ul className="space-y-2 text-xs text-gray-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                  <span>한국직업능력연구원 등록 민간자격증 발급 지원</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                  <span>예스케어 매니저 등록 및 우선 매칭 기회 제공</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 2. 주요 교육 과목 (4대 모듈) */}
          <div className="pt-2">
            <h4 className="font-bold text-slate-800 text-sm mb-3">주요 교육 과목</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-blue-600 block mb-1">모듈 01</span>
                <p className="font-bold text-slate-800 text-sm">병원동행 서비스 개요 및 직무 소양</p>
                <p className="text-xs text-gray-500 mt-1">매니저 역할, 윤리 강령, 서비스 기본 마인드</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-blue-600 block mb-1">모듈 02</span>
                <p className="font-bold text-slate-800 text-sm">의료 소통 및 커뮤니케이션</p>
                <p className="text-xs text-gray-500 mt-1">환자·보호자·의료진 간 원활한 공감 소통 기법</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-blue-600 block mb-1">모듈 03</span>
                <p className="font-bold text-slate-800 text-sm">질환별 케어 및 안전/응급 대처</p>
                <p className="text-xs text-gray-500 mt-1">낙상 위험 평가, 주요 질환 주의사항, CPR 응급처치</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-blue-600 block mb-1">모듈 04</span>
                <p className="font-bold text-slate-800 text-sm">병원 행정 동행 및 케어 리포트 실무</p>
                <p className="text-xs text-gray-500 mt-1">접수/수납/약국 동행, 케어 리포트 작성 가이드</p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-2xl p-5 border border-gray-200/80">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">소비자 알림사항</span>
            </div>
            <ul className="space-y-1.5 text-[13px] text-gray-500 leading-relaxed break-keep">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>상기 병원동행매니저 1급 자격은 자격기본법 규정에 따라 등록한 민간자격으로, 국가로부터 인정받은 공인자격이 아닙니다.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span> 민간자격 등록 및 공인 제도에 대한 상세내용은 민간자격 정보서비스(
                  <a href="https://www.pqi.or.kr" target="_blank" rel="noopener noreferrer" 
                    className="text-blue-600 underline hover:text-blue-800 transition-colors"
                  >www.pqi.or.kr
                  </a>
                  )의 [민간자격 소개] 란을 참고하여 주십시오.
                </span>
              </li>
            </ul>
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