'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { authApi } from '@/src/api/index';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'user' | 'manager'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 🌟 로컬호스트 주소와 axios를 지우고 깔끔하게 authApi로 교체!
      const response = await authApi.login({ email, password });
      
      const token = response.data.token || response.data;
      localStorage.setItem('accessToken', token);

      // 🌟 헤더에 토큰 넣는 로직 삭제 (인터셉터가 자동 처리)
      const meResponse = await authApi.getMe(); 
      const userRole = meResponse.data.role;
      
      // [유저 탭]으로 로그인했는데 매니저 권한인 경우
      if (loginType === 'user' && userRole === 'MANAGER') {
        await Swal.fire({ icon: 'info', title: '안내', text: '매니저 계정입니다. 다음부터는 [동행 매니저] 탭에서 로그인해 주세요.', timer: 2500 });
        router.push('/manager/dashboard'); // 매니저 대시보드로 보내줌
        return;
      }

      // [매니저 탭]으로 로그인했는데 아직 승인 안 된 일반 유저인 경우
      if (loginType === 'manager' && userRole === 'USER') {
        await Swal.fire({ icon: 'error', title: '접근 제한', text: '매니저 승인이 완료되지 않은 계정입니다.' });
        localStorage.removeItem('accessToken'); // 토큰 뺏기 (로그아웃 처리)
        return;
      }

      // 정상 로그인 처리
      await Swal.fire({ icon: 'success', title: '로그인 성공', text: '예스케어에 오신 것을 환영합니다.', showConfirmButton: false, timer: 1500 });
      
      // 권한별 페이지 이동
      if (userRole === 'ADMIN') router.push('/admin');
      else if (userRole === 'MANAGER') router.push('/manager/dashboard');
      else router.push('/mypage');

    } catch (error) {
      console.error("로그인 에러:", error);
      Swal.fire({
        icon: 'error', title: '로그인 실패', text: '이메일 또는 비밀번호를 다시 확인해 주세요.',
        confirmButtonColor: '#1e3a8a'
      });
    }
  };

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">메인으로</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div 
          className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden"
          initial="hidden" animate="visible" variants={pageVariants}
        >
          <div className="flex text-center font-bold text-lg border-b border-gray-100">
            <button onClick={() => setLoginType('user')} className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${loginType === 'user' ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-900' : 'text-gray-400 hover:bg-gray-50'}`} >
              <User className="w-5 h-5" /> 보호자/환자
            </button>
            <button onClick={() => setLoginType('manager')} className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${loginType === 'manager' ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600' : 'text-gray-400 hover:bg-gray-50'}`} >
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
            </form>
            
            <div className="mt-8 text-center text-sm text-gray-600">
              계정이 없으신가요? <Link href="/signup" className="text-blue-600 font-bold hover:underline ml-1">회원가입</Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}