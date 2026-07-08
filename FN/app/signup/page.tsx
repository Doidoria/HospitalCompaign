// app/signup/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Mail, Lock, User, Phone, CheckCircle2, MapPin, Search, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { YesAlert, Toast } from '@/src/utils/alert';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { authApi } from '@/src/api/index';

export default function SignupPage() {
  const router = useRouter();
  const [isOpenPost, setIsOpenPost] = useState(false);
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailTimer, setEmailTimer] = useState(180);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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
    guardianPhone: ''
  });

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [timer, setTimer] = useState(180);

  const [agreements, setAgreements] = useState({
    age: false, terms: false, privacy: false
  });
  const allAgreed = agreements.age && agreements.terms && agreements.privacy;

  // 비밀번호 정규식 (영문, 숫자, 특수문자 포함 8~16자)
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\s]).{8,16}$/;
  const isPasswordValid = passwordRegex.test(formData.password);
  const isPasswordMatch = formData.password === formData.passwordConfirm && formData.password !== '';

  // 3분(180초) 타이머가 120초(1분 경과) 이하로 떨어졌을 때만 재전송 가능하도록 설정
  const isSmsCooldown = isCodeSent && timer > 120; // 서버의 1분(60초) 쿨타임과 동기화

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEmailCodeSent && !isEmailVerified && emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEmailCodeSent, isEmailVerified, emailTimer]);

  // 인증번호 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCodeSent && !isPhoneVerified && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0; // 0에서 멈추도록 보장
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCodeSent, isPhoneVerified, timer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email') {
      setIsEmailChecked(false);
      setIsEmailVerified(false);
      setIsEmailCodeSent(false);
      setEmailVerificationCode('');
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

  // 1. 이메일 인증번호 발송 핸들러
  const handleSendEmailCode = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      YesAlert.fire({ icon: 'warning', title: '형식 오류', text: '올바른 이메일 형식을 입력해 주세요.' });
      return;
    }

    try {
      setIsSendingEmail(true);

      // [1단계] 이메일 중복 체크 선행
      const checkRes = await authApi.checkEmail(formData.email);
      const checkData = checkRes.data;
      const isAvailable = checkData?.data === true || checkData === true;

      if (!isAvailable) {
        YesAlert.fire({ icon: 'warning', title: '이메일 중복', text: '이미 가입된 이메일입니다. 다른 이메일을 사용해 주세요.' });
        return; // 여기서 로직이 멈추고 발송 API는 호출되지 않음
      }
      setIsEmailChecked(true);

      // [2단계] 인증번호 전송
      await authApi.sendEmailCode(formData.email); 
      setIsEmailCodeSent(true);
      setEmailTimer(180);
      YesAlert.fire({ icon: 'success', title: '발송 완료', text: '이메일로 인증번호가 발송되었습니다.' });

    } catch (error: any) {
      console.error("이메일 처리 에러 상세:", error);
      
      const errData = error.response?.data;
      let errorText = '서버 통신에 실패했습니다.';

      if (errData) {
        if (typeof errData === 'string') {
          errorText = errData;
        } else if (errData.message) {
          errorText = errData.message;
        } else if (errData.data?.message) {
          errorText = errData.data.message;
        } else {
          errorText = JSON.stringify(errData);
        }
      }

      // 최종 알림창 출력
      if (errorText.includes('가입된')) {
        YesAlert.fire({ icon: 'warning', title: '이메일 중복', text: '이미 가입된 이메일입니다.' });
      } else {
        YesAlert.fire({ icon: 'error', title: '오류 발생', text: errorText });
      }
      
    } finally {
      setIsSendingEmail(false); 
    }
  };

  // 2. 이메일 인증번호 확인 핸들러
  const handleVerifyEmailCode = async () => {
    if (!emailVerificationCode) return;
    try {
      await authApi.verifyEmailCode(formData.email, emailVerificationCode);
      setIsEmailVerified(true);
      YesAlert.fire({ icon: 'success', title: '인증 성공', text: '이메일 인증이 완료되었습니다.' });
    } catch (error) {
      YesAlert.fire({ icon: 'error', title: '인증 실패', text: '인증번호가 일치하지 않습니다.' });
    }
  };

  const handleSendCode = async () => { 
    const phoneRegex = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;
    const cleanPhone = formData.phone.replace(/-/g, '');
    const cleanEmergency = formData.guardianPhone.replace(/-/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      YesAlert.fire({ icon: 'warning', title: '연락처 오류', text: '본인 연락처를 올바른 휴대폰 번호 형식으로 입력해 주세요.' });
      return;
    }
    if (cleanEmergency && !phoneRegex.test(cleanEmergency)) {
      YesAlert.fire({ icon: 'warning', title: '연락처 오류', text: '보호자 연락처를 올바른 형식으로 입력해 주세요.' });
      return;
    }
    try {
      await authApi.sendSms(cleanPhone);
      setIsCodeSent(true);
      setTimer(180); // 발송 성공 시 타이머 180초로 리셋
      YesAlert.fire({ icon: 'success', title: '발송 완료', text: '인증번호가 발송되었습니다. 3분 내에 입력해 주세요.' });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data || '문자 발송에 실패했습니다. 번호를 확인해 주세요.';
      YesAlert.fire({ icon: 'error', title: '발송 실패', text: typeof errorMsg === 'string' ? errorMsg : '잠시 후 다시 시도해주세요.' });
    }
  };

  const handleVerifyCode = async () => {
    const cleanPhone = formData.phone.replace(/-/g, '');
    try {
      await authApi.verifySms(cleanPhone, verificationCode);
      setIsPhoneVerified(true);
      YesAlert.fire({ icon: 'success', title: '인증 성공', text: '휴대폰 인증이 완료되었습니다.' });
    } catch (error) {
      YesAlert.fire({ icon: 'error', title: '인증 실패', text: '인증번호가 일치하지 않거나 만료되었습니다.' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isEmailVerified) {
      setErrorMessage('이메일(아이디) 본인 인증을 완료해 주세요.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage('비밀번호를 규칙에 맞게 입력해 주세요.');
      return;
    }
    if (!isPasswordMatch) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    const phoneRegex = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;
    const cleanPhone = formData.phone.replace(/-/g, '');
    const cleanEmergency = formData.guardianPhone.replace(/-/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage('올바른 본인 휴대폰 번호 11자리를 입력해 주세요.');
      return;
    }
    if (cleanEmergency && !phoneRegex.test(cleanEmergency)) {
      setErrorMessage('올바른 보호자 휴대폰 번호 11자리를 입력해 주세요.');
      return;
    }
    if (!formData.address || !formData.zipCode) {
      setErrorMessage('주소 검색을 통해 우편번호와 기본 주소를 입력해 주세요.');
      return;
    }
    if (!isPhoneVerified) {
      setErrorMessage('휴대폰 본인 인증을 완료해 주세요.');
      return;
    }
    if (!allAgreed) {
      setErrorMessage('필수 이용약관에 모두 동의해 주세요.');
      return;
    }
    
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
        guardianPhone: cleanEmergency
      });

      if (response.status === 200 || response.status === 201) {
        try {
          const loginRes = await authApi.login({ email: formData.email, password: formData.password });
          const token = loginRes.data.token || loginRes.data;
          localStorage.setItem('accessToken', token);

          router.push('/'); 
        } catch (loginError) {
          router.push('/login');
        }
      }
    } catch (error: any) {
      const errorText = error.message || '회원가입 처리 중 오류가 발생했습니다. 다시 시도해 주세요.';
      setErrorMessage(errorText); // 화면 하단 에러 메시지 업데이트
      YesAlert.fire({
        icon: 'error',
        title: '회원가입 실패',
        text: errorText
      });
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

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-16">
        <motion.div className="w-full max-w-xl bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden p-6 md:p-10"
          initial="hidden" animate="visible" variants={pageVariants}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-blue-950 mb-2">회원가입</h2>
            <p className="text-gray-500 text-sm">예스케어 계정을 만들고 서비스를 시작해 보세요.</p>
            <div className="mt-4 text-right">
              <span className="text-xs text-gray-400"><span className="text-red-500">*</span> 는 필수 입력 항목입니다.</span>
            </div>
          </div>
          <form onSubmit={handleSignup} className="space-y-6">
            {/* 이메일 (아이디) 및 인증 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                이메일 (아이디) <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Mail className="w-5 h-5 text-gray-400" /></div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isEmailVerified} placeholder="example@yescare.com" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 transition-all text-base placeholder:text-[13px] sm:placeholder:text-[15px]" required />
                </div>
                <button 
                  type="button" 
                  onClick={handleSendEmailCode} 
                  disabled={isEmailVerified || isSendingEmail || (isEmailCodeSent && emailTimer > 150)} 
                  className={`px-4 py-3.5 rounded-xl font-bold whitespace-nowrap transition-colors text-sm sm:text-base flex items-center justify-center min-w-[90px]
                    ${isEmailVerified ? 'bg-emerald-100 text-emerald-700' : 
                      isSendingEmail ? 'bg-gray-200 text-gray-500 cursor-not-allowed' :
                      (isEmailCodeSent && emailTimer > 150) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                      'bg-gray-800 text-white hover:bg-gray-900'}`}
                >
                  {isSendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                   isEmailVerified ? '인증 완료' : 
                   isEmailCodeSent ? (emailTimer > 150 ? `${emailTimer - 150}초 후` : '재전송') : 
                   '인증 요청'}
                </button>
              </div>
              
              {/* 인증번호 입력 칸 (발송 후에만 노출) */}
              {isEmailCodeSent && !isEmailVerified && (
                <div className="flex gap-2 mt-2 relative animate-in fade-in slide-in-from-top-2">
                  <input type="text" value={emailVerificationCode} onChange={(e) => setEmailVerificationCode(e.target.value)} placeholder="인증번호 6자리" 
                  className="flex-1 px-4 py-3.5 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30 text-base placeholder:text-[13px] sm:placeholder:text-[15px]" />
                  <span className="absolute right-[85px] sm:right-[100px] top-1/2 -translate-y-1/2 text-red-500 font-bold text-sm">
                    {Math.floor(emailTimer / 60)}:{String(emailTimer % 60).padStart(2, '0')}
                  </span>
                  <button type="button" onClick={handleVerifyEmailCode} className="px-5 sm:px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base">
                    확인
                  </button>
                </div>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                비밀번호 <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Lock className="w-5 h-5 text-gray-400" /></div>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="영문, 숫자, 특수문자 포함 8~16자" 
                className={`w-full pl-11 pr-4 py-3.5 rounded-xl border outline-none transition-all text-base placeholder:text-[13px] sm:placeholder:text-[15px] 
                ${formData.password && !isPasswordValid ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`} required />
              </div>
              {formData.password && !isPasswordValid && (
                <p className="text-[11px] sm:text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0"/> 영문, 숫자, 특수문자를 포함하여 8~16자로 입력해 주세요.</p>
              )}
              {formData.password && isPasswordValid && (
                <p className="text-[11px] sm:text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 shrink-0"/> 안전한 비밀번호입니다.</p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                비밀번호 확인 <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><CheckCircle2 className={`w-5 h-5 ${isPasswordMatch ? 'text-emerald-500' : 'text-gray-400'}`} /></div>
                <input type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} placeholder="비밀번호 재입력" 
                className={`w-full pl-11 pr-4 py-3.5 rounded-xl border outline-none transition-all text-base placeholder:text-[13px] sm:placeholder:text-[15px] 
                ${formData.passwordConfirm && !isPasswordMatch ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`} required />
              </div>
              {formData.passwordConfirm && !isPasswordMatch && (
                <p className="text-[11px] sm:text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0"/> 비밀번호가 일치하지 않습니다.</p>
              )}
              {isPasswordMatch && (
                <p className="text-[11px] sm:text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 shrink-0"/> 비밀번호가 일치합니다.</p>
              )}
            </div>

            <div className="border-t border-dashed border-gray-200 my-2"></div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                이름 (실명) <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><User className="w-5 h-5 text-gray-400" /></div>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="예: 홍길동" className="w-full pl-11 pr-4 py-3.5 rounded-xl 
                border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base placeholder:text-[13px] sm:placeholder:text-[15px]" required />
              </div>
            </div>

            {/* 연락처 및 본인 인증 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                연락처 및 본인 인증 <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="w-5 h-5 text-gray-400" /></div>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={isPhoneVerified} placeholder="숫자만 입력 (예: 01012345678)" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 
                  transition-all text-base placeholder:text-[12px] sm:placeholder:text-[15px]" required />
                </div>
                <button 
                  type="button" 
                  onClick={handleSendCode} 
                  disabled={isPhoneVerified || isSmsCooldown} 
                  className={`px-4 py-3.5 font-bold rounded-xl whitespace-nowrap min-w-[90px] flex items-center justify-center transition-colors text-sm sm:text-base 
                    ${isPhoneVerified ? 'bg-emerald-100 text-emerald-700' : 
                      isSmsCooldown ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                      'bg-gray-800 text-white hover:bg-gray-900'}`}
                >
                  {isPhoneVerified ? '인증 완료' : 
                   isSmsCooldown ? `${timer - 120}초 후` : // 60초 카운트다운 보여주기
                   isCodeSent ? '재전송' : '인증요청'}
                </button>
              </div>
              {isCodeSent && !isPhoneVerified && (
                <div className="flex gap-2 mt-2 relative animate-in fade-in slide-in-from-top-2">
                  <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="인증번호 6자리" 
                  className="flex-1 px-4 py-3.5 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30 text-base 
                  placeholder:text-[13px] sm:placeholder:text-[15px]" />
                  <span className="absolute right-[85px] sm:right-[100px] top-1/2 -translate-y-1/2 text-red-500 font-bold text-sm">
                    {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                  </span>
                  <button type="button" onClick={handleVerifyCode} className="px-5 sm:px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 
                  transition-colors text-sm sm:text-base">확인</button>
                </div>
              )}
            </div>

            {/* 거주지 주소 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                거주지 주소 <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input type="text" readOnly value={formData.zipCode} placeholder="우편번호" className="w-1/3 px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none text-base placeholder:text-[13px] sm:placeholder:text-[15px]" required />
                <button type="button" onClick={() => setIsOpenPost(true)} className="flex-1 bg-gray-800 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center justify-center whitespace-nowrap text-sm sm:text-base">
                  <Search className="w-4 h-4 mr-1.5" /> 주소 검색
                </button>
              </div>
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><MapPin className="w-5 h-5 text-gray-400" /></div>
                <input type="text" readOnly value={formData.address} placeholder="기본 주소 (검색을 이용해 주세요)" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none cursor-pointer text-base placeholder:text-[13px] sm:placeholder:text-[15px]" onClick={() => setIsOpenPost(true)} required />
              </div>
              <input type="text" name="detailAddress" value={formData.detailAddress} onChange={handleChange} placeholder="상세 주소 (동, 호수 등) - 선택" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base placeholder:text-[13px] sm:placeholder:text-[15px]" />
            </div>

            <div className="border-t border-dashed border-gray-200 my-2"></div>

            {/* 보호자 성명 (선택) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                보호자 성명 <span className="text-gray-400 font-normal ml-1">(선택)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><User className="w-5 h-5 text-orange-400" /></div>
                <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} placeholder="환자와 다를 경우 입력 (예: 홍길동)" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-base placeholder:text-[13px] sm:placeholder:text-[15px]" />
              </div>
            </div>

            {/* 비상 연락처 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                보호자(비상) 연락처 <span className="text-gray-400 font-normal ml-1">(선택)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="w-5 h-5 text-orange-400" /></div>
                <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} placeholder="숫자만 입력 (가족 등 비상연락망)" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-base placeholder:text-[13px] sm:placeholder:text-[15px]" />
              </div>
            </div>

            {/* 상세 약관 동의 */}
            <div className="pl-1 space-y-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={agreements.age} onChange={(e) => setAgreements({...agreements, age: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                <span className="text-xs text-slate-600">[필수] 만 14세 이상 이용자입니다.</span>
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreements.terms} onChange={(e) => setAgreements({...agreements, terms: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  <span className="text-xs text-slate-600">[필수] 예스케어 서비스 이용약관 동의</span>
                </label>
                <Link href="/terms" target="_blank" className="text-xs text-blue-600 underline hover:text-blue-800 font-medium">보기</Link>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreements.privacy} onChange={(e) => setAgreements({...agreements, privacy: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  <span className="text-xs text-slate-600">[필수] 개인정보 수집 및 이용 동의</span>
                </label>
                <Link href="/privacy" target="_blank" className="text-xs text-blue-600 underline hover:text-blue-800 font-medium">보기</Link>
              </div>
            </div>
            {/* 에러 메시지 UI*/}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 mt-4 animate-in fade-in zoom-in-95">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-bold text-red-600">{errorMessage}</p>
              </div>
            )}
            <button type="submit" className="w-full bg-blue-950 text-white text-lg font-bold py-4.5 rounded-2xl shadow-xl hover:bg-blue-900 transition-all mt-4 active:scale-[0.98]">
              가입 완료하기
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}