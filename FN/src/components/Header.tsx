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
  const [userProvider, setUserProvider] = useState('');
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('USER');
  const [userName, setUserName] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setIsLoggedIn(false);
      setUserName('');
      setUserRole('USER');
      setIsAuthChecking(false);
      return;
    }

    if (isLoggedIn && userName) return;

    setIsAuthChecking(true);
    authApi.getMe()
      .then((res) => {
        setIsLoggedIn(true);
        setUserRole(res.data.role);
        setUserName(res.data.name);
        setUserProvider(res.data.provider); // 백엔드에서 받은 KAKAO 또는 LOCAL 저장
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
  }, [pathname, isLoggedIn, userName]);

  const handleLogout = async () => {
  try {
    await authApi.logout(); 
  } catch (error) {
    console.error('서버 로그아웃 처리 실패:', error);
  } finally {
    // 공통: 프론트엔드 로컬스토리지 및 상태 초기화
    localStorage.removeItem('accessToken');
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Strict';
    
    setIsLoggedIn(false);
    setUserRole('USER');
    setUserName('');
    setIsMobileMenuOpen(false);

    // 분기 처리: 카카오 로그인 유저 vs 일반 유저
    if (userProvider === 'KAKAO') {
      const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
      const LOGOUT_REDIRECT_URI = window.location.origin + '/'; 
      // 카카오 세션 완전 파기를 위한 리다이렉트
      window.location.href = `https://kauth.kakao.com/oauth/logout?client_id=${KAKAO_CLIENT_ID}&logout_redirect_uri=${LOGOUT_REDIRECT_URI}`;
    } else {
      router.push('/login'); 
    }
  }
};

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => pathname === path;

  const NAV_ITEMS = useMemo(() => [
    { name: '서비스 안내', path: '/guide', show: true },
    { name: '고객센터(FAQ)', path: '/support/faq', show: true },
    { name: '프리랜서 교육신청', path: '/manager', show: userRole !== 'ADMIN' && userRole !== 'MANAGER' },
  ], [userRole]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {/* 1. 상단 고정 헤더 바 */}
      <header className="bg-white/95 shadow-sm sticky top-0 z-40 border-b border-gray-100 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between w-full">
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 z-50">
              <img src="/wel_logo.svg" alt="wel logo" className="h-6 sm:h-8 w-auto"/>
              <div className="h-6 sm:h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <img src="/yescare.svg" alt="yescare logo" className="h-8 sm:h-10 w-auto"/>
                <h1 className="text-base sm:text-2xl font-extrabold text-blue-950 tracking-tight mt-1">
                  예스케어
                  <span className="font-semibold text-[#299245] text-[10px] sm:text-sm inline ml-1">병원동행</span>
                </h1>
              </div>
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-end gap-3 md:gap-5 z-50">
            <nav className="hidden xl:flex items-center justify-center gap-8 whitespace-nowrap shrink-0">
              {NAV_ITEMS.filter(item => item.show).map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  className={`text-base font-bold transition duration-300 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="hidden xl:block h-5 w-px bg-gray-200 mx-2" />
            <div className="hidden xl:flex items-center justify-end">
              {isAuthChecking ? (
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              ) : isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <Link href="/mypage" className={`font-bold transition duration-300 whitespace-nowrap ${isActive('/mypage') ? 'text-blue-800' : 'text-blue-600 hover:text-blue-800'}`}>
                    마이페이지
                  </Link>
                  {userRole === 'ADMIN' && (
                    <Link href="/admin" className="text-red-500 font-bold hover:text-red-700 flex items-center gap-1 transition duration-300 bg-red-50 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
                      <ShieldAlert className="w-4 h-4" /> 관리자
                    </Link>
                  )}
                  {userRole === 'MANAGER' && (
                    <Link href="/manager/dashboard" className="text-emerald-600 font-bold hover:text-emerald-800 transition duration-300 bg-emerald-50 px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
                      매니저 시스템
                    </Link>
                  )}
                  <div className="flex items-center gap-3 border-l border-gray-200 pl-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-800"><span className="text-blue-700">{userName}</span>님</span>
                    <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition duration-300 group">
                      <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> 로그아웃
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:shadow-md transition-all duration-300 font-bold text-sm whitespace-nowrap">
                  로그인 / 가입
                </Link>
              )}
            </div>

            {/* 햄버거 버튼 */}
            <button className="xl:hidden p-2 text-gray-800 focus:outline-none bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-500" /> : <Menu className="w-6 h-6 text-blue-950" />}
            </button>
          </div>
          
        </div>
      </header>

      {/* 4. 모바일 서랍 메뉴 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="fixed inset-0 bg-gray-900/40 z-40 xl:hidden backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }} 
              className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white shadow-2xl z-50 xl:hidden flex flex-col pt-12 px-6 overflow-y-auto pb-10"
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