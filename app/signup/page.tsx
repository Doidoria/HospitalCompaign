'use client';

import React, { useState, useEffect } from 'react';
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
    zipCode: '',
    address: '', 
    detailAddress: '', 
    guardianName: '',
    emergencyContact: ''
  });

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [timer, setTimer] = useState(180);

  const [agreements, setAgreements] = useState({
    age: false, terms: false, privacy: false
  });
  const allAgreed = agreements.age && agreements.terms && agreements.privacy;

  // 인증번호 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCodeSent && timer > 0 && !isPhoneVerified) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isCodeSent, timer, isPhoneVerified]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    setFormData(prev => ({ ...prev, zipCode: data.zonecode, address: fullAddress }));
    setIsOpenPost(false);
  };

  // 이메일 중복 검사 로직
  const handleEmailCheck = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({ icon: 'warning', title: '형식 오류', text: '올바른 이메일 형식을 입력해 주세요.' });
      return;
    }

    try {
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
      Swal.fire({ icon: 'info', title: 'API 연결 필요', text: '현재 중복 검사 API가 없어 임시로 통과됩니다.' });
      setIsEmailChecked(true); 
    }
  };

  const handleSendCode = async () => { 
    const phoneRegex = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;
    const cleanPhone = formData.phone.replace(/-/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      Swal.fire({ icon: 'warning', title: '번호 확인', text: '올바른 휴대폰 번호를 입력해 주세요.' });
      return;
    }
    try {
      await authApi.sendSms(cleanPhone);
      
      setIsCodeSent(true);
      setTimer(180);
      Swal.fire({ icon: 'success', title: '발송 완료', text: '인증번호가 발송되었습니다. 3분 내에 입력해 주세요.' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: '발송 실패', text: '문자 발송에 실패했습니다. 번호를 확인해 주세요.' });
    }
  };

  const handleVerifyCode = async () => {
    const cleanPhone = formData.phone.replace(/-/g, '');
    
    try {
      await authApi.verifySms(cleanPhone, verificationCode);
      
      setIsPhoneVerified(true);
      Swal.fire({ icon: 'success', title: '인증 성공', text: '휴대폰 인증이 완료되었습니다.' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: '인증 실패', text: '인증번호가 일치하지 않거나 만료되었습니다.' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailChecked) {
      Swal.fire({ icon: 'warning', title: '중복 검사 필요', text: '이메일(아이디) 중복 검사를 진행해 주세요.' });
      return;
    }
    // 비밀번호 강력 보안 (정규식 검사)
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*?_]).{8,16}$/;
    if (!passwordRegex.test(formData.password)) {
      Swal.fire({ icon: 'error', title: '비밀번호 규칙', text: '영문, 숫자, 특수문자를 포함하여 8~16자로 입력해 주세요.' });
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
    if (!formData.address || !formData.zipCode) {
      Swal.fire({ icon: 'warning', title: '주소 입력', text: '주소 검색을 통해 우편번호와 기본 주소를 입력해 주세요.' });
      return;
    }
    if (!allAgreed) {
      Swal.fire({ icon: 'warning', title: '약관 동의', text: '필수 이용약관에 모두 동의해 주세요.' });
      return;
    }
    
    // (자동 로그인 및 토큰 저장 로직 추가)
    try {
      const response = await authApi.signup({
        email: formData.email,
        password: formData.password,
        name: formData.name, 
        phoneNumber: cleanPhone,
        zipCode: formData.zipCode,
        address: formData.address,
        detailAddress: formData.detailAddress,
        guardianName: formData.guardianName,
        emergencyContact: cleanEmergency
      });

      if (response.status === 200 || response.status === 201) {
        // 가입 완료 직후, 방금 만든 정보로 백그라운드 자동 로그인 진행
        try {
          const loginRes = await authApi.login({ email: formData.email, password: formData.password });
          
          // 백엔드에서 받은 토큰을 브라우저에 저장
          const token = loginRes.data.token || loginRes.data;
          localStorage.setItem('accessToken', token);

          Swal.fire({
            icon: 'success', title: '가입 환영!', text: '예스케어의 회원이 되신 것을 환영합니다.',
            confirmButtonText: '마이페이지로 이동', confirmButtonColor: '#1e3a8a'
          }).then(() => {
            // 로그인 페이지를 건너뛰고 바로 마이페이지로 이동!
            router.push('/mypage'); 
          });

        } catch (loginError) {
          // 만약 자동 로그인이 실패하더라도 가입 자체는 성공했으므로 수동 로그인 유도
          Swal.fire({ icon: 'success', title: '가입 완료', text: '가입이 완료되었습니다. 로그인해 주세요.' })
            .then(() => router.push('/login'));
        }
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

      <main className="flex-1 flex items-center justify-center px-6 pt-10">
        <motion.div 
          className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden p-5 md:p-8"
          initial="hidden" animate="visible" variants={pageVariants}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-blue-950 mb-2">회원가입</h2>
            <p className="text-gray-500 text-sm">예스케어 계정을 만들고 서비스를 시작해 보세요.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* 이메일 (중복검사 포함) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일 (아이디)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Mail className="w-5 h-5 text-gray-400" /></div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@yescare.com" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <button type="button" onClick={handleEmailCheck} className={`px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${isEmailChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-800 text-white hover:bg-gray-900'}`}>
                  {isEmailChecked ? '확인 완료' : '중복 확인'}
                </button>
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Lock className="w-5 h-5 text-gray-400" /></div>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 확인</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><CheckCircle2 className={`w-5 h-5 ${formData.passwordConfirm && formData.password === formData.passwordConfirm ? 'text-blue-500' : 'text-gray-400'}`} /></div>
                <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-2"></div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이름 (실명)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><User className="w-5 h-5 text-gray-400" /></div>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            {/* 연락처 및 본인 인증 (중복 제거 완료) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">연락처 및 본인 인증</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="w-5 h-5 text-gray-400" /></div>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={isPhoneVerified} placeholder="숫자만 입력 (예: 01012345678)" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" required />
                </div>
                <button type="button" onClick={handleSendCode} disabled={isPhoneVerified} className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl whitespace-nowrap hover:bg-gray-300 disabled:opacity-50 transition-colors">
                  {isCodeSent ? '재전송' : '인증요청'}
                </button>
              </div>
              {isCodeSent && !isPhoneVerified && (
                <div className="flex gap-2 mt-2 relative">
                  <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="인증번호 6자리" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  <span className="absolute right-[100px] top-1/2 -translate-y-1/2 text-red-500 font-bold text-sm">
                    {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                  </span>
                  <button type="button" onClick={handleVerifyCode} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">확인</button>
                </div>
              )}
            </div>

            {/* 거주지 주소 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">거주지 주소</label>
              <div className="flex gap-2 mb-2">
                <input type="text" readOnly value={formData.zipCode} placeholder="우편번호" className="w-1/3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none" />
                <button type="button" onClick={() => setIsOpenPost(true)} className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center justify-center whitespace-nowrap">
                  <Search className="w-4 h-4 mr-1.5" /> 검색
                </button>
              </div>
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><MapPin className="w-5 h-5 text-gray-400" /></div>
                <input type="text" readOnly value={formData.address} placeholder="기본 주소" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none cursor-pointer" onClick={() => setIsOpenPost(true)} required />
              </div>
              <input type="text" name="detailAddress" value={formData.detailAddress} onChange={handleChange} placeholder="상세 주소 (동, 호수 등)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="border-t border-dashed border-gray-200 my-2"></div>

            {/* 보호자 성명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">보호자 성명 (선택)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><User className="w-5 h-5 text-red-400" /></div>
                <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} placeholder="환자와 다를 경우 입력" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            {/* 비상 연락처*/}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">보호자(비상) 연락처</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="w-5 h-5 text-red-400" /></div>
                <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="숫자만 입력 (가족 등 비상연락망)" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            {/* 상세 약관 동의 */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer border-b border-gray-200 pb-3">
                <input type="checkbox" checked={allAgreed} onChange={(e) => setAgreements({ age: e.target.checked, terms: e.target.checked, privacy: e.target.checked })} className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
                <span className="font-bold text-gray-800 text-sm">전체 약관에 동의합니다.</span>
              </label>
              <div className="pl-1 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreements.age} onChange={(e) => setAgreements({...agreements, age: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  <span className="text-xs text-gray-600">[필수] 만 14세 이상 이용자입니다.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreements.terms} onChange={(e) => setAgreements({...agreements, terms: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  <span className="text-xs text-gray-600">[필수] 예스케어 서비스 이용약관 동의</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreements.privacy} onChange={(e) => setAgreements({...agreements, privacy: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  <span className="text-xs text-gray-600">[필수] 개인정보 수집 및 이용 동의</span>
                </label>
              </div>
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