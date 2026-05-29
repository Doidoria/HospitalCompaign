// app/manager/report/[id]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { User, Stethoscope, Clock, CheckCircle2, FileEdit, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { reservationApi, reportApi } from '@/src/api/index';
import { Toast, YesAlert, MySwal } from '@/src/utils/alert';

export default function ReportWritePage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [targetReservation, setTargetReservation] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [noNextSchedule, setNoNextSchedule] = useState(false); 
  const [existingReportId, setExistingReportId] = useState<number | null>(null);
  const [isModified, setIsModified] = useState(false);

  const HOURS = Array.from({ length: 10 }, (_, i) => String(i + 9).padStart(2, '0'));
  const MINUTES = ['00', '10', '20', '30', '40', '50'];

  const [formData, setFormData] = useState({
    department: '',
    doctorOpinion: '',
    prescription: '',
    nextSchedule: '',
    nextDate: '',
    nextTime: '',
    patientCondition: 'good',
    managerComment: ''
  });

  // 작성할 예약 원본 데이터 불러오기
  useEffect(() => {
    const fetchReservationAndReport = async () => {
      try {
        // 1) 예약 정보 불러오기
        const res = await reservationApi.getDetail(params.id as string);
        setTargetReservation(res.data);

        try {
          // 백엔드에 만들어둔 리포트 조회 API 호출 (예: reportApi.getReportByReservationId)
          const reportRes = await reportApi.getReportByReservationId(params.id as string);
          
          if (reportRes.data) {
            setExistingReportId(reportRes.data.id); // 기존 리포트 번호 저장
            setIsModified(reportRes.data.isModified);

            const fetchedNextSchedule = reportRes.data.nextSchedule || '';
            const [splitDate, splitTime] = fetchedNextSchedule ? fetchedNextSchedule.split('T') : ['', ''];
            
            // 3) 기존 데이터로 폼 덮어쓰기
            setFormData({
              department: reportRes.data.department || '',
              doctorOpinion: reportRes.data.doctorOpinion || '',
              prescription: reportRes.data.prescription || '',
              nextSchedule: fetchedNextSchedule,
              nextDate: splitDate,
              nextTime: splitTime ? splitTime.substring(0, 5) : '', // '14:30' 형태로 자르기
              patientCondition: reportRes.data.patientCondition || 'good',
              managerComment: reportRes.data.managerComment || ''
            });

            // 다음 일정 없음 체크박스 연동
            if (reportRes.data.noNextSchedule || reportRes.data.nextSchedule === '') {
              setNoNextSchedule(true);
            }
          }
        } catch (e) {
          console.log("기존 리포트 없음 (신규 작성 모드)");
        }

      } catch (error) {
        MySwal.fire({ icon: 'error', title: '오류', text: '예약 정보를 불러올 수 없습니다.' });
        router.push('/manager/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchReservationAndReport();
  }, [params.id, router]);

  // 컴포넌트 마운트 시 임시 저장된 리포트 데이터 불러오기
  useEffect(() => {
    const savedDraft = localStorage.getItem(`draft_care_report_${params.id}`);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        if (parsedDraft.nextSchedule === '') {
          setNoNextSchedule(true);
        }
      } catch (error) {
        console.error('임시 저장 데이터 파싱 오류:', error);
      }
    }
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, tagName } = e.target;

    if (tagName.toLowerCase() === 'textarea') {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }

    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      localStorage.setItem(`draft_care_report_${params.id}`, JSON.stringify(updatedData));
      return updatedData;
    });
  };

  // 시간 선택 핸들러
  const handleTimeSelect = (type: 'hour' | 'minute', value: string) => {
    const currentHour = formData.nextTime ? formData.nextTime.split(':')[0] : '09';
    const currentMinute = formData.nextTime ? formData.nextTime.split(':')[1] : '00';

    let newHour = type === 'hour' ? value : currentHour;
    let newMinute = type === 'minute' ? value : currentMinute;

    if (newHour === '18') newMinute = '00'; // 18시 이후 분 선택 방지

    setFormData(prev => {
      const updatedData = { ...prev, nextTime: `${newHour}:${newMinute}` };
      localStorage.setItem(`draft_care_report_${params.id}`, JSON.stringify(updatedData));
      return updatedData;
    });
  };

  const handleNoNextScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setNoNextSchedule(isChecked);
    
    setFormData(prev => {
      const updatedData = { ...prev, nextSchedule: isChecked ? '' : prev.nextSchedule };
      localStorage.setItem(`draft_care_report_${params.id}`, JSON.stringify(updatedData));
      return updatedData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportRef.current) return;
    if (!formData.department || !formData.doctorOpinion || !formData.prescription || !formData.managerComment) {
      MySwal.fire({ icon: 'warning', title: '입력 확인', text: '필수 항목을 모두 입력해 주세요.' });
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

      const payload = new FormData();

      const finalNextSchedule = noNextSchedule || !formData.nextDate || !formData.nextTime 
        ? '' 
        : `${formData.nextDate}T${formData.nextTime}:00`;

      const requestData = {
        reservationId: Number(params.id),
        department: formData.department,
        doctorOpinion: formData.doctorOpinion,
        prescription: formData.prescription,
        nextSchedule: noNextSchedule ? '' : formData.nextSchedule, 
        managerComment: formData.managerComment,
        patientCondition: formData.patientCondition,
        noNextSchedule: noNextSchedule
      };
      
      payload.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
      payload.append('pdfFile', pdfBlob, `케어리포트_${params.id}.pdf`);

      let res;
      if (existingReportId) {
        // 기존 리포트가 있으면 수정(Update) API 호출
        res = await reportApi.updateWithPdf(existingReportId, payload);
      } else {
        // 기존 리포트가 없으면 신규 생성(Create) API 호출
        res = await reportApi.createWithPdf(payload);
      }

      if (res.status === 200 || res.status === 201) {
        localStorage.removeItem(`draft_care_report_${params.id}`);
        MySwal.fire({ 
          icon: 'success', 
          title: existingReportId ? '리포트 수정 완료' : '리포트 작성 완료', 
          text: '보호자에게 알림이 전송되었습니다.' 
        });
        router.push('/manager/dashboard');
      }

    } catch (error) {
      console.error('리포트 제출 에러:', error);
      MySwal.fire({ icon: 'error', title: '제출 실패', text: '서버 오류가 발생했습니다. 다시 시도해 주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  const selectedHour = formData.nextTime ? formData.nextTime.split(':')[0] : '';
  const selectedMinute = formData.nextTime ? formData.nextTime.split(':')[1] : '';

  if (loading || !targetReservation) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      <motion.main className="max-w-2xl mx-auto px-4 pt-6" initial="hidden" animate="visible" variants={pageVariants}>
        
        {/* 상단 대상자 정보 요약 */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 mb-6 border border-emerald-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="text-sm text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-lg">
                작성 대상 (예약번호: #{targetReservation.id})
              </div>
              {isModified && (
                <div className="text-xs text-orange-600 font-bold px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                  수정됨 (재전송)
                </div>
              )}
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

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          <div ref={reportRef} className="space-y-5 bg-gray-50 pb-4">
            
            {/* 1. 당일 환자 컨디션 */}
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
                    whileTap={{ scale: 0.95 }}
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

            {/* 2. 진료 요약 및 처방 */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg"><Stethoscope className="w-4 h-4 text-emerald-500" /></div>
                  진료 요약 <span className="text-red-500 text-xs">*</span>
                </label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="진료 과목 (예: 신경과, 정형외과)" 
                  className="w-full px-4 py-3.5 mb-3 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-base text-gray-800 placeholder:text-gray-400 outline-none" required />
                <textarea name="doctorOpinion" rows={3} value={formData.doctorOpinion} onChange={handleChange} placeholder="의사 선생님의 주요 소견이나 당부 말씀을 기록해 주세요." 
                  className="w-full px-4 py-3.5 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all 
                  text-base text-gray-800 placeholder:text-gray-400 outline-none resize-none" required></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">처방 및 복약 안내</label>
                  <textarea name="prescription" rows={2} value={formData.prescription} onChange={handleChange} placeholder="예) 기존 약 유지, 위장약 1주분 추가" 
                    className="w-full px-4 py-3.5 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all 
                    text-base text-gray-800 placeholder:text-gray-400 outline-none resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> 다음 예약 일정</label>
                  <div className={`space-y-3 ${noNextSchedule ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="date" name="nextDate" value={formData.nextDate} onChange={handleChange} 
                      className="w-full px-4 py-3.5 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all text-base text-gray-800 outline-none" />
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select value={selectedHour} onChange={(e) => handleTimeSelect('hour', e.target.value)}
                          className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-0 ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all outline-none font-bold text-gray-800 appearance-none text-center">
                          <option value="" disabled>시</option>
                          {HOURS.map(h => <option key={h} value={h}>{h}시</option>)}
                        </select>
                      </div>
                      <div className="flex items-center justify-center font-bold text-gray-400">:</div>
                      <div className="relative flex-1">
                        <select value={selectedMinute} onChange={(e) => handleTimeSelect('minute', e.target.value)} disabled={selectedHour === '18'}
                          className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-0 ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all outline-none font-bold text-gray-800 appearance-none text-center disabled:opacity-50">
                          <option value="" disabled>분</option>
                          {MINUTES.map(m => <option key={m} value={m}>{m}분</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2.5 mr-1">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer hover:text-slate-700 transition-colors">
                      <input type="checkbox" checked={noNextSchedule} onChange={handleNoNextScheduleChange}
                      className="w-4 h-4 accent-orange-500 rounded-sm cursor-pointer" />다음 예약 일정 없음
                    </label>
                  </div>
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
                className="w-full px-4 py-3.5 rounded-2xl border-0 ring-1 ring-purple-100 bg-purple-50/30 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all 
                text-base text-gray-800 placeholder:text-gray-400 outline-none resize-none" required></textarea>
            </motion.div>
          </div>

          {/* 4. 전송 버튼 (하단 고정 풀고 매니저 코멘트 바로 밑에 자연스럽게 배치) */}
          <motion.div variants={itemVariants} className="pt-2">
            <button type="submit" disabled={isSubmitting} 
              className="w-full bg-emerald-600 text-white text-lg font-bold py-4 rounded-2xl shadow-emerald-600/20 shadow-lg hover:bg-emerald-700 transition-all 
              active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100">
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {isSubmitting 
                ? '전송 중...' 
                : existingReportId 
                  ? '수정 및 재전송하기' 
                  : '보호자에게 전송하기'
              }
            </button>
          </motion.div>
          
        </form>
      </motion.main>
    </div>
  );
}