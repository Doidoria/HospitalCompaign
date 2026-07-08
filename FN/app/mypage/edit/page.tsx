// app/mypage/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, User, Phone, MapPin, CheckCircle2, Search, Users, HeartPulse, ShieldCheck, AlertCircle, UserMinus } from 'lucide-react';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { YesAlert, Toast } from '@/src/utils/alert';
import { authApi } from '@/src/api/index';

export default function MyInfoEditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // 화면 깜빡임 방지용 로딩 상태
  const [isVerified, setIsVerified] = useState(false); // 진입 비밀번호 통과 여부
  const [isKakaoUser, setIsKakaoUser] = useState(false); // 카카오 유저 여부 확인용
  const [password, setPassword] = useState('');
  const [isOpenPost, setIsOpenPost] = useState(false);
  
  // 모든 회원 정보 보관함
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    zipCode: '',
    address: '',
    detailAddress: '',
    guardianName: '',
    guardianPhone: ''
  });

  // 휴대폰 인증 관련 상태
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  
  // 비밀번호 변경 관련 상태
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // SMS 재전송 쿨타임 상태 (30초)
  const [smsTimer, setSmsTimer] = useState(0);

  // 타이머 감소 로직 (1초마다 1씩 감소)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (smsTimer > 0) {
      interval = setInterval(() => {
        setSmsTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [smsTimer]);

  // 비밀번호 정규식 (8자 이상, 영문, 숫자, 특수문자 포함)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  // 페이지 진입 시 무조건 내 정보를 먼저 불러와서 카카오 유저인지 판별
  useEffect(() => {
    let isMounted = true;
    authApi.getMe().then(res => {
      if (!isMounted) return;
      const data = res.data;
      
      // 카카오 유저 판별 (이메일에 kakao가 들어가면)
      const isSocial = data.provider === 'KAKAO';
      
      setIsKakaoUser(isSocial);
      
      // 카카오 유저면 '비밀번호 재확인' 단계를 무조건 패스시킴
      if (isSocial) {
        setIsVerified(true);
      }

      setFormData({
        name: data.name || '',
        phoneNumber: data.phoneNumber === '010-0000-0000' ? '' : (data.phoneNumber || ''), // 가짜 번호면 빈칸으로 설정하여 입력을 유도
        zipCode: data.zipCode || '',
        address: data.address || '',
        detailAddress: data.detailAddress || '',
        guardianName: data.guardianName || '',
        guardianPhone: data.guardianPhone || ''
      });
    }).catch((error: any) => {
      YesAlert.fire('오류', error.message || '내 정보를 불러올 수 없습니다.', 'error');
      router.push('/login');
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return YesAlert.fire('알림', '비밀번호를 입력해주세요.', 'warning');

    try {
      const res = await authApi.verifyPassword(password);
      
      const isMatch = (res.data as any) === true || res.data === 'true';
      
      if (isMatch) {
        setIsVerified(true);
      } else {
        YesAlert.fire({ icon: 'error', title: '인증 실패', text: '비밀번호가 일치하지 않습니다.' });
        setPassword('');
      }
    } catch (error: any) {
      // 400 에러 등으로 던졌을 경우 여기서 잡힘
      YesAlert.fire({ icon: 'error', title: '인증 실패', text: '비밀번호가 일치하지 않습니다.' });
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumber) return YesAlert.fire('알림', '연락처를 입력해주세요.', 'warning');

    try {
      await authApi.updateMe(formData);
      Toast.fire({ icon: 'success', title: '모든 정보가 성공적으로 변경되었습니다.' });
      router.push('/mypage');
    } catch (error: any) {
      YesAlert.fire('오류', error.message || '정보 수정에 실패했습니다.', 'error');
    }
  };

  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    if (data.buildingName) fullAddress += ` (${data.buildingName})`;
    
    setFormData(prev => ({ 
      ...prev, 
      zipCode: data.zonecode,
      address: fullAddress 
    }));
    setIsOpenPost(false);
  };

  // SMS 발송 핸들러
  const handleSendSms = async () => {
    if (smsTimer > 0) return;

    try {
      await authApi.sendSms(formData.phoneNumber);
      setSmsSent(true);
      setSmsTimer(30);
      Toast.fire({ icon: 'success', title: '인증번호가 전송되었습니다.' });
    } catch (err: any) {
      YesAlert.fire('실패', err.message || 'SMS 발송 중 오류가 발생했습니다.', 'error');
    }
  };

  // SMS 인증 확인 핸들러
  const handleVerifySms = async () => {
    try {
      await authApi.verifySms(formData.phoneNumber, smsCode);
      setIsPhoneVerified(true);
      Toast.fire({ icon: 'success', title: '이제 비밀번호를 변경할 수 있습니다.' });
    } catch (err: any) {
      YesAlert.fire('인증 실패', err.message || '인증번호가 올바르지 않습니다.', 'error');
    }
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = async () => {
    if (!passwordRegex.test(newPassword)) {
      return YesAlert.fire('알림', '비밀번호 형식이 올바르지 않습니다.', 'warning');
    }
    if (newPassword !== confirmPassword) {
      return YesAlert.fire('알림', '비밀번호 확인이 일치하지 않습니다.', 'warning');
    }

    try {
      await authApi.changePassword(newPassword);
      Toast.fire({ icon: 'success', title: '비밀번호가 성공적으로 변경되었습니다. 다시 인증해주세요.' });
      
      setNewPassword(''); 
      setConfirmPassword(''); 
      setPassword(''); // 기존 비밀번호 입력값도 초기화
      setIsVerified(false); // 인증 상태를 해제하여 재확인 화면으로 돌려보냄
      setIsPhoneVerified(false);
      setSmsSent(false);
      setSmsCode('');
    } catch (err: any) {
      YesAlert.fire('오류', err.message || '비밀번호 변경에 실패했습니다.', 'error');
    }
  };

  // 회원탈퇴 로직 구현 함수
  const handleWithdrawAccount = async () => {
    // 1차 경고창
    const firstConfirm = await YesAlert.fire({
      title: '정말 탈퇴하시겠습니까?',
      text: '탈퇴 시 기존 병원 동행 예약 내역 확인 및 매니저 리포트 열람이 불가능하며, 모든 혜택이 소멸됩니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '탈퇴 진행',
      cancelButtonText: '취소'
    });

    if (!firstConfirm.isConfirmed) return;

    // 2차 경고창
    const secondConfirm = await YesAlert.fire({
      title: '마지막 확인',
      text: '동행 매니저 배정 단계이거나 진행 중인 예약이 있는 경우 탈퇴 처리가 반려될 수 있습니다. 정말로 탈퇴 처리를 완료할까요?',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '최종 탈퇴',
      cancelButtonText: '돌아가기'
    });

    if (!secondConfirm.isConfirmed) return;

    try {
      if (typeof authApi.withdraw === 'function') {
        await authApi.withdraw();
      } else {
        throw new Error('api/auth.ts 파일에 회원탈퇴(withdraw) API 바인딩 확인이 필요합니다.');
      }

      // 성공 팝업 띄울 때 버튼 설정을 명시적으로 초기화 (오염 방지)
      await YesAlert.fire({
        title: '탈퇴 완료',
        text: '예스케어 서비스를 이용해 주셔서 감사합니다.',
        icon: 'success',
        showCancelButton: false, // 취소 버튼 숨기기
        confirmButtonColor: '#3085d6',
        confirmButtonText: '확인' // 버튼 텍스트 원상복구
      });
      
      // 로컬 스토리지 및 미들웨어 쿠키 완벽 파기
      localStorage.removeItem('accessToken'); 
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      router.push('/login');
      
    } catch (err: any) {
      // 에러 팝업 띄울 때도 버튼 설정을 명시적으로 초기화
      YesAlert.fire({
        title: '탈퇴 실패',
        text: err.message || '진행 중인 동행 내역이 있거나 권한이 없어 탈퇴가 실패했습니다.',
        icon: 'error',
        showCancelButton: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: '확인'
      });
    }
  };

  // 데이터를 불러오기 전까지 빈 화면 처리 (깜빡임 방지)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      {isOpenPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">자택 주소 검색</h3>
              <button onClick={() => setIsOpenPost(false)} className="text-gray-500 font-bold px-2 hover:text-red-500">X</button>
            </div>
            <div className="h-[400px]">
              <DaumPostcodeEmbed onComplete={handleCompletePost} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-6 pt-12">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-2xl font-extrabold text-gray-800">내 정보 상세 수정</h2>
        </div>

        {!isVerified ? (
          <form onSubmit={handleVerify} className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 mt-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">비밀번호 재확인</h3>
              <p className="text-sm text-gray-500 break-keep">회원님의 소중한 정보 보호를 위해<br/>현재 비밀번호를 한 번 더 입력해 주세요.</p>
            </div>
            
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none mb-6 text-center tracking-widest" required />
            <button type="submit" className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-950 transition-colors">확인</button>
          </form>

        ) : (
          <div className="space-y-8">
            <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600"/> 본인 기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
                           readOnly={isKakaoUser}
                           className={`w-full px-4 py-3 rounded-xl border outline-none ${isKakaoUser ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">연락처</label>
                    <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} 
                           placeholder="010-0000-0000"
                           readOnly={!isKakaoUser} // 카카오 유저만 수정 가능 (일반 유저는 SMS 인증 후 자동 입력)
                           className={`w-full px-4 py-3 rounded-xl border outline-none ${!isKakaoUser ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`} required />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500"/> 자택 주소 (동행 출발지)
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input type="text" value={formData.zipCode} readOnly placeholder="우편번호" className="w-32 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none" />
                    <button type="button" onClick={() => setIsOpenPost(true)} className="bg-gray-800 text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors whitespace-nowrap flex items-center">
                      <Search className="w-4 h-4 mr-1" /> 주소 찾기
                    </button>
                  </div>
                  <input type="text" value={formData.address} readOnly placeholder="기본 주소" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none" required />
                  <input type="text" value={formData.detailAddress} onChange={(e) => setFormData({...formData, detailAddress: e.target.value})} placeholder="상세 주소 (동, 호수 등)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-500"/> 보호자 및 비상연락처
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">보호자 이름</label>
                    <input type="text" value={formData.guardianName} onChange={(e) => setFormData({...formData, guardianName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 홍길동 (자녀)" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">비상 연락처</label>
                    <input type="text" value={formData.guardianPhone} onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="010-0000-0000" />
                  </div>
                </div>
              </div>
            </form>

            <button type="submit" form="edit-form" 
              className="w-full bg-blue-900 text-white font-bold text-lg py-5 rounded-2xl shadow-lg hover:bg-blue-950 transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> 모든 변경사항 저장하기
            </button>

            {/* 통합된 본인 인증 및 계정 관리 (비밀번호 변경 + 회원 탈퇴) */}
            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-red-100 bg-red-50/10 mt-8">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-red-600">
                <ShieldCheck className="w-5 h-5"/> 계정 보안 및 탈퇴
              </h3>
              
              {!isPhoneVerified ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">
                    {isKakaoUser ? '회원 탈퇴를 위해 휴대폰 본인 인증이 필요합니다.' : '비밀번호 변경 및 회원 탈퇴를 위해 휴대폰 본인 인증이 필요합니다.'}
                  </p>
                  <div className="flex gap-2">
                    <input type="text" value={formData.phoneNumber} readOnly={!isKakaoUser} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="휴대폰 번호 입력"
                      className={`min-w-0 flex-1 px-3 py-3 rounded-xl border outline-none text-sm ${!isKakaoUser ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500'}`} />
                    <button type="button" onClick={handleSendSms} disabled={smsTimer > 0 || !formData.phoneNumber}
                      className={`shrink-0 px-3.5 py-3 text-white rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        smsTimer > 0 || !formData.phoneNumber ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900'}`}
                      >
                      {smsTimer > 0 ? `재발송 (${smsTimer}초)` : smsSent ? '재발송' : '인증번호 발송'}
                    </button>
                  </div>
                  {smsSent && (
                    <div className="flex gap-2">
                      <input type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} placeholder="인증번호 6자리" 
                        className="min-w-0 flex-1 px-3 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold tracking-widest text-center" />
                      <button type="button" onClick={handleVerifySms} disabled={!smsCode}
                        className="shrink-0 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap disabled:bg-gray-300 transition-colors">
                        인증확인
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5"/> 본인 인증이 완료되었습니다.
                  </div>
                  
                  {/* 일반 유저만 노출되는 비밀번호 변경 폼 */}
                  {!isKakaoUser && (
                    <div className="pt-2 border-t border-red-100/50">
                      <label className="block text-sm font-bold text-gray-700 mb-2">새 비밀번호 (영문+숫자+특수문자 8자 이상)</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border outline-none mb-3 transition-colors ${newPassword && !passwordRegex.test(newPassword) ? 'border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500' : 'border-gray-200 focus:ring-2 focus:ring-orange-500'}`} 
                        placeholder="새 비밀번호 입력" />
                      
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500' : 'border-gray-200 focus:ring-2 focus:ring-orange-500'}`} 
                        placeholder="새 비밀번호 확인" />
                      
                      <button type="button" onClick={handlePasswordChange} disabled={!passwordRegex.test(newPassword) || newPassword !== confirmPassword} 
                        className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-orange-600 transition-colors disabled:bg-gray-300 mt-4">
                        비밀번호 변경 확정
                      </button>
                    </div>
                  )}

                  {/* 공통 탈퇴 버튼 */}
                  <div className="pt-4 border-t border-red-100/50">
                    <button type="button" onClick={handleWithdrawAccount} 
                      className="w-full py-4 rounded-xl font-bold text-white transition-colors bg-red-500 hover:bg-red-600 shadow-md flex items-center justify-center gap-2">
                      <UserMinus className="w-5 h-5"/> 회원 탈퇴하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}