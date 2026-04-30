'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, User, Stethoscope, Clock, CheckCircle2, AlertTriangle, FileEdit, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { reservationApi, reportApi } from '@/src/api/index';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function ReportWritePage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [targetReservation, setTargetReservation] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    department: '',
    doctorOpinion: '',
    prescription: '',
    nextSchedule: '',
    patientCondition: 'good',
    managerComment: ''
  });

  // 1. 작성할 예약 원본 데이터 불러오기
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await reservationApi.getDetail(params.id as string);
        setTargetReservation(res.data);
      } catch (error) {
        Swal.fire({ icon: 'error', title: '오류', text: '예약 정보를 불러올 수 없습니다.' });
        router.push('/manager/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchReservation();
  }, [params.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportRef.current) return;
    if (!formData.department || !formData.doctorOpinion || !formData.prescription || !formData.managerComment) {
      Swal.fire({ icon: 'warning', title: '입력 확인', text: '필수 항목을 모두 입력해 주세요.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const { toPng } = await import('html-to-image');
      const { default: jsPDF } = await import('jspdf');

      const imgData = await toPng(reportRef.current, { cacheBust: true, style: { transform: 'scale(1)' } });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (reportRef.current.offsetHeight * pdfWidth) / reportRef.current.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');

      // 2. 백엔드 전송용 FormData 조립 (정석 방식)
      const payload = new FormData();
      const requestData = {
        reservationId: Number(params.id),
        department: formData.department,
        doctorOpinion: formData.doctorOpinion,
        prescription: formData.prescription,
        nextSchedule: formData.nextSchedule,
        managerComment: formData.managerComment,
        patientCondition: formData.patientCondition,
      };
      
      payload.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
      payload.append('pdfFile', pdfBlob, `케어리포트_${params.id}.pdf`);

      // 3. 백엔드 API 전송
      const res = await reportApi.createWithPdf(payload);

      if (res.status === 200 || res.status === 201) {
        Swal.fire({ icon: 'success', title: '리포트 작성 완료', text: '보호자에게 알림이 전송되었습니다.' });
        router.push('/manager/dashboard');
      }

    } catch (error) {
      console.error('리포트 제출 에러:', error);
      Swal.fire({ icon: 'error', title: '제출 실패', text: '서버 오류가 발생했습니다. 다시 시도해 주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  if (loading || !targetReservation) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      <motion.main className="max-w-2xl mx-auto px-4 pt-6" initial="hidden" animate="visible" variants={pageVariants}>
        
        {/* 상단 대상자 정보 요약 */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 mb-6 border border-emerald-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-lg">
              작성 대상 (예약번호: #{targetReservation.id})
            </div>
            <div className="text-sm text-gray-400">
              {new Date(targetReservation.reservationTime).toLocaleDateString('ko-KR')}
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-800">{targetReservation.patientName} 님</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
            <Stethoscope className="w-4 h-4" />
            {targetReservation.hospitalName}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-28">
          <div ref={reportRef} className="space-y-5 bg-gray-50 pb-4">
            
            {/* 1. 당일 환자 컨디션 (터치 피드백 & 탭 애니메이션 강화) */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg"><User className="w-4 h-4 text-blue-500" /></div>
                당일 환자 컨디션
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'good', label: '좋음', emoji: '😊', color: 'blue' },
                  { id: 'normal', label: '보통', emoji: '😐', color: 'gray' },
                  { id: 'bad', label: '저하', emoji: '😥', color: 'red' }
                ].map((item) => (
                  <motion.label 
                    key={item.id} 
                    whileTap={{ scale: 0.95 }} // 터치 시 살짝 눌리는 애니메이션
                    className={`relative flex flex-col items-center justify-center py-4 rounded-2xl cursor-pointer transition-all duration-200 border-2
                      ${formData.patientCondition === item.id 
                        ? `bg-${item.color}-50 border-${item.color}-500 shadow-sm` 
                        : 'border-gray-100 bg-white hover:bg-gray-50 text-gray-400'}`}
                  >
                    <input type="radio" name="patientCondition" value={item.id} checked={formData.patientCondition === item.id} onChange={handleChange} className="hidden" />
                    <span className="text-2xl mb-1">{item.emoji}</span>
                    <span className={`text-sm font-bold ${formData.patientCondition === item.id ? `text-${item.color}-700` : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                  </motion.label>
                ))}
              </div>
            </motion.div>

            {/* 2. 진료 요약 및 처방 (iOS 자동 확대 방지 & 포커스 디자인) */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg"><Stethoscope className="w-4 h-4 text-emerald-500" /></div>
                  진료 요약 <span className="text-red-500 text-xs">*</span>
                </label>
                {/* 🌟 모바일 핵심: text-base(16px)를 적용해야 아이폰에서 입력 시 화면이 강제로 확대되지 않습니다. */}
                <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="진료 과목 (예: 신경과, 정형외과)" 
                  className="w-full px-4 py-3.5 mb-3 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-base text-gray-800 placeholder:text-gray-400 outline-none" required />
                <textarea name="doctorOpinion" rows={3} value={formData.doctorOpinion} onChange={handleChange} placeholder="의사 선생님의 주요 소견이나 당부 말씀을 기록해 주세요." 
                  className="w-full px-4 py-3.5 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-base text-gray-800 placeholder:text-gray-400 outline-none resize-none" required></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">처방 및 복약 안내</label>
                  <textarea name="prescription" rows={2} value={formData.prescription} onChange={handleChange} placeholder="예) 기존 약 유지, 위장약 1주분 추가" 
                    className="w-full px-4 py-3.5 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-base text-gray-800 placeholder:text-gray-400 outline-none resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> 다음 예약 일정</label>
                  <input type="text" name="nextSchedule" value={formData.nextSchedule} onChange={handleChange} placeholder="예) 5/15(금) 오전 11시" 
                    className="w-full px-4 py-3.5 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all text-base text-gray-800 placeholder:text-gray-400 outline-none" />
                </div>
              </div>
            </motion.div>

            {/* 3. 매니저 코멘트 */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                <div className="p-1.5 bg-purple-50 rounded-lg"><FileEdit className="w-4 h-4 text-purple-500" /></div>
                매니저 동행 코멘트 <span className="text-red-500 text-xs">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-4">이동 시 특이사항이나 보호자에게 전하고 싶은 따뜻한 말을 남겨주세요.</p>
              <textarea name="managerComment" rows={4} value={formData.managerComment} onChange={handleChange} placeholder="예) 아버님께서 병원 이동하시는 내내 컨디션이 좋으셨습니다." 
                className="w-full px-4 py-3.5 rounded-2xl border-0 ring-1 ring-purple-100 bg-purple-50/30 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all text-base text-gray-800 placeholder:text-gray-400 outline-none resize-none" required></textarea>
            </motion.div>
          </div>

          {/* 🌟 4. 하단 고정(Sticky) 전송 버튼: 모바일에서 스크롤을 내려도 항상 버튼이 보이도록 고정합니다. */}
          <motion.div variants={itemVariants} 
            className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe z-40 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <button type="submit" disabled={isSubmitting} 
                className="w-full bg-emerald-600 text-white text-lg font-bold py-4 rounded-2xl shadow-emerald-600/20 shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                {isSubmitting ? '전송 중...' : '보호자에게 전송하기'}
              </button>
            </div>
          </motion.div>
        </form>
      </motion.main>
    </div>
  );
}