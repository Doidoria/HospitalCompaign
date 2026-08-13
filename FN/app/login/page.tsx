// app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import Link from 'next/link';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'user' | 'manager'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoLogin = () => {
    if (isLoading) return; // 이미 진행 중이면 무시
    setIsLoading(true);

    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY?.trim();
    const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI?.trim();
    
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI as string)}&response_type=code`;
    
    window.location.href = KAKAO_AUTH_URL;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await authApi.login({ email, password });
      
      // TypeScript 빨간 줄 해결: data를 any로 단언하여 안전하게 추출
      const resData = response.data as any;
      const token = resData?.accessToken || resData?.token || resData;
      
      if (!token || typeof token !== 'string') {
        console.error("🚨 [로그인 오류] 백엔드에서 받은 데이터에 토큰이 없습니다:", response);
        YesAlert.fire({ icon: 'error', title: '시스템 오류', text: '서버로부터 유효한 토큰을 받지 못했습니다.' });
        return;
      }

      localStorage.setItem('accessToken', token);
      // 개발 환경(http)과 운영 환경(https)을 모두 지원하는 하이브리드 쿠키 설정
      const isProd = process.env.NODE_ENV === 'production';
      document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax${isProd ? '; Secure' : ''}`;

      const meResponse = await authApi.getMe(); 
      const meData = meResponse.data as any;
      const userRole = meData?.role; 
      
      // [유저 탭]으로 로그인했는데 매니저 권한인 경우
      if (loginType === 'user' && userRole.includes('MANAGER')) {
        await YesAlert.fire({ icon: 'info', title: '안내', text: '매니저 계정입니다. 다음부터는 [동행 매니저] 탭에서 로그인해 주세요.', timer: 2500 });
        router.push('/manager/dashboard'); 
        return;
      }

      // [매니저 탭]으로 로그인했는데 아직 승인 안 된 일반 유저인 경우
      if (loginType === 'manager' && userRole === 'USER') {
        await YesAlert.fire({ icon: 'error', title: '접근 제한', text: '매니저 승인이 완료되지 않은 계정입니다.' });
        localStorage.removeItem('accessToken'); 
        return;
      }
      
      // 권한별 페이지 이동
      if (userRole === 'ADMIN') router.push('/admin');
      else if (userRole.includes('MANAGER')) router.push('/manager/dashboard');
      else router.push('/');

    } catch (error: any) {
      console.error("🚨 [로그인 실패 상세]:", error);

      if (error.response?.status === 409) {
        YesAlert.fire({
          icon: 'error',
          title: '이용 정지 안내',
          text: '정지된 계정입니다. 관리자에게 문의하세요.',
        });
      } else {
        YesAlert.fire({
          icon: 'error',
          title: '로그인 실패',
          text: error.message || '이메일 또는 비밀번호를 다시 확인해주세요.',
        });
      }
    }
  }

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <main className="flex-1 flex items-start justify-center px-6 pt-10 lg:pt-32">
        <motion.div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden" initial="hidden" animate="visible" variants={pageVariants}>
          <div className="flex text-center font-bold text-lg border-b border-gray-100">
            <button onClick={() => setLoginType('user')} className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors 
              ${loginType === 'user' ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-900' : 'text-gray-400 hover:bg-gray-50'}`} >
              <User className="w-5 h-5" /> 보호자/환자
            </button>
            <button onClick={() => setLoginType('manager')} className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors 
              ${loginType === 'manager' ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600' : 'text-gray-400 hover:bg-gray-50'}`} >
              <ShieldCheck className="w-5 h-5" /> 동행 매니저
            </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-blue-950 mb-2">
                {loginType === 'user' ? '예스케어 로그인' : '매니저 시스템 로그인'}
              </h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">아이디(이메일)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Mail className="w-5 h-5 text-gray-400" /></div>
                  <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소 또는 아이디" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Lock className="w-5 h-5 text-gray-400" /></div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력해주세요" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              <button type="submit" className={`w-full text-white text-lg font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] mt-4 ${loginType === 'user' ? 'bg-blue-900 hover:bg-blue-950' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                로그인
              </button>

              {/* 카카오 로그인 버튼 */}
              <button type="button" onClick={handleKakaoLogin} className="w-full flex items-center justify-center py-3 px-4 mt-0 bg-[#FEE500] rounded-xl hover:bg-[#FEE500]/90 transition-colors relative">
                <div className="absolute left-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3C6.477 3 2 6.53 2 10.887C2 13.737 3.738 16.236 6.368 17.653L5.433 21.096C5.352 21.395 5.688 21.636 5.962 21.464L10.024 18.91C10.662 19.014 11.321 19.07 12 19.07C17.523 19.07 22 15.54 22 11.183C22 6.827 17.523 3 12 3Z" fill="#000000"/>
                  </svg>
                </div>
                <span className="text-[16px] font-semibold text-black/85">
                  카카오 로그인
                </span>
              </button>
            </form>
            
            {/* 로그인 페이지 폼 하단 영역 */}
            <div className="mt-8 flex flex-col items-center gap-4 text-sm text-gray-600 font-medium">
              <div className="flex items-center gap-4">
                <Link href="/find-account?tab=id" className="hover:text-blue-600 transition-colors">
                  아이디 찾기
                </Link>
                <span className="w-px h-3 bg-gray-300"></span>
                <Link href="/find-account?tab=pw" className="hover:text-blue-600 transition-colors">
                  비밀번호 찾기
                </Link>
              </div>
              <div className="text-gray-500">
                계정이 없으신가요? 
                <Link href="/signup" className="text-blue-600 font-bold hover:underline ml-2">
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}