'use client'; 

import React, { useState, useEffect } from 'react';
import { HeartPulse, CalendarCheck, UserCheck, Activity, FileText, ChevronRight, Menu, X, LogOut, ShieldAlert } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/src/api/index'; 

export default function Home() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 로그인 상태와 권한을 분리해서 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('USER');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // 토큰이 있다면 백엔드에 내 정보를 물어보고 권한을 가져옴
      authApi.getMe()
        .then((res) => {
          setIsLoggedIn(true);
          setUserRole(res.data.role); // 'USER', 'MANAGER', 'ADMIN' 중 하나가 세팅
        })
        .catch(() => {
          // 토큰이 만료되었거나 비정상적이면 로그아웃 처리
          localStorage.removeItem('accessToken');
          setIsLoggedIn(false);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setUserRole('USER');
    setIsMobileMenuOpen(false);
    alert('로그아웃 되었습니다.');
    router.push('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 overflow-x-hidden relative">
      
      {/* 히어로 섹션 */}
      <motion.section 
        className="bg-gradient-to-b from-blue-950 to-blue-800 text-white py-12 md:py-28 px-6 text-center overflow-hidden relative z-0"
        initial="hidden" animate="visible" variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <motion.div className="inline-flex items-center gap-2 bg-white/10 text-emerald-300 px-4 py-1.5 rounded-full font-semibold text-sm border border-emerald-900 shadow-sm mx-auto backdrop-blur-sm" variants={itemVariants}>
              <HeartPulse className="w-5 h-5" />
              <span>건강한 삶을 함께하는 안심 파트너</span>
          </motion.div>

          <motion.h2 className="text-4xl md:text-7xl font-extrabold leading-tight break-keep" variants={itemVariants}>
            가족의 마음으로<br />
            병원 동행을 <span className="text-blue-100">완성</span>합니다.
          </motion.h2>

          <motion.p className="text-blue-100 text-lg md:text-2xl max-w-2xl mx-auto break-keep leading-relaxed opacity-95" variants={itemVariants}>
            전문 교육을 이수한 병원동행 매니저가 집 앞부터 병원 진료, 귀가까지 안전하게 모십니다.<br />
            예스케어는 단순한 이동 지원을 넘어, 전문 교육을 받은 매니저가 진료의 전 과정을 안심하고 함께합니다.
          </motion.p>

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

      {/* 서비스 진행 절차 */}
      <motion.section className="py-16 md:py-24 px-6 max-w-7xl mx-auto w-full relative z-0"
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants}>
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
            <motion.div key={idx} className="bg-white p-6 md:p-10 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-lg text-center transition-all duration-300 hover:shadow-2xl group relative overflow-hidden" variants={itemVariants}>
              <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-100 text-emerald-700 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-5 md:mb-8 group-hover:scale-105 transition-transform duration-300">
                <item.Icon className="w-7 h-7 md:w-10 md:h-10" />
              </div>
              <h4 className="font-bold text-lg md:text-xl mb-2 md:mb-3 text-blue-950">{item.step}</h4>
              <p className="text-gray-600 break-keep leading-relaxed text-sm md:text-base opacity-90">{item.desc}</p>
              <div className="absolute -bottom-6 -right-6 w-16 h-16 md:w-24 md:h-24 bg-emerald-50 rounded-full opacity-30 group-hover:scale-120 transition-transform duration-500"></div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}