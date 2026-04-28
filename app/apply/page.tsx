'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, User, FileText, ArrowLeft, CheckCircle2, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { reservationApi, authApi } from '../../src/api/index';

export default function ApplyPage() {
  const router = useRouter();
  const [isOpenPost, setIsOpenPost] = useState(false);

  const [formData, setFormData] = useState({
    date: '', time: '', hospitalName: '', patientName: '',
    patientPhone: '', guardianName: '', guardianPhone: '', memo: '', 
    requirements: ''
  });

  // 로그인 체크 및 내 정보 자동 완성
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      Swal.fire({
        icon: 'warning', title: '로그인 필요', text: '동행 신청은 로그인 후 이용해 주세요.'
      }).then(() => router.push('/login'));
      return;
    }

    // 토큰이 있다면 백엔드에서 내 정보를 가져와 보호자 칸에 자동 입력!
    authApi.getMe().then((res) => {
      const rawPhone = res.data.phoneNumber || '';
      let formattedPhone = rawPhone;
      
      // 숫자만 뽑아내서 11자리일 경우 010-XXXX-XXXX 형태로 변환
      const onlyNums = rawPhone.replace(/[^0-9]/g, '');
      if (onlyNums.length === 11) {
        formattedPhone = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
      }

      setFormData(prev => ({
        ...prev,
        guardianName: res.data.name || '',
        guardianPhone: formattedPhone // 🌟 변환된 번호를 넣어줍니다!
      }));
    }).catch(err => console.error('내 정보 불러오기 실패:', err));
  }, [router]);

  const handleSmartChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 전화번호 11자리 자동 하이픈 처리
    if (name === 'patientPhone' || name === 'guardianPhone') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      let formatted = onlyNums;
      if (onlyNums.length > 3 && onlyNums.length <= 7) {
        formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
      } else if (onlyNums.length > 7) {
        formatted = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } 
    // 날짜, 시간, 기타 텍스트는 브라우저 기본 기능에 맡김
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 🌟 주소 검색 완료 시 병원명에 자동 입력
  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    if (data.buildingName) fullAddress += ` (${data.buildingName})`;
    
    setFormData(prev => ({ ...prev, hospitalName: fullAddress }));
    setIsOpenPost(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.patientPhone.length !== 13) {
      Swal.fire({ icon: 'warning', title: '입력 오류', text: '환자 연락처 11자리를 정확히 입력해주세요.' });
      return;
    }
    if (formData.guardianPhone && formData.guardianPhone.length !== 13) {
      Swal.fire({ icon: 'warning', title: '입력 오류', text: '보호자 연락처 11자리를 정확히 입력해주세요.' });
      return;
    }
    if (!formData.date || !formData.time) {
      Swal.fire({ icon: 'warning', title: '입력 오류', text: '날짜와 시간을 정확히 입력하거나 선택해주세요.' });
      return;
    }

    try {
      const formattedTime = `${formData.date}T${formData.time}:00`;
      
      const requestData = {
        patientName: formData.patientName.trim(),
        patientPhone: formData.patientPhone.trim(),
        hospitalName: formData.hospitalName.trim(),
        reservationTime: formattedTime,
        guardianName: formData.guardianName.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        memo: formData.memo,
        requirements: formData.requirements
      };

      // API 통신
      await reservationApi.create(requestData);

      await Swal.fire({
        icon: 'success', title: '신청 완료!', text: '매니저 매칭 후 연락드리겠습니다.',
        confirmButtonColor: '#1e3a8a'
      });
      router.push('/mypage');

    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: '신청 실패', text: '입력 정보를 다시 확인해 주세요.' });
    }
  };

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 relative">
      
      {/* 🌟 주소 검색 팝업 (모달) */}
      {isOpenPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">병원 주소 검색</h3>
              <button onClick={() => setIsOpenPost(false)} className="text-gray-500 font-bold px-2">X</button>
            </div>
            <div className="h-[400px]">
              <DaumPostcodeEmbed onComplete={handleCompletePost} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="hidden md:inline font-medium">뒤로 가기</span>
          </Link>
          <h1 className="font-bold text-lg md:text-xl text-blue-950">예스케어 동행 신청</h1>
          <div className="w-10 md:w-20"></div>
        </div>
      </header>

      <motion.main className="max-w-3xl mx-auto px-6 pt-12" initial="hidden" animate="visible" variants={pageVariants}>
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-3">서비스 신청서 작성</h2>
          <p className="text-gray-500 break-keep">정확한 매칭과 안전한 동행을 위해 아래 정보를 입력해 주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 섹션 1: 일정 및 장소 */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">1. 일정 및 장소</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">희망 날짜</label>
                <input type="date" name="date" onChange={handleSmartChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">방문 시간 (예: 오전 10시)</label>
                <input type="time" name="time" onChange={handleSmartChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>

              {/* 🌟 방문할 병원명 (주소 검색창 적용) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> 방문할 병원 주소 및 명칭
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" name="hospitalName" value={formData.hospitalName} readOnly
                    placeholder="우측 검색 버튼을 눌러 병원 주소를 찾아주세요" 
                    onClick={() => setIsOpenPost(true)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none cursor-pointer" required 
                  />
                  <button 
                    type="button" onClick={() => setIsOpenPost(true)}
                    className="bg-gray-800 text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center whitespace-nowrap"
                  >
                    <Search className="w-4 h-4 md:mr-1.5" /> <span className="hidden md:inline">검색</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 섹션 2: 기본 정보 */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-700">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">2. 기본 정보</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">실제 이용자(환자) 성함</label>
                <input type="text" name="patientName" placeholder="홍길동" onChange={handleSmartChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이용자 연락처</label>
                <input type="text" name="patientPhone" placeholder="010-0000-0000" onChange={handleSmartChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="md:col-span-2 my-2 border-t border-dashed border-gray-200"></div>

              {/* 🌟 자동 완성된 보호자 정보 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">보호자 성함 (신청자)</label>
                <input type="text" name="guardianName" value={formData.guardianName} onChange={handleSmartChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">보호자 연락처</label>
                <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleSmartChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30" required />
              </div>
            </div>
          </div>

          {/* 섹션 3: 추가 요청 사항 */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">3. 특이사항 및 요청사항</h3>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                매니저가 미리 알아야 할 사항이나 요청사항을 적어주세요.
              </label>
              <textarea 
                name="requirements" 
                rows={4} 
                placeholder="예) 치매 초기 증상이 있으십니다. 휠체어 이용 도움이 필요합니다." 
                onChange={handleSmartChange} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" className="w-full bg-blue-950 text-white text-xl font-bold py-5 rounded-2xl shadow-lg hover:bg-blue-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span>동행 신청 완료하기</span>
            </button>
          </div>

        </form>
      </motion.main>
    </div>
  );
}