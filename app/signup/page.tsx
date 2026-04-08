'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Phone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirm: '',
    agreed: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!formData.agreed) {
      alert('이용약관 및 개인정보 처리방침에 동의해 주세요.');
      return;
    }
    
    // TODO: Spring Boot 백엔드 일반 유저 회원가입 API 연동
    console.log('유저 회원가입 데이터:', formData);
    alert('회원가입이 완료되었습니다. 예스케어에 오신 것을 환영합니다!');
  };

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-12">
      
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center">
          <Link href="/login" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">로그인으로 돌아가기</span>
          </Link>
        </div>
      </header>

      {/* 회원가입 폼 영역 */}
      <main className="flex-1 flex items-center justify-center px-6 pt-10">
        <motion.div 
          className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden p-8 md:p-10"
          initial="hidden"
          animate="visible"
          variants={pageVariants}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-blue-950 mb-2">회원가입</h2>
            <p className="text-gray-500 text-sm break-keep">
              예스케어 계정을 만들고 안심 동행 서비스를 시작해 보세요.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">이름 (실명)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" name="name" placeholder="홍길동" onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required 
                />
              </div>
            </div>

            {/* 연락처 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">연락처</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="tel" name="phone" placeholder="010-0000-0000" onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required 
                />
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">이메일 (아이디)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="email" name="email" placeholder="example@yescare.com" onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required 
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="password" name="password" placeholder="영문, 숫자 포함 8자 이상" onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required 
                />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호 확인</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CheckCircle2 className={`w-5 h-5 ${formData.passwordConfirm && formData.password === formData.passwordConfirm ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                <input 
                  type="password" name="passwordConfirm" placeholder="비밀번호를 다시 입력해 주세요" onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required 
                />
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" name="agreed" onChange={handleChange}
                  className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" required
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  [필수] 예스케어 <a href="#" className="text-blue-600 hover:underline font-medium">이용약관</a> 및 <a href="#" className="text-blue-600 hover:underline font-medium">개인정보 처리방침</a>에 동의합니다.
                </span>
              </label>
            </div>

            {/* 가입 버튼 */}
            <button 
              type="submit" 
              className="w-full bg-blue-900 text-white text-lg font-bold py-4 rounded-xl shadow-md hover:bg-blue-950 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            >
              가입 완료하기
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}