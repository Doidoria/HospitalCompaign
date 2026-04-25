'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, User, Stethoscope, Clock, CheckCircle2, AlertTriangle, FileEdit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { reservationApi, reportApi } from '@/src/api/index';

export default function ReportWritePage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [targetReservation, setTargetReservation] = useState<any>(null);

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

  // 2. 리포트 저장 및 전송
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.doctorOpinion || !formData.managerComment || !formData.department) {
      Swal.fire({ icon: 'warning', title: '입력 확인', text: '진료 과목, 진료 요약, 매니저 코멘트는 필수입니다.' });
      return;
    }
    
    const isConfirm = window.confirm('리포트 작성을 완료하시겠습니까?\n완료 시 보호자의 카카오톡으로 결과가 즉시 전송됩니다.');
    if (!isConfirm) return;

    try {
      // 🌟 컨디션 텍스트 변환
      const conditionText = formData.patientCondition === 'good' ? '좋음 😊' : formData.patientCondition === 'normal' ? '보통 😐' : '저하 😥';
      const finalComment = `[당일 컨디션: ${conditionText}]\n${formData.managerComment}`;

      // 🌟 백엔드 DTO(ReportRequest)에 맞춘 데이터 조립
      const requestData = {
        reservationId: Number(params.id),
        department: formData.department,
        doctorOpinion: formData.doctorOpinion,
        prescription: formData.prescription,
        managerComment: finalComment,
        nextSchedule: formData.nextSchedule
      };

      await reportApi.create(requestData);

      await Swal.fire({ icon: 'success', title: '전송 완료', text: '케어 리포트가 성공적으로 저장 및 전송되었습니다.' });
      router.push('/admin'); // 작성 완료 후 대시보드로 복귀
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: '저장 실패', text: '서버 오류가 발생했습니다. 다시 시도해주세요.' });
    }
  };

  const pageVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  if (loading || !targetReservation) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      <header className="bg-emerald-600 text-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin" className="flex items-center text-emerald-50 hover:text-white transition-colors p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <FileEdit className="w-4 h-4" />
            리포트 작성
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. 당일 환자 컨디션 */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
             <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              당일 환자 컨디션
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['good', 'normal', 'bad'].map((condition) => (
                <label key={condition} className={`flex flex-col items-center justify-center py-3 border rounded-xl cursor-pointer transition-all ${formData.patientCondition === condition ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <input type="radio" name="patientCondition" value={condition} checked={formData.patientCondition === condition} onChange={handleChange} className="hidden" />
                  <span>{condition === 'good' ? '좋음 😊' : condition === 'normal' ? '보통 😐' : '저하 😥'}</span>
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
            <div className="space-y-3">
              <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="진료 과목 (예: 신경과, 정형외과)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 text-sm" required />
              <textarea name="doctorOpinion" rows={4} value={formData.doctorOpinion} onChange={handleChange} placeholder="의사 선생님의 주요 소견이나 당부 말씀을 기록해 주세요." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-gray-50" required></textarea>
            </div>
          </motion.div>

          {/* 3. 복약 안내 & 다음 일정 */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-2">처방 및 복약 안내</label>
              <textarea name="prescription" rows={2} value={formData.prescription} onChange={handleChange} placeholder="예) 기존 약 유지, 위장약 1주분 추가" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-gray-50"></textarea>
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> 다음 예약 일정</label>
              <input type="text" name="nextSchedule" value={formData.nextSchedule} onChange={handleChange} placeholder="예) 5/15(금) 오전 11시" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50" />
            </div>
          </motion.div>

          {/* 4. 매니저 코멘트 */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-purple-500" />
              매니저 동행 코멘트 <span className="text-red-500 text-xs">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">이동 시 특이사항이나 보호자에게 전하고 싶은 따뜻한 말을 남겨주세요.</p>
            <textarea name="managerComment" rows={4} value={formData.managerComment} onChange={handleChange} placeholder="예) 아버님께서 병원 이동하시는 내내 컨디션이 좋으셨습니다." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-purple-50/50" required></textarea>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-4">
            <div className="flex items-start gap-2 mb-6 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed break-keep">
                작성 완료 시 <strong>보호자의 카카오톡으로 즉시 전송</strong>되며, 이후 수정이 불가능할 수 있으니 내용을 다시 한번 확인해 주세요.
              </p>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white text-lg font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> 보호자에게 전송하기
            </button>
          </motion.div>
        </form>
      </motion.main>
    </div>
  );
}