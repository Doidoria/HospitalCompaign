// src/components/Header.tsx
'use client'; 

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Menu, X, LogOut, ShieldAlert, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/src/api/index';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('USER');
  const [userName, setUserName] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // [최적화 1] 경로 변경 시 불필요한 API 중복 호출 방지
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setIsLoggedIn(false);
      setUserName('');
      setUserRole('USER');
      setIsAuthChecking(false);
      return;
    }

    // 이미 로그인 데이터가 로드된 상태면 경로 이동 시 재호출 생략 (UX 깜빡임 방지)
    if (isLoggedIn && userName) return;

    setIsAuthChecking(true);
    authApi.getMe()
      .then((res) => {
        setIsLoggedIn(true);
        setUserRole(res.data.role);
        setUserName(res.data.name);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
        setUserName('');
        setUserRole('USER');
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
  }, [pathname, isLoggedIn, userName]); // 의존성 조건 개선

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setUserRole('USER');
    setUserName('');
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  // 모바일 메뉴 오픈 시 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => pathname === path;

  // [최적화 2] 모바일 메뉴 설정 배열화 (유지보수성 향상)
  const NAV_ITEMS = useMemo(() => [
    { name: '서비스 안내', path: '/guide', show: true },
    { name: '고객센터(FAQ)', path: '/support/faq', show: true },
    { name: '매니저 교육신청', path: '/manager', show: userRole !== 'ADMIN' && userRole !== 'MANAGER' },
  ], [userRole]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {/* 1. 상단 고정 헤더 바 */}
      <header className="bg-white/95 shadow-sm sticky top-0 z-40 border-b border-gray-100 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 z-50 relative group">
            <div className="flex items-center gap-2 opacity-90">
              <img src="/wel_logo.svg" alt="wel logo" className="h-8 w-auto"/>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img src="/yescare.svg" alt="yescare logo" className="h-10 w-auto"/>
              <h1 className="text-xl md:text-2xl font-extrabold text-blue-950 tracking-tight mt-1">
                예스케어
                <span className="font-semibold text-[#299245] text-sm inline ml-1">병원동행</span>
              </h1>
            </div>
          </Link>

          {/* PC 네비게이션 */}
          <nav className="hidden lg:flex items-center gap-6 whitespace-nowrap">
            <div className="flex items-center gap-6 text-base font-bold">
              {NAV_ITEMS.filter(item => item.show).map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  className={`transition duration-300 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            <div className="border-l border-gray-200 pl-8 flex items-center min-w-[120px] justify-end">
              {isAuthChecking ? (
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              ) : isLoggedIn ? (
                <div className="flex items-center gap-5">
                  <Link href="/mypage" className={`font-bold transition duration-300 ${isActive('/mypage') ? 'text-blue-800' : 'text-blue-600 hover:text-blue-800'}`}>
                    마이페이지
                  </Link>

                  {userRole === 'ADMIN' && (
                    <Link href="/admin" className="text-red-500 font-bold hover:text-red-700 flex items-center gap-1 transition duration-300 bg-red-50 px-3 py-1.5 rounded-full text-sm">
                      <ShieldAlert className="w-4 h-4" /> 관리자
                    </Link>
                  )}
                  {userRole === 'MANAGER' && (
                    <Link href="/manager/dashboard" className="text-emerald-600 font-bold hover:text-emerald-800 transition duration-300 bg-emerald-50 px-3 py-1.5 rounded-full text-sm">
                      매니저 시스템
                    </Link>
                  )}
                  
                  <div className="flex items-center gap-4 border-l border-gray-100 pl-5">
                    <span className="text-sm font-bold text-gray-800"><span className="text-blue-700">{userName}</span>님</span>
                    <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition duration-300 group">
                      <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> 로그아웃
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 font-bold active:scale-95">
                  로그인 / 가입
                </Link>
              )}
            </div>
          </nav>
          
          <button className="lg:hidden text-gray-800 p-2 -mr-2 z-50 relative focus:outline-none active:scale-90" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-7 h-7 text-gray-500" /> : <Menu className="w-7 h-7 text-blue-950" />}
          </button>
        </div>
      </header>

      {/* 2. 모바일 서랍 메뉴 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="fixed inset-0 bg-gray-900/40 z-40 lg:hidden backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }} 
              className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white shadow-2xl z-40 lg:hidden flex flex-col pt-12 px-6 overflow-y-auto pb-10"
            >
              {isLoggedIn ? (
                <div className="mb-8 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-100 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600/80 font-bold mb-0.5">환영합니다</p>
                    <p className="text-lg font-extrabold text-blue-950">{userName} 님</p>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <p className="text-gray-500 text-sm mb-3">서비스를 이용하시려면 로그인해주세요.</p>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl shadow-md font-bold text-base active:scale-[0.98] transition-transform">
                      로그인 / 회원가입
                    </button>
                  </Link>
                </div>
              )}

              <nav className="flex flex-col gap-2 text-lg font-bold text-gray-800 flex-1">
                {NAV_ITEMS.filter(item => item.show).map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path} 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className={`p-4 rounded-xl flex justify-between items-center transition-colors ${isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {item.name} <ChevronRight className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-400' : 'text-gray-300'}`} />
                  </Link>
                ))}

                {isLoggedIn && (
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                    <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full bg-blue-900 text-white py-4 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 font-bold text-base">
                        <User className="w-5 h-5" /> 마이페이지
                      </button>
                    </Link>
                    
                    {userRole === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <button className="w-full bg-red-50 text-red-600 py-3.5 rounded-xl border border-red-100 flex items-center justify-center gap-2 mt-3 font-bold">
                          <ShieldAlert className="w-5 h-5" /> 관리자 대시보드
                        </button>
                      </Link>
                    )}
                    
                    {userRole === 'MANAGER' && (
                      <Link href="/manager/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <button className="w-full bg-emerald-50 text-emerald-600 py-3.5 rounded-xl border border-emerald-100 mt-3 font-bold">
                          매니저 시스템
                        </button>
                      </Link>
                    )}
                    
                    <button onClick={handleLogout} className="w-full bg-gray-50 text-gray-500 py-3.5 rounded-xl font-bold mt-3 flex items-center justify-center gap-2 active:bg-gray-100 transition-colors">
                      <LogOut className="w-5 h-5" /> 로그아웃
                    </button>
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}