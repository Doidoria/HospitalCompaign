'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, User, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ApplyPage() {
  // 향후 백엔드(Spring Boot) API 연동을 위한 상태 관리 뼈대
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    hospitalName: '',
    patientName: '',
    patientPhone: '',
    guardianName: '',
    guardianPhone: '',
    memo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 전송 로직 구현
    console.log('제출된 데이터:', formData);
    alert('동행 신청이 완료되었습니다. 매니저 매칭 후 연락드리겠습니다.');
  };

  // 페이지 진입 애니메이션
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* 상단 네비게이션바 (간소화 버전) */}
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

      <motion.main 
        className="max-w-3xl mx-auto px-6 pt-12"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
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
                <input 
                  type="date" 
                  name="date"
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">방문 시간 (예: 오전 10시)</label>
                <input 
                  type="time" 
                  name="time"
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> 방문할 병원명
                </label>
                <input 
                  type="text" 
                  name="hospitalName"
                  placeholder="예) 서울대학교병원 본원"
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required 
                />
              </div>
            </div>
          </div>

          {/* 섹션 2: 이용자(환자) 및 보호자 정보 */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-700">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">2. 기본 정보</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              {/* 이용자 정보 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">실제 이용자(환자) 성함</label>
                <input 
                  type="text" name="patientName" placeholder="홍길동" onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이용자 연락처</label>
                <input 
                  type="tel" name="patientPhone" placeholder="010-0000-0000" onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              
              <div className="md:col-span-2 my-2 border-t border-dashed border-gray-200"></div>

              {/* 보호자 정보 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">보호자 성함 (신청자)</label>
                <input 
                  type="text" name="guardianName" placeholder="김보호" onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">보호자 연락처</label>
                <input 
                  type="tel" name="guardianPhone" placeholder="010-0000-0000" onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" required 
                />
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
                매니저가 미리 알아야 할 사항을 적어주세요. (휠체어 이용 여부, 특정 질환 등)
              </label>
              <textarea 
                name="memo"
                rows={4}
                placeholder="예) 치매 초기 증상이 있으십니다. 거동이 불편하여 휠체어 이동 도움이 필요합니다."
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              ></textarea>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="pt-6">
            <button 
              type="submit" 
              className="w-full bg-blue-950 text-white text-xl font-bold py-5 rounded-2xl shadow-lg hover:bg-blue-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>동행 신청 완료하기</span>
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              신청 완료 후 카카오톡 알림톡으로 진행 상황을 안내해 드립니다.
            </p>
          </div>

        </form>
      </motion.main>
    </div>
  );
}