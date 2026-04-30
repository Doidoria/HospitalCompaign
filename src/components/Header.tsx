'use client'; 

import React, { useState, useEffect } from 'react';
import { ChevronRight, Menu, X, LogOut, ShieldAlert, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/src/api/index'; 

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('USER');
  const [userName, setUserName] = useState('');

  // 마운트 시 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.getMe()
        .then((res) => {
          setIsLoggedIn(true);
          setUserRole(res.data.role);
          setUserName(res.data.name);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          setIsLoggedIn(false);
        });
    }
  }, []);

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setUserRole('USER');
    setUserName('');
    setIsMobileMenuOpen(false);
    alert('로그아웃 되었습니다.');
    router.push('/');
  };

  // 모바일 메뉴가 열렸을 때 배경 스크롤 방지
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* 1. 상단 고정 헤더 바 */}
      <header className="bg-white/95 shadow-sm sticky top-0 z-40 border-b border-gray-100 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-1.5 z-50 relative">
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950 tracking-tight">
              예스케어<span className="font-semibold text-gray-500 text-sm md:text-base hidden sm:inline"> 병원동행</span>
            </h1>
          </Link>

          {/* PC 전용 네비게이션 (모바일에서는 숨김) */}
          <nav className="hidden md:flex space-x-10 text-gray-700 font-medium items-center">
            <Link href="/guide" className="hover:text-blue-600 transition duration-300">서비스 안내</Link>
            
            {userRole !== 'ADMIN' && userRole !== 'MANAGER' && (
              <Link href="/manager" className="hover:text-blue-600 transition duration-300">매니저 교육신청</Link>
            )}
            
            {isLoggedIn ? (
              <div className="flex items-center gap-6 border-l border-gray-200 pl-6">
                <Link href="/mypage" className="text-blue-700 font-bold hover:text-blue-900 transition duration-300">마이페이지</Link>
                {userRole === 'ADMIN' && (
                  <Link href="/admin" className="text-red-600 font-bold hover:text-red-800 flex items-center gap-1.5 transition duration-300">
                    <ShieldAlert className="w-4 h-4" /> 관리자
                  </Link>
                )}
                {userRole === 'MANAGER' && (
                  <Link href="/manager/dashboard" className="text-emerald-600 font-bold hover:text-emerald-800 transition duration-300">매니저 시스템</Link>
                )}
                <span className="text-sm font-bold text-blue-900">{userName}님</span>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition duration-300">
                  <LogOut className="w-4 h-4" /> 로그아웃
                </button>
              </div>
            ) : (
              <Link href="/login" className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition duration-300 font-bold">
                로그인 / 가입
              </Link>
            )}
          </nav>
          
          {/* 모바일 햄버거 버튼 (PC에서는 숨김) */}
          <button 
            className="md:hidden text-gray-800 p-2 z-50 relative focus:outline-none" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* 2. 모바일 전용 서랍(Drawer) 메뉴 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* 반투명 배경 (클릭 시 닫힘) */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm" 
            />
            
            {/* 우측에서 슬라이드 되어 나오는 메뉴판 */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }} 
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-40 md:hidden flex flex-col pt-20 px-6 overflow-y-auto pb-10"
            >
              {/* 모바일 사용자 프로필 영역 */}
              {isLoggedIn && (
                <div className="mb-8 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">환영합니다</p>
                    <p className="text-lg font-bold text-blue-950">{userName} 님</p>
                  </div>
                </div>
              )}

              {/* 모바일 메뉴 리스트 */}
              <nav className="flex flex-col gap-5 text-lg font-bold text-gray-800">
                <Link href="/guide" onClick={() => setIsMobileMenuOpen(false)} className="pb-4 border-b border-gray-100 flex justify-between items-center hover:text-blue-600">
                  서비스 안내 <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
                <Link href="/apply" onClick={() => setIsMobileMenuOpen(false)} className="pb-4 border-b border-gray-100 flex justify-between items-center hover:text-blue-600">
                  동행 예약하기 <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
                
                {userRole !== 'ADMIN' && userRole !== 'MANAGER' && (
                  <Link href="/manager" onClick={() => setIsMobileMenuOpen(false)} className="pb-4 border-b border-gray-100 flex justify-between items-center hover:text-blue-600">
                    매니저 교육신청 <ChevronRight className="w-5 h-5 text-gray-300" />
                  </Link>
                )}

                {/* 하단 버튼 영역 */}
                <div className="mt-6 space-y-3">
                  {isLoggedIn ? (
                    <>
                      <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)}>
                        <button className="w-full bg-blue-900 text-white py-4 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2">
                          <User className="w-5 h-5" /> 마이페이지
                        </button>
                      </Link>
                      {userRole === 'ADMIN' && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <button className="w-full bg-red-600 text-white py-4 rounded-xl shadow-md flex items-center justify-center gap-2 mt-3">
                            <ShieldAlert className="w-5 h-5" /> 관리자 대시보드
                          </button>
                        </Link>
                      )}
                      {userRole === 'MANAGER' && (
                        <Link href="/manager/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <button className="w-full bg-emerald-600 text-white py-4 rounded-xl shadow-md mt-3">매니저 시스템</button>
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-medium mt-3 flex items-center justify-center gap-2">
                        <LogOut className="w-5 h-5" /> 로그아웃
                      </button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full bg-blue-900 text-white py-4 rounded-xl shadow-md font-bold text-lg">
                        로그인 / 회원가입
                      </button>
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}