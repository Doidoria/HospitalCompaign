'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  // 'user' | 'manager' 상태로 로그인 타입 관리
  const [loginType, setLoginType] = useState<'user' | 'manager'>('user');
  const router = useRouter();

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Spring Security / 백엔드 로그인 API 연동
    if (loginType === 'user') {
      console.log('유저 로그인 성공, 마이페이지로 이동');
      router.push('/mypage'); 
    } else {
      console.log('매니저 로그인 성공');
      alert('매니저 시스템으로 로그인합니다.');
      // 추후 매니저 페이지 완료 시 router.push('/manager/dashboard') 등 추가
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* 간소화된 헤더 */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">메인으로</span>
          </Link>
        </div>
      </header>

      {/* 로그인 폼 영역 */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div 
          className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={pageVariants}
        >
          {/* 상단 탭 (유저 / 매니저 전환) */}
          <div className="flex text-center font-bold text-lg border-b border-gray-100">
            <button 
              onClick={() => setLoginType('user')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${loginType === 'user' ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-900' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <User className="w-5 h-5" />
              보호자/환자
            </button>
            <button 
              onClick={() => setLoginType('manager')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${loginType === 'manager' ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <ShieldCheck className="w-5 h-5" />
              동행 매니저
            </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-blue-950 mb-2">
                {loginType === 'user' ? '예스케어 로그인' : '매니저 시스템 로그인'}
              </h2>
              <p className="text-gray-500 text-sm">
                {loginType === 'user' 
                  ? '안심하고 맡길 수 있는 병원동행 서비스' 
                  : '예스케어의 든든한 파트너 매니저님, 환영합니다.'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* 이메일 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    placeholder="이메일 주소를 입력해주세요" 
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required 
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="비밀번호를 입력해주세요" 
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required 
                  />
                </div>
              </div>

              {/* 로그인 유지 및 비밀번호 찾기 */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-gray-600">로그인 유지</span>
                </label>
                <a href="#" className="text-blue-600 font-medium hover:underline">비밀번호 찾기</a>
              </div>

              {/* 로그인 버튼 */}
              <button 
                type="submit" 
                className={`w-full text-white text-lg font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] mt-2 
                  ${loginType === 'user' ? 'bg-blue-900 hover:bg-blue-950' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                로그인
              </button>
            </form>

            {/* 유저 모드일 때만 간편 로그인 표시 */}
            {loginType === 'user' && (
              <div className="mt-8">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute w-full border-t border-gray-200"></div>
                  <span className="bg-white px-4 text-sm text-gray-400 relative">또는 간편 로그인</span>
                </div>
                
                <button className="w-full bg-[#FEE500] text-[#000000] font-bold py-3.5 rounded-xl shadow-sm hover:bg-[#F4DC00] transition-colors flex items-center justify-center gap-2">
                  {/* 카카오톡 아이콘 대체 텍스트 */}
                  <span className="bg-black text-white text-xs px-1.5 py-0.5 rounded mr-1">K</span>
                  카카오로 시작하기
                </button>
              </div>
            )}

            <div className="mt-8 text-center text-sm text-gray-600">
              계정이 없으신가요? <Link href="/signup" className="text-blue-600 font-bold hover:underline ml-1">
                회원가입
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}