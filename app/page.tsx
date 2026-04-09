'use client'; 

import React, { useState } from 'react';
import { HeartPulse, CalendarCheck, UserCheck, Activity, FileText, ChevronRight, Menu, X } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  // 모바일 메뉴 열림/닫힘 상태 관리
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 순차 애니메이션 (Staggered Children) 설정
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 overflow-x-hidden relative">
      
      {/* 1. 글로벌 헤더 (Navigation) */}
      <header className="bg-white/95 shadow-sm sticky top-0 z-50 border-b border-gray-100 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-1.5 z-50 relative">
            <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight">
              예스케어
              <span className="font-semibold text-gray-500 text-base"> 병원동행</span>
            </h1>
          </Link>

          {/* 메뉴 (Desktop) */}
          <nav className="hidden md:flex space-x-10 text-gray-700 font-medium items-center">
            <Link href="/guide" className="hover:text-blue-600 transition duration-300">서비스 안내</Link>
            <Link href="/manager" className="hover:text-blue-600 transition duration-300">매니저 교육신청</Link>
            <Link href="/login" className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition duration-300 font-bold">
              로그인
            </Link>
          </nav>
          
          {/* 모바일 햄버거 메뉴 버튼 */}
          <button 
            className="md:hidden text-gray-800 p-2 z-50 relative focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="메뉴 열기/닫기"
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* 모바일 전용 메뉴바 (Drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* 배경 딤 처리 */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
            />
            
            {/* 슬라이드 메뉴 */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-2xl z-40 md:hidden flex flex-col pt-24 px-6"
            >
              <nav className="flex flex-col gap-6 text-xl font-bold text-gray-800">
                <Link 
                  href="/guide" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="pb-4 border-b border-gray-100 flex justify-between items-center"
                >
                  서비스 안내
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
                <Link 
                  href="/manager" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="pb-4 border-b border-gray-100 flex justify-between items-center"
                >
                  매니저 교육신청
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
                
                <div className="mt-8">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full bg-blue-900 text-white py-4 rounded-xl shadow-md active:scale-95 transition-transform">
                      로그인 및 회원가입
                    </button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. 히어로 섹션 */}
      <motion.section 
        className="bg-gradient-to-b from-blue-950 to-blue-800 text-white py-12 md:py-28 px-6 text-center overflow-hidden relative z-0"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          
          {/* 뱃지 */}
          <motion.div 
            className="inline-flex items-center gap-2 bg-white/10 text-emerald-300 px-4 py-1.5 rounded-full font-semibold text-sm border border-emerald-900 shadow-sm mx-auto backdrop-blur-sm"
            variants={itemVariants}
          >
              <HeartPulse className="w-5 h-5" />
              <span>건강한 삶을 함께하는 안심 파트너</span>
          </motion.div>

          {/* 메인 카피 */}
          <motion.h2 
            className="text-4xl md:text-7xl font-extrabold leading-tight break-keep"
            variants={itemVariants}
          >
            가족의 마음으로<br />
            병원 동행을 <span className="text-blue-100">완성</span>합니다.
          </motion.h2>

          {/* 서브 카피 */}
          <motion.p 
            className="text-blue-100 text-lg md:text-2xl max-w-2xl mx-auto break-keep leading-relaxed opacity-95"
            variants={itemVariants}
          >
            전문 교육을 이수한 병원동행 매니저가 집 앞부터 병원 진료, 귀가까지 안전하게 모십니다.<br />
            예스케어는 단순한 이동 지원을 넘어, 전문 교육을 받은 매니저가 진료의 전 과정을 안심하고 함께합니다.
          </motion.p>

          {/* CTA 버튼 */}
          <motion.div className="pt-2 md:pt-8" variants={itemVariants}>
            <Link href="/apply">
              <button className="bg-white text-blue-900 text-lg py-4 px-8 md:text-2xl md:py-5 md:px-16 font-extrabold rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center mx-auto space-x-2.5">
                <span>지금 바로 동행 신청하기</span>
                <ChevronRight className="w-5 h-5 md:w-7 md:h-7" />
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* 3. 서비스 진행 절차 */}
      <motion.section 
        className="py-16 md:py-24 px-6 max-w-7xl mx-auto w-full relative z-0"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }} 
        variants={containerVariants}
      >
        {/* ... (진행 절차 내용 동일하게 유지) ... */}
        <div className="text-center mb-12 md:mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800">서비스 진행 절차</h3>
          <p className="text-base md:text-xl text-gray-500 mt-3 max-w-xl mx-auto break-keep leading-relaxed">
            간편하게 신청하고 안심하고 이용하세요.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {[
            { step: '1. 서비스 신청', desc: '원하시는 날짜와 병원을 선택해 신청합니다.', Icon: CalendarCheck },
            { step: '2. 매니저 매칭', desc: '전문 교육을 수료한 매니저가 안전하게 배정됩니다.', Icon: UserCheck },
            { step: '3. 병원 동행', desc: '이동, 접수, 진료 동석 등 모든 과정을 함께합니다.', Icon: Activity },
            { step: '4. 케어 리포트', desc: '진료 결과와 다음 예약일을 보호자에게 전송합니다.', Icon: FileText },
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              className="bg-white p-6 md:p-10 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-lg text-center transition-all duration-300 hover:shadow-2xl group relative overflow-hidden"
              variants={itemVariants}
            >
              <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-100 text-emerald-700 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-5 md:mb-8 group-hover:scale-105 transition-transform duration-300">
                <item.Icon className="w-7 h-7 md:w-10 md:h-10" />
              </div>
              <h4 className="font-bold text-lg md:text-xl mb-2 md:mb-3 text-blue-950">{item.step}</h4>
              <p className="text-gray-600 break-keep leading-relaxed text-sm md:text-base opacity-90">
                {item.desc}
              </p>
              <div className="absolute -bottom-6 -right-6 w-16 h-16 md:w-24 md:h-24 bg-emerald-50 rounded-full opacity-30 group-hover:scale-120 transition-transform duration-500"></div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. 푸터 (Footer) */}
      <footer className="bg-gray-950 text-gray-400 py-16 px-6 mt-auto text-sm border-t border-gray-800 relative z-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="space-y-1.5">
            <p className="font-bold text-white text-lg">예스케어 <span className="text-gray-400 font-medium text-sm">| 병원동행서비스</span></p>
            <p>고객센터 : 1588-0000 | 이메일 : help@yescare.com</p>
          </div>
          <div className="text-xs text-gray-500 md:text-right space-y-1.5">
            <p>© 2026 YesCare. All rights reserved.</p>
            <p>서울특별시 중구 태평로 1가 | 사업자등록번호 : 123-45-67890</p>
          </div>
        </div>
      </footer>

    </div>
  );
}