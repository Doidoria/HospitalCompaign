'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, User, Phone, MapPin, CheckCircle2, Search, Users, HeartPulse, ShieldCheck, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { authApi } from '@/src/api/index';

export default function MyInfoEditPage() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false); // 진입 비밀번호 통과 여부
  const [password, setPassword] = useState('');
  
  const [isOpenPost, setIsOpenPost] = useState(false);
  
  // 🌟 모든 회원 정보 보관함
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    zipCode: '',
    address: '',
    detailAddress: '',
    guardianName: '',
    emergencyContact: ''
  });

  // 📱 휴대폰 인증 관련 상태 추가
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  
  // 🔐 비밀번호 변경 관련 상태 추가
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 🌟 비밀번호 정규식 (8자 이상, 영문, 숫자, 특수문자 포함)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  // 인증 성공 시 내 정보 불러오기
  useEffect(() => {
    if (isVerified) {
      authApi.getMe().then(res => {
        setFormData({
          name: res.data.name || '',
          phoneNumber: res.data.phoneNumber || '',
          zipCode: res.data.zipCode || '',
          address: res.data.address || '',
          detailAddress: res.data.detailAddress || '',
          guardianName: res.data.guardianName || '',
          emergencyContact: res.data.emergencyContact || ''
        });
      }).catch(() => Swal.fire('오류', '내 정보를 불러올 수 없습니다.', 'error'));
    }
  }, [isVerified]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return Swal.fire('알림', '비밀번호를 입력해주세요.', 'warning');
    
    try {
      await authApi.verifyPassword(password);
      setIsVerified(true);
    } catch (error) {
      Swal.fire({ icon: 'error', title: '인증 실패', text: '비밀번호가 일치하지 않습니다.' });
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.updateMe(formData);
      await Swal.fire({ icon: 'success', title: '수정 완료', text: '모든 정보가 성공적으로 변경되었습니다.', confirmButtonColor: '#1e3a8a' });
      router.push('/mypage');
    } catch (error) {
      Swal.fire('오류', '정보 수정에 실패했습니다.', 'error');
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

  // 🌟 SMS 발송 핸들러
  const handleSendSms = async () => {
    try {
      await authApi.sendSms(formData.phoneNumber);
      setSmsSent(true);
      Swal.fire('발송 완료', '인증번호가 전송되었습니다.', 'success');
    } catch (err) {
      Swal.fire('실패', 'SMS 발송 중 오류가 발생했습니다.', 'error');
    }
  };

  // 🌟 SMS 인증 확인 핸들러
  const handleVerifySms = async () => {
    try {
      await authApi.verifySms(formData.phoneNumber, smsCode);
      setIsPhoneVerified(true);
      Swal.fire('인증 성공', '이제 비밀번호를 변경할 수 있습니다.', 'success');
    } catch (err) {
      Swal.fire('인증 실패', '인증번호가 올바르지 않습니다.', 'error');
    }
  };

  // 🌟 비밀번호 변경 핸들러
  const handlePasswordChange = async () => {
    if (!passwordRegex.test(newPassword)) {
      return Swal.fire('알림', '비밀번호 형식이 올바르지 않습니다.', 'warning');
    }
    if (newPassword !== confirmPassword) {
      return Swal.fire('알림', '비밀번호 확인이 일치하지 않습니다.', 'warning');
    }

    try {
      // api/index.ts에 만들어둔 changePassword 호출
      await authApi.changePassword(newPassword);
      Swal.fire('변경 완료', '비밀번호가 성공적으로 변경되었습니다.', 'success');
      setNewPassword(''); setConfirmPassword(''); 
    } catch (err) {
      Swal.fire('오류', '비밀번호 변경에 실패했습니다.', 'error');
    }
  };

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
            {/* 📝 기본 정보 수정 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600"/> 본인 기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">연락처</label>
                    <input type="text" value={formData.phoneNumber} readOnly className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none" />
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
                    <input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="010-0000-0000" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-900 text-white font-bold text-lg py-5 rounded-2xl shadow-lg hover:bg-blue-950 transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> 모든 변경사항 저장하기
              </button>
            </form>

            {/* 🔐 비밀번호 변경 (휴대폰 인증 필수) */}
            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-orange-100 bg-orange-50/10">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-orange-600">
                <ShieldCheck className="w-5 h-5"/> 비밀번호 변경
              </h3>
              
              {!isPhoneVerified ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-2">비밀번호 변경을 위해 휴대폰 본인 인증이 필요합니다.</p>
                  <div className="flex gap-2">
                    <input type="text" value={formData.phoneNumber} readOnly className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-gray-500" />
                    <button type="button" onClick={handleSendSms} className="px-4 py-3 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-colors">
                      {smsSent ? '재발송' : '인증번호 발송'}
                    </button>
                  </div>
                  {smsSent && (
                    <div className="flex gap-2">
                      <input type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} placeholder="인증번호 6자리" className="flex-1 px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button type="button" onClick={handleVerifySms} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                        인증확인
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4"/> 휴대폰 인증이 완료되었습니다.
                  </div>
                  
                  {/* 새 비밀번호 입력 */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">새 비밀번호 (영문+숫자+특수문자 8자 이상)</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className={`w-full px-4 py-3 rounded-xl border outline-none ${newPassword && !passwordRegex.test(newPassword) ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:ring-2 focus:ring-orange-500'}`} 
                      placeholder="새 비밀번호 입력" 
                    />
                    {newPassword && !passwordRegex.test(newPassword) && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> 형식이 맞지 않습니다.</p>}
                  </div>

                  {/* 비밀번호 확인 */}
                  <div>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className={`w-full px-4 py-3 rounded-xl border outline-none ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:ring-2 focus:ring-orange-500'}`} 
                      placeholder="새 비밀번호 확인" 
                    />
                    {confirmPassword && newPassword !== confirmPassword && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> 비밀번호가 일치하지 않습니다.</p>}
                    {confirmPassword && newPassword === confirmPassword && passwordRegex.test(newPassword) && <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 비밀번호가 일치하며 사용 가능합니다.</p>}
                  </div>

                  <button 
                    type="button" 
                    onClick={handlePasswordChange} 
                    disabled={!passwordRegex.test(newPassword) || newPassword !== confirmPassword} 
                    className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-orange-600 transition-colors disabled:bg-gray-300 mt-2"
                  >
                    비밀번호 변경 확정
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}