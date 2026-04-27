'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Phone, CheckCircle2, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { authApi } from '@/src/api/index';

export default function SignupPage() {
  const router = useRouter();
  const [isOpenPost, setIsOpenPost] = useState(false);
  const [isEmailChecked, setIsEmailChecked] = useState(false);

  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    passwordConfirm: '',
    name: '', 
    phone: '', 
    address: '', 
    detailAddress: '', 
    guardianName: '',
    emergencyContact: '', 
    agreed: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    
    // 이메일을 다시 수정하면 중복 검사를 다시 하도록 초기화
    if (name === 'email') {
      setIsEmailChecked(false);
    }
  };

  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = '';
    if (data.addressType === 'R') {
      if (data.bname !== '') extraAddress += data.bname;
      if (data.buildingName !== '') extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }
    setFormData(prev => ({ ...prev, address: fullAddress }));
    setIsOpenPost(false);
  };

  // 🌟 이메일 중복 검사 로직
  const handleEmailCheck = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({ icon: 'warning', title: '형식 오류', text: '올바른 이메일 형식을 입력해 주세요.' });
      return;
    }

    try {
      // TODO: 백엔드에 이메일 중복 검사 API 호출 (현재 가상의 엔드포인트)
      const response = await authApi.checkEmail(formData.email);
      
      if (response.data.isAvailable) {
        Swal.fire({ icon: 'success', title: '사용 가능', text: '사용 가능한 이메일입니다.' });
        setIsEmailChecked(true);
      } else {
        Swal.fire({ icon: 'error', title: '사용 불가', text: '이미 가입된 이메일입니다.' });
        setIsEmailChecked(false);
      }
    } catch (error) {
      console.error('이메일 중복 검사 에러:', error);
      // 에러 발생 시 (API 미구현 상태를 고려하여 임시 통과 처리 - 나중에 지워주세요!)
      Swal.fire({ icon: 'info', title: 'API 연결 필요', text: '현재 중복 검사 API가 없어 임시로 통과됩니다.' });
      setIsEmailChecked(true); 
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailChecked) {
      Swal.fire({ icon: 'warning', title: '중복 검사 필요', text: '이메일(아이디) 중복 검사를 진행해 주세요.' });
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      Swal.fire({ icon: 'error', title: '비밀번호 확인', text: '비밀번호가 일치하지 않습니다.' });
      return;
    }

    const phoneRegex = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;
    const cleanPhone = formData.phone.replace(/-/g, '');
    const cleanEmergency = formData.emergencyContact.replace(/-/g, '');

    if (!phoneRegex.test(cleanPhone) || !phoneRegex.test(cleanEmergency)) {
      Swal.fire({ icon: 'warning', title: '연락처 오류', text: '올바른 휴대폰 번호 11자리를 입력해 주세요.' });
      return;
    }

    if (!formData.address) {
      Swal.fire({ icon: 'warning', title: '주소 입력', text: '주소 검색을 통해 기본 주소를 입력해 주세요.' });
      return;
    }

    if (!formData.agreed) {
      Swal.fire({ icon: 'warning', title: '약관 동의', text: '이용약관에 동의해 주세요.' });
      return;
    }
    
    try {
      const finalAddress = `${formData.address} ${formData.detailAddress}`.trim();

      const response = await authApi.signup({
        email: formData.email,
        password: formData.password,
        name: formData.name, 
        phoneNumber: cleanPhone,
        address: finalAddress,
        guardianName: formData.guardianName,
        emergencyContact: cleanEmergency
      });

      if (response.status === 200 || response.status === 201) {
        Swal.fire({
          icon: 'success', title: '가입 완료!', text: '예스케어에 오신 것을 환영합니다.',
          confirmButtonText: '로그인하러 가기', confirmButtonColor: '#1e3a8a'
        }).then(() => {
          router.push('/login'); 
        });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: '가입 실패', text: '회원가입 처리 중 오류가 발생했습니다.' });
    }
  };

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-12 relative">
      
      {isOpenPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">우편번호 검색</h3>
              <button onClick={() => setIsOpenPost(false)} className="text-gray-500 hover:text-gray-800 font-bold px-2 py-1">X</button>
            </div>
            <div className="h-[400px]">
              <DaumPostcodeEmbed onComplete={handleCompletePost} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center">
          <Link href="/login" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">로그인으로 돌아가기</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-10">
        <motion.div 
          className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden p-8 md:p-10"
          initial="hidden" animate="visible" variants={pageVariants}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-blue-950 mb-2">회원가입</h2>
            <p className="text-gray-500 text-sm">예스케어 계정을 만들고 서비스를 시작해 보세요.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* 🌟 순서 변경 1: 이메일 (중복검사 포함) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일 (아이디)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Mail className="w-5 h-5 text-gray-400" /></div>
                  <input type="email" name="email" onChange={handleChange} placeholder="example@yescare.com" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <button type="button" onClick={handleEmailCheck} className={`px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${isEmailChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-800 text-white hover:bg-gray-900'}`}>
                  {isEmailChecked ? '확인 완료' : '중복 확인'}
                </button>
              </div>
            </div>

            {/* 🌟 순서 변경 2: 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Lock className="w-5 h-5 text-gray-400" /></div>
                <input type="password" name="password" onChange={handleChange} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            {/* 🌟 순서 변경 3: 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 확인</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><CheckCircle2 className={`w-5 h-5 ${formData.passwordConfirm && formData.password === formData.passwordConfirm ? 'text-blue-500' : 'text-gray-400'}`} /></div>
                <input type="password" name="passwordConfirm" onChange={handleChange} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-2"></div>

            {/* 기본 정보들 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이름 (실명)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><User className="w-5 h-5 text-gray-400" /></div>
                <input type="text" name="name" onChange={handleChange} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">연락처</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="w-5 h-5 text-gray-400" /></div>
                <input type="tel" name="phone" onChange={handleChange} placeholder="숫자만 입력 (예: 01012345678)" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">거주지 주소</label>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><MapPin className="w-5 h-5 text-gray-400" /></div>
                  <input type="text" readOnly value={formData.address} placeholder="주소 검색을 클릭해주세요" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none cursor-pointer" onClick={() => setIsOpenPost(true)} required />
                </div>
                <button type="button" onClick={() => setIsOpenPost(true)} className="bg-gray-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center whitespace-nowrap">
                  <Search className="w-4 h-4 md:mr-1.5" /> <span className="hidden md:inline">검색</span>
                </button>
              </div>
              <input type="text" name="detailAddress" onChange={handleChange} placeholder="상세 주소 (동, 호수 등)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
            </div>

            <div className="border-t border-dashed border-gray-200 my-2"></div>

            {/* 🌟 새로 추가된 항목: 보호자 성명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">보호자 성명 (선택)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><User className="w-5 h-5 text-red-400" /></div>
                <input type="text" name="guardianName" onChange={handleChange} placeholder="환자와 다를 경우 입력" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">보호자(비상) 연락처</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="w-5 h-5 text-red-400" /></div>
                <input type="tel" name="emergencyContact" onChange={handleChange} placeholder="숫자만 입력 (가족 등 비상연락망)" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="agreed" onChange={handleChange} className="mt-1 w-5 h-5 cursor-pointer" required />
                <span className="text-sm text-gray-600">[필수] 예스케어 이용약관 및 개인정보 처리방침에 동의합니다.</span>
              </label>
            </div>

            <button type="submit" className="w-full bg-blue-900 text-white text-lg font-bold py-4 rounded-xl shadow-md hover:bg-blue-950 transition-all mt-4">
              가입 완료하기
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}