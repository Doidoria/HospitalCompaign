'use client'; 

import React from 'react';
import { HeartPulse, CalendarCheck, UserCheck, Activity, FileText, ChevronRight, ShieldCheck, Clock, Smile } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-x-hidden relative">
      {/* 1. 히어로 섹션 */}
      <motion.section className="bg-gradient-to-b from-blue-950 via-blue-900 to-gray-900 text-white py-16 md:py-32 px-6 text-center overflow-hidden relative z-0"
        initial="hidden" animate="visible" variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <motion.div className="inline-flex items-center gap-2 bg-white/10 text-emerald-300 px-5 py-2 rounded-full font-semibold text-sm border border-white/20 shadow-lg mx-auto backdrop-blur-md" variants={itemVariants}>
              <HeartPulse className="w-5 h-5" />
              <span>건강한 삶을 함께하는 안심 파트너, 예스케어</span>
          </motion.div>

          <motion.h2 className="text-4xl md:text-7xl font-extrabold leading-tight break-keep tracking-tight" variants={itemVariants}>
            가족의 마음으로<br />
            병원 동행을 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">완성</span>합니다
          </motion.h2>

          <motion.p className="text-blue-100/90 text-lg md:text-2xl max-w-2xl mx-auto break-keep leading-relaxed" variants={itemVariants}>
            전문 교육을 이수한 병원동행 매니저가<br className="hidden md:block" /> 집 앞부터 병원 진료, 귀가까지 안전하게 모십니다.
          </motion.p>

          <motion.div className="pt-6 md:pt-10" variants={itemVariants}>
            <Link href="/apply">
              <button className="group bg-white text-blue-950 text-lg py-4 px-8 md:text-xl md:py-5 md:px-12 font-extrabold rounded-full shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center justify-center mx-auto space-x-3">
                <span>지금 바로 동행 신청하기</span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* 2. 신뢰도 상승 포인트 섹션 */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex flex-col items-center py-4 md:py-0">
            <ShieldCheck className="w-10 h-10 text-blue-600 mb-3" />
            <h4 className="font-bold text-lg text-gray-900">철저한 신원 검증</h4>
            <p className="text-gray-500 text-sm mt-1">전문 교육 수료 및 범죄 이력 조회 완료</p>
          </div>
          <div className="flex flex-col items-center py-4 md:py-0">
            <Clock className="w-10 h-10 text-blue-600 mb-3" />
            <h4 className="font-bold text-lg text-gray-900">원하는 시간에 맞춰</h4>
            <p className="text-gray-500 text-sm mt-1">당일 예약부터 정기 방문까지 유연하게</p>
          </div>
          <div className="flex flex-col items-center py-4 md:py-0">
            <Smile className="w-10 h-10 text-blue-600 mb-3" />
            <h4 className="font-bold text-lg text-gray-900">상세한 케어 리포트</h4>
            <p className="text-gray-500 text-sm mt-1">진료 내용과 의사 소견을 보호자에게 직접 전달</p>
          </div>
        </div>
      </section>

      {/* 3. 서비스 진행 절차 */}
      <motion.section className="py-20 md:py-28 px-6 max-w-7xl mx-auto w-full relative z-0"
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants}>
        <div className="text-center mb-14 md:mb-20">
          <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">서비스 진행 절차</h3>
          <p className="text-lg md:text-xl text-gray-500 mt-4 max-w-xl mx-auto break-keep leading-relaxed">
            간편하게 신청하고 안심하고 이용하세요.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative">
          {/* 절차를 연결하는 점선 라인 */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-gray-200 -z-10 -translate-y-1/2"></div>
          {[
            { step: '1. 서비스 신청', desc: '원하시는 날짜와 병원을 선택해 신청합니다.', Icon: CalendarCheck },
            { step: '2. 매니저 매칭', desc: '전문 교육을 수료한 매니저가 안전하게 배정됩니다.', Icon: UserCheck },
            { step: '3. 병원 동행', desc: '이동, 접수, 진료 동석 등 모든 과정을 함께합니다.', Icon: Activity },
            { step: '4. 케어 리포트', desc: '진료 결과와 다음 예약일을 보호자에게 전송합니다.', Icon: FileText },
          ].map((item, idx) => (
            <motion.div key={idx} className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group" variants={itemVariants}>
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <item.Icon className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-900">{item.step}</h4>
              <p className="text-gray-500 break-keep leading-relaxed text-base">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}