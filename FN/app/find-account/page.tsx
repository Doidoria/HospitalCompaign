'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, CheckCircle, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/src/api/index';
import { YesAlert, Toast } from '@/src/utils/alert';

function FindAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') === 'pw' ? 'pw' : 'id';
  
  const [activeTab, setActiveTab] = useState<'id' | 'pw'>(initialTab);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [foundId, setFoundId] = useState<string | null>(null);

  const [pwEmail, setPwEmail] = useState('');
  const [pwPhone, setPwPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSmsSent, setIsSmsSent] = useState(false);
  const [isSmsVerified, setIsSmsVerified] = useState(false);
  const [isPasswordResetSuccess, setIsPasswordResetSuccess] = useState(false);

  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 1. 아이디 찾기 실행
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizedPhone = phone.replace(/[^0-9]/g, '');
      const response = await authApi.findId({ name, phoneNumber: normalizedPhone });
      
      const { maskedEmail, provider } = response.data;
      setFoundId(maskedEmail); 
      
      if (provider === 'KAKAO') {
        YesAlert.fire('카카오 연동 계정', '카카오 연동으로 가입된 계정입니다. 아래 로그인 버튼을 눌러 카카오 로그인을 이용해주세요.', 'info');
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.data?.message || error?.response?.data?.message || '입력하신 정보와 일치하는 계정이 없습니다.';
      YesAlert.fire('조회 실패', errorMsg, 'error');
    }
  };

  // 2. 비밀번호 찾기 (SMS 인증요청)
  const handleSendSms = async () => {
    if (!pwEmail || !pwPhone) {
      Toast.fire({ icon: 'warning', title: '이메일과 휴대폰 번호를 모두 입력해주세요.' });
      return;
    }
    if (timer > 0) return;

    try {
      const normalizedPhone = pwPhone.replace(/[^0-9]/g, '');
      await authApi.requestPasswordResetSms({ email: pwEmail, phone: normalizedPhone });
      
      setIsSmsSent(true);
      setTimer(30);
      Toast.fire({ icon: 'success', title: '인증번호가 발송되었습니다.' });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.data?.message || error?.response?.data?.message || '카카오 연동으로 가입된 계정입니다. 카카오 로그인을 이용해주세요.';
      
      YesAlert.fire('안내', errorMsg, 'warning');
    }
  };

  // 3. 인증번호 확인
  const handleVerifySms = async () => {
    if (!smsCode) {
      Toast.fire({ icon: 'warning', title: '인증번호를 입력해주세요.' });
      return;
    }
    try {
      const normalizedPhone = pwPhone.replace(/[^0-9]/g, '');
      await authApi.verifySms(normalizedPhone, smsCode);
      
      setIsSmsVerified(true);
      YesAlert.fire('인증 성공', '새로운 비밀번호를 설정해주세요.', 'success');
    } catch (error) {
      YesAlert.fire('인증 실패', '인증번호가 일치하지 않습니다.', 'error');
    }
  };

  // 4. 비밀번호 재설정
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Toast.fire({ icon: 'error', title: '비밀번호가 서로 일치하지 않습니다.' });
      return;
    }
    try {
      const normalizedPhone = pwPhone.replace(/[^0-9]/g, '');
      await authApi.resetPassword({ email: pwEmail, phone: normalizedPhone, code: smsCode, newPassword });
      setIsPasswordResetSuccess(true);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.data?.message || error?.response?.data?.message || '입력하신 정보와 일치하는 계정이 없거나 인증번호가 틀렸습니다.';
      
      YesAlert.fire('안내', errorMsg, 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <main className="flex-1 flex flex-col items-center px-6 pt-10 lg:pt-32 pb-12">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
          
          {/* 상단 탭 */}
          <div className="flex text-center font-bold text-lg border-b border-gray-100">
            <button onClick={() => { setActiveTab('id'); setFoundId(null); }} className={`flex-1 py-4 transition-colors ${activeTab === 'id' ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-900' : 'text-gray-400 hover:bg-gray-50'}`}>
              아이디 찾기
            </button>
            <button onClick={() => setActiveTab('pw')} className={`flex-1 py-4 transition-colors ${activeTab === 'pw' ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-900' : 'text-gray-400 hover:bg-gray-50'}`}>
              비밀번호 찾기
            </button>
          </div>

          <div className="p-8">
            {/* 아이디 찾기 탭 */}
            {activeTab === 'id' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {foundId ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-blue-950 mb-2">아이디 조회 결과</h3>
                    <p className="text-gray-500 mb-6 text-sm">고객님의 가입 이메일 계정입니다.</p>
                    <div className="bg-gray-50 py-4 px-6 rounded-2xl text-xl font-extrabold text-blue-900 mb-8 border border-gray-100 tracking-wide">
                      {foundId}
                    </div>
                    <button onClick={() => router.push('/login')} className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-950 transition-colors">
                      로그인하러 가기
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFindId} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><User className="w-5 h-5 text-gray-400" /></div>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="가입하신 이름" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">휴대폰 번호</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="w-5 h-5 text-gray-400" /></div>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="숫자만 입력" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-900 text-white text-lg font-bold py-4 rounded-xl shadow-md mt-6 hover:bg-blue-950 transition-colors">
                      아이디 찾기
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* 비밀번호 찾기 탭 */}
            {activeTab === 'pw' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isPasswordResetSuccess ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-blue-950 mb-2">변경 완료</h3>
                    <p className="text-gray-500 mb-8 text-sm">비밀번호가 성공적으로 변경되었습니다.<br/>새로운 비밀번호로 로그인해주세요.</p>
                    <button onClick={() => router.push('/login')} className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-950 transition-colors">
                      로그인하러 가기
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">아이디(이메일)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Mail className="w-5 h-5 text-gray-400" /></div>
                        <input type="email" value={pwEmail} onChange={(e) => setPwEmail(e.target.value)} disabled={isSmsVerified} placeholder="가입하신 이메일 주소" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">휴대폰 번호</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="w-5 h-5 text-gray-400" /></div>
                          <input type="tel" value={pwPhone} onChange={(e) => setPwPhone(e.target.value)} disabled={isSmsVerified} placeholder="숫자만 입력" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400" required />
                        </div>
                        <button type="button" onClick={handleSendSms} disabled={isSmsVerified || timer > 0} className="px-4 py-3 bg-gray-800 text-white font-semibold text-sm rounded-xl hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:text-gray-500 whitespace-nowrap min-w-[90px]">
                          {timer > 0 ? `재발송(${formatTime(timer)})` : isSmsSent ? '재발송' : '인증요청'}
                        </button>
                      </div>
                    </div>

                    {isSmsSent && !isSmsVerified && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }} className="overflow-hidden p-0.5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">인증번호</label>
                        <div className="flex gap-2">
                          <input type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} placeholder="6자리 숫자 입력" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono tracking-widest" maxLength={6} />
                          <button type="button" onClick={handleVerifySms} className="px-5 py-3 bg-blue-900 text-white font-semibold text-sm rounded-xl hover:bg-blue-950 transition-colors">확인</button>
                        </div>
                      </motion.div>
                    )}

                    {isSmsVerified && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4 border-t border-dashed border-gray-200 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-emerald-700 mb-2">새 비밀번호 입력</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Lock className="w-5 h-5 text-gray-400" /></div>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호 (8자 이상)" className="w-full pl-11 pr-4 py-3 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-emerald-700 mb-2">새 비밀번호 확인</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Lock className="w-5 h-5 text-gray-400" /></div>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="비밀번호 다시 입력" className="w-full pl-11 pr-4 py-3 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                          </div>
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 text-white text-lg font-bold py-4 rounded-xl shadow-md mt-6 hover:bg-emerald-700 transition-colors">
                          비밀번호 변경하기
                        </button>
                      </motion.div>
                    )}

                    {!isSmsSent && (
                      <div className="flex items-start gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-500 leading-relaxed mt-4">
                        <ShieldAlert className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p>안전한 개인정보 보호를 위해 회원가입 시 등록한 이메일 계정과 휴대폰 번호 인증이 필요합니다.</p>
                      </div>
                    )}
                  </form>
                )}
              </motion.div>
            )}

            <div className="mt-8 text-center text-sm text-gray-500 font-medium">
              기억이 나셨나요? <span onClick={() => router.push('/login')} className="text-blue-600 font-bold hover:underline cursor-pointer ml-1">로그인하기</span>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function FindAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">로딩 중...</div>}>
      <FindAccountContent />
    </Suspense>
  );
}