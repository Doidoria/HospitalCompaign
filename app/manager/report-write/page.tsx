'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, User, Stethoscope, Clock, CheckCircle2, AlertTriangle, FileEdit } from 'lucide-react';
import Link from 'next/link';

export default function ReportWritePage() {
  // 실제 연동 시에는 이전 화면에서 예약 ID를 넘겨받아 해당 예약 정보를 로드합니다.
  const targetReservation = {
    patientName: '김부모',
    hospital: '서울대학교병원 본원 신경과',
    date: '2026. 04. 08 (수)'
  };

  const [formData, setFormData] = useState({
    doctorOpinion: '',
    prescription: '',
    nextSchedule: '',
    patientCondition: 'good', // 'good' | 'normal' | 'bad'
    managerComment: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorOpinion || !formData.managerComment) {
      alert('진료 요약과 매니저 코멘트는 필수 입력 항목입니다.');
      return;
    }
    
    // TODO: 백엔드 API로 리포트 데이터 전송 (POST /api/reports)
    console.log('작성된 리포트 데이터:', formData);
    
    // 보호자에게 알림톡이 전송된다는 확인 메시지
    const confirmSend = window.confirm('리포트 작성을 완료하시겠습니까?\n완료 시 보호자의 카카오톡으로 결과가 즉시 전송됩니다.');
    if (confirmSend) {
      alert('케어 리포트가 성공적으로 전송되었습니다.');
      // 전송 성공 후 매니저 대시보드로 이동 (추후 구현)
      // router.push('/manager/dashboard');
    }
  };

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* 모바일 최적화 헤더 */}
      <header className="bg-emerald-600 text-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/manager" className="flex items-center text-emerald-50 hover:text-white transition-colors p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <FileEdit className="w-4 h-4" />
            리포트 작성
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <motion.main 
        className="max-w-2xl mx-auto px-4 pt-6"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        {/* 상단 대상자 정보 요약 */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 mb-6 border border-emerald-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-lg">
              작성 대상
            </div>
            <div className="text-sm text-gray-400">{targetReservation.date}</div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-800">{targetReservation.patientName} 님</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
            <Stethoscope className="w-4 h-4" />
            {targetReservation.hospital}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 1. 당일 환자 컨디션 (선택형) */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
             <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              당일 환자 컨디션
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['good', 'normal', 'bad'].map((condition) => (
                <label 
                  key={condition} 
                  className={`flex flex-col items-center justify-center py-3 border rounded-xl cursor-pointer transition-all
                    ${formData.patientCondition === condition 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' 
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  <input 
                    type="radio" 
                    name="patientCondition" 
                    value={condition} 
                    checked={formData.patientCondition === condition}
                    onChange={handleChange}
                    className="hidden" 
                  />
                  <span>
                    {condition === 'good' ? '좋음 😊' : condition === 'normal' ? '보통 😐' : '저하 😥'}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>

          {/* 2. 진료 요약 및 의사 소견 */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-500" />
              진료 요약 및 의사 소견 <span className="text-red-500 text-xs">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">의사 선생님의 주요 소견이나 당부 말씀을 기록해 주세요.</p>
            <textarea 
              name="doctorOpinion"
              rows={4}
              value={formData.doctorOpinion}
              onChange={handleChange}
              placeholder="예) 혈압은 안정적이나, 최근 어지럼증 증상이 있어 주 3회 30분 산책 권장하심."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-gray-50"
              required
            ></textarea>
          </motion.div>

          {/* 3. 복약 안내 & 다음 일정 */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-2">처방 및 복약 안내</label>
              <textarea 
                name="prescription"
                rows={2}
                value={formData.prescription}
                onChange={handleChange}
                placeholder="예) 기존 약 유지, 위장약 1주분 추가"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-gray-50"
              ></textarea>
            </div>

            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-500" /> 다음 예약 일정
              </label>
              <input 
                type="text"
                name="nextSchedule"
                value={formData.nextSchedule}
                onChange={handleChange}
                placeholder="예) 5/15(금) 오전 11시 (MRI)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
              />
            </div>
          </motion.div>

          {/* 4. 매니저 코멘트 */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-purple-500" />
              매니저 동행 코멘트 <span className="text-red-500 text-xs">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">이동 시 특이사항이나 보호자에게 전하고 싶은 따뜻한 말을 남겨주세요.</p>
            <textarea 
              name="managerComment"
              rows={4}
              value={formData.managerComment}
              onChange={handleChange}
              placeholder="예) 아버님께서 병원 이동하시는 내내 컨디션이 좋으셨습니다. 대기 시간이 길었지만 편안하게 기다리셨어요."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-purple-50/50"
              required
            ></textarea>
          </motion.div>

          {/* 주의사항 및 제출 */}
          <motion.div variants={itemVariants} className="pt-4">
            <div className="flex items-start gap-2 mb-6 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed break-keep">
                작성 완료 시 <strong>보호자의 카카오톡으로 즉시 전송</strong>되며, 이후 수정이 불가능할 수 있으니 오탈자 및 내용을 다시 한번 확인해 주세요.
              </p>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-600 text-white text-lg font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              보호자에게 전송하기
            </button>
          </motion.div>

        </form>
      </motion.main>
    </div>
  );
}