// app/manager/report/[id]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { User, Stethoscope, Clock, CheckCircle2, FileEdit, Loader2, ArrowLeft, FileText, Trash2, X, Plus, Camera } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { reservationApi, reportApi } from '@/src/api/index';
import { ReportRequest } from '@/src/types/report';
import { Toast, YesAlert } from '@/src/utils/alert';
import imageCompression from 'browser-image-compression';

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
    medicationType: '기존 약 유지', 
    medicationTime: '식후 30분',
    medicationDays: '',
    nextSchedule: '',
    nextDate: '',
    nextTime: '',
    patientCondition: 'good',
    managerComment: ''
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // 백엔드에서 온 기존 사진
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]); // 새 사진 미리보기

  // 당일 및 과거 날짜 선택 방지 (내일 날짜 계산)
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  tomorrowDate.setHours(tomorrowDate.getHours() + 9); // 한국 시간(KST) 보정
  const minDate = tomorrowDate.toISOString().split('T')[0];

  // 백엔드 이미지 주소를 절대 깨지지 않게 조합하는 헬퍼 함수
  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    
    // 대표님 API 주소 포트에 맞게 변경 (보통 8080 또는 8081)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'; 
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    
    if (cleanUrl.startsWith('/uploads')) {
      return `${baseUrl}${cleanUrl}`;
    } else {
      return `${baseUrl}/uploads${cleanUrl}`;
    }
  };

  // 백엔드 원본 데이터 불러오기
  useEffect(() => {
    const fetchReservationAndReport = async () => {
      try {
        const res = await reservationApi.getDetail(params.id as string);
        setTargetReservation(res.data);

        try {
          const reportRes = await reportApi.getReportByReservationId(params.id as string);
          
          if (reportRes.data) {
            setExistingReportId(reportRes.data.id);
            setIsModified(reportRes.data.isModified);

            const fetchedNextSchedule = reportRes.data.nextSchedule || '';
            const [splitDate, splitTime] = fetchedNextSchedule ? fetchedNextSchedule.split('T') : ['', ''];
            
            setFormData({
              department: reportRes.data.department || '',
              doctorOpinion: reportRes.data.doctorOpinion || '',
              prescription: reportRes.data.prescription || '',
              medicationType: reportRes.data.medicationType || '기존 약 유지',
              medicationTime: reportRes.data.medicationTime || '식후 30분',
              medicationDays: reportRes.data.medicationDays ? String(reportRes.data.medicationDays) : '',
              nextSchedule: fetchedNextSchedule,
              nextDate: splitDate,
              nextTime: splitTime ? splitTime.substring(0, 5) : '',
              patientCondition: reportRes.data.patientCondition || 'good',
              managerComment: reportRes.data.managerComment || ''
            });

            // 사진 미리보기 띄워주기
            if (reportRes.data.imageUrls && reportRes.data.imageUrls.length > 0) {
              const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
              
              const formattedUrls = reportRes.data.imageUrls.map((url: string) => {
                // 1. 이미 http가 붙어있는 외부 링크(S3 등)면 그대로 사용
                if (url.startsWith('http')) return url;
                
                // 2. 앞에 슬래시(/)가 없으면 붙여서 백엔드 주소와 결합
                const imgPath = url.startsWith('/') ? url : `/uploads/${url}`; // 백엔드 저장 경로 정책에 맞게 조절
                return `${backendBaseUrl}${imgPath}`;
              });
              
              setExistingImages(reportRes.data.imageUrls);
            }

            if (reportRes.data.noNextSchedule || fetchedNextSchedule === '') {
              setNoNextSchedule(true);
            }
          }
        } catch (e) {
          console.log("기존 리포트 없음 (신규 작성 모드)");
        }
      } catch (error) {
        YesAlert.fire({ icon: 'error', title: '오류', text: '예약 정보를 불러올 수 없습니다.' });
        router.push('/manager/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchReservationAndReport();
  }, [params.id, router]);

  // 임시 저장된 데이터 불러오기 (단일 데이터용으로 복구)
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

  // 시간 선택 핸들러 복구
  const handleTimeSelect = (type: 'hour' | 'minute', value: string) => {
    const currentHour = formData.nextTime ? formData.nextTime.split(':')[0] : '09';
    const currentMinute = formData.nextTime ? formData.nextTime.split(':')[1] : '00';

    let newHour = type === 'hour' ? value : currentHour;
    let newMinute = type === 'minute' ? value : currentMinute;

    if (newHour === '18') newMinute = '00';

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

  // 사진 업로드 핸들러
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // 압축 옵션 설정 (최대 1MB, 최대 해상도 1024x1024)
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      try {
        // 모든 파일을 순회하며 압축 진행
        const compressedFiles = await Promise.all(
          filesArray.map(async (file) => {
            const compressedBlob = await imageCompression(file, options);
            // 압축된 Blob을 다시 File 객체로 변환
            return new File([compressedBlob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
          })
        );

        // 압축된 파일들을 상태에 저장
        setImages(prev => [...prev, ...compressedFiles]);
        const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));
        setNewImagePreviews(prev => [...prev, ...newPreviews]);
        e.target.value = '';
      } catch (error) {
        console.error("이미지 압축 실패:", error);
        YesAlert.fire({ icon: 'error', title: '오류', html: '이미지 처리 중 문제가 발생했습니다.' });
      }
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 처방약 메모(prescription)를 무조건 필수에서 제외하고 분리
    if (!formData.department || !formData.doctorOpinion || !formData.managerComment) {
      YesAlert.fire({ icon: 'warning', title: '입력 확인', text: '진료 요약, 의사 소견, 매니저 코멘트는 필수입니다.' });
      return;
    }
    
    // '처방약 없음'이 아닌데 메모를 비워둔 경우에만 경고
    if (formData.medicationType !== '처방약 없음' && !formData.prescription) {
      YesAlert.fire({ icon: 'warning', title: '입력 확인', text: '처방 및 복약 안내 메모를 입력해 주세요.' });
      return;
    }

    // 전송 전 확인 팝업 (취소 시 방어)
    const confirmResult = await YesAlert.fire({
      title: existingReportId ? '리포트를 수정하시겠습니까?' : '리포트를 전송하시겠습니까?',
      html: '보호자에게 알림톡과 리포트가 발송됩니다.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: '네, 전송합니다',
      cancelButtonText: '취소'
    });

    if (!confirmResult.isConfirmed) return;

    setIsSubmitting(true);

    try {
      const finalNextSchedule = noNextSchedule || !formData.nextDate || !formData.nextTime 
        ? '' 
        : `${formData.nextDate}T${formData.nextTime}:00`;

      const requestData: ReportRequest = {
        reservationId: Number(params.id),
        department: formData.department,
        doctorOpinion: formData.doctorOpinion,
        prescription: formData.prescription,
        medicationType: formData.medicationType,
        medicationTime: formData.medicationTime,
        medicationDays: formData.medicationDays ? Number(formData.medicationDays) : null,
        nextSchedule: finalNextSchedule,
        managerComment: formData.managerComment,
        patientCondition: formData.patientCondition,
        noNextSchedule: noNextSchedule,
        retainedImages: existingImages
      };
      
      const payload = new FormData();
      payload.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));

      images.forEach(file => {
        payload.append('images', file);
      });

      let res;
      if (existingReportId) {
        res = await reportApi.updateWithPdf(existingReportId, payload);
      } else {
        res = await reportApi.createWithPdf(payload);
      }

      if (res.status === 200 || res.status === 201) {
        localStorage.removeItem(`draft_care_report_${params.id}`);

        // 성공 팝업에 명시적으로 취소 버튼 숨김 및 버튼 텍스트 초기화 설정 추가
        await YesAlert.fire({ 
          icon: 'success', 
          title: existingReportId ? '리포트 수정 완료' : '리포트 작성 완료', 
          text: '보호자에게 알림톡이 전송되었습니다.',
          showCancelButton: false,
          confirmButtonText: '확인',
          confirmButtonColor: '#3b82f6'
        });
        
        router.push('/manager/dashboard');
      }

    } catch (error) {
      console.error('리포트 제출 에러:', error);
      Toast.fire({ icon: 'error', title: '제출에 실패했습니다.\n잠시 후 다시 시도해 주세요.'});
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

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-2xl font-extrabold flex items-center gap-2 tracking-tight">
            <FileText className="w-7 h-7 text-emerald-600" /> 케어 리포트 조회 / 수정
          </h2>
        </motion.div>

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

            {/* 진료 요약 및 다음 예약 일정 */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-6">
              
              {/* 1. 진료 요약 섹션 */}
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

              {/* 2. 처방 안내 & 예약 일정 섹션 (Grid 제거, 위아래 수직 배치 적용) */}
              <div className="space-y-6 pt-6 border-t border-gray-100">
                
                {/* 처방 및 복약 안내 */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg"><FileText className="w-4 h-4 text-blue-500" /></div>
                    처방 및 복약 안내
                  </label>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3 mt-4">
                    {/* 전체 너비를 차지하므로, 좁은 화면에선 세로, 넓은 화면에선 가로로 배치되게 처리 */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select name="medicationType" value={formData.medicationType} onChange={handleChange}
                        className="w-full sm:flex-1 px-3 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-gray-700"
                      >
                        <option value="기존 약 유지">기존 약 유지</option>
                        <option value="신규 처방 (내복약)">신규 처방 (내복약)</option>
                        <option value="외용약 추가">외용약 추가</option>
                        <option value="처방약 없음">처방약 없음</option>
                      </select>
                      <select name="medicationTime" 
                        value={formData.medicationTime} 
                        onChange={handleChange}
                        disabled={formData.medicationType === '처방약 없음'}
                        className="w-full sm:flex-1 px-3 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="식후 30분">식후 30분</option>
                        <option value="식전 30분">식전 30분</option>
                        <option value="취침 전">취침 전</option>
                        <option value="필요 시(PRN)">필요 시(아플 때)</option>
                      </select>
                      
                      <div className="w-full sm:flex-1 relative">
                        <input 
                          type="number" 
                          name="medicationDays" 
                          value={formData.medicationDays} 
                          onChange={handleChange} 
                          disabled={formData.medicationType === '처방약 없음'}
                          placeholder="처방 일수" 
                          className="w-full px-3 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-gray-700 pr-9 disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">일분</span>
                      </div>
                    </div>

                    <textarea 
                      name="prescription" 
                      rows={2} 
                      value={formData.prescription} 
                      onChange={handleChange} 
                      placeholder="복약 관련 추가 메모 사항 (예: 위장약이 추가되었습니다)" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* 다음 예약 일정 */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> 다음 예약 일정</label>
                  <div className={`space-y-3 ${noNextSchedule ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* 날짜와 시간도 넓어진 공간을 활용해 한 줄(넓은 화면) 혹은 두 줄(모바일)로 반응형 배치 */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input type="date" name="nextDate" min={minDate} value={formData.nextDate} onChange={handleChange} 
                        className="w-full sm:flex-1 px-4 py-3.5 rounded-2xl border-0 ring-1 ring-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all text-base text-gray-800 outline-none" 
                      />
                      <div className="flex gap-2 sm:flex-1">
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

            {/* 매니저 단일 코멘트 폼 */}
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

          {/* 진료 및 처방 관련 사진 */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg"><Camera className="w-4 h-4 text-blue-500" /></div>
                진료 및 처방 관련 사진 첨부하기
              </label>
              <div className="flex flex-wrap gap-3 mt-4">
                 {existingImages.map((src, idx) => (
                   <div key={`exist-${idx}`} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-emerald-200 shadow-sm">
                     <img src={getImageUrl(src)} alt="exist-preview" className="w-full h-full object-cover" />
                     <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80">
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                 ))}
                 {newImagePreviews.map((src, idx) => (
                   <div key={`new-${idx}`} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-blue-200 shadow-sm">
                     <img src={src} alt="new-preview" className="w-full h-full object-cover" />
                     <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80">
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                 ))}
                <label className="w-24 h-24 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all">
                  <Plus className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[11px] text-gray-400 font-bold">사진 등록</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
          </motion.div>

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