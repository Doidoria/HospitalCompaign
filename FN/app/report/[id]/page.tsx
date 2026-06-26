// app/report/[id]/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Stethoscope, CalendarClock, Pill, User, Heart, Download, FileText, Loader2, 
  CheckCircle2, Camera, X,
 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { reportApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 백엔드 이미지 주소 조합 헬퍼 함수
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl.startsWith('/uploads') ? `${baseUrl}${cleanUrl}` : `${baseUrl}/uploads${cleanUrl}`;
  };

  // 날짜 한글 변환 헬퍼 함수
  const formatKoreanDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [date, time] = dateStr.split('T');
    if (!time) return dateStr;
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchReportData = async () => {
      try {
        const res = await reportApi.getReportByReservationId(params.id as string);
        const data = res.data;

        if (!isMounted) return;

        const dateObj = new Date(data.date);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

        setReportData({
          ...data,
          formattedDate: dateStr,
          managerName: data.managerName
        });
      } catch (error) {
        console.error('리포트 로딩 에러:', error);
        if (isMounted) {
          Toast.fire({ icon: 'error', title: '아직 작성된 리포트가 없거나 오류가 발생했습니다.' });
          router.push('/mypage');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReportData();

    return () => { isMounted = false; };
  }, [params.id, router]);

  const handleDownloadPdf = useCallback(async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const { toPng } = await import('html-to-image');
      const { default: jsPDF } = await import('jspdf');

      Toast.fire({ icon: 'info', title: 'PDF 파일을 생성하고 있습니다...' });

      const imgData = await toPng(reportRef.current, {
        quality: 0.95,
        backgroundColor: '#f8fafc', // 배경색을 명시적으로 주어 투명해지는 현상 방지 (slate-50)
        cacheBust: true,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (reportRef.current.offsetHeight * pdfWidth) / reportRef.current.offsetWidth;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`예스케어_케어리포트_${reportData.patientName}님.pdf`);
      
      Toast.fire({ icon: 'success', title: 'PDF 다운로드가 완료되었습니다.' });

    } catch (error) {
      console.error('PDF 생성 에러:', error);
      Toast.fire({ icon: 'error', title: 'PDF를 생성하는 중 문제가 발생했습니다.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [reportData]);

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } } };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pt-6 pb-24 max-w-2xl mx-auto space-y-6">
        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="h-48 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-32 bg-slate-200 rounded-[24px] animate-pulse" />
          <div className="h-24 bg-slate-200 rounded-[24px] animate-pulse" />
          <div className="h-24 bg-slate-200 rounded-[24px] animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-[24px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
      {/* 상단 네비게이션 헤더 */}
      <header className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3 relative z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">케어 리포트</h1>
      </header>

      <motion.main className="max-w-2xl mx-auto px-4" initial="hidden" animate="visible" variants={containerVariants}>
        
        {/* PDF 캡처 대상 영역 */}
        <div ref={reportRef} className="pb-4 bg-slate-50"> 
          
          {/* 1. 헤더 카드 (디자인 고도화) */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-[28px] p-7 sm:p-8 mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold px-3 py-1.5 rounded-xl mb-4 backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> 진료 동행 완료
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-1.5 tracking-tight">{reportData.hospitalName}</h2>
              <p className="text-indigo-200 text-sm font-medium">{reportData.department} | {reportData.formattedDate}</p>
              
              <div className="flex items-center gap-5 mt-6 pt-6 border-t border-white/10 text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/10 rounded-lg"><User className="w-4 h-4 text-indigo-300" /></div>
                  <span className="text-slate-200">환자: <strong className="text-white ml-0.5">{reportData.patientName}</strong> 님</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg"><Heart className="w-4 h-4 text-emerald-400" /></div>
                  <span className="text-slate-200">매니저: <strong className="text-white ml-0.5">{reportData.managerName}</strong></span>
                </div>
              </div>
            </div>

            {/* 컨디션 뱃지 개선 */}
            <div className="mt-5 flex items-center gap-2.5 bg-black/20 p-3.5 rounded-2xl border border-white/5 backdrop-blur-md relative z-10">
              <span className="text-indigo-200 text-sm font-bold ml-1">당일 환자 컨디션</span>
              {reportData.patientCondition === 'good' && <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-100">😊 좋음</span>}
              {reportData.patientCondition === 'normal' && <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200">😐 보통</span>}
              {reportData.patientCondition === 'bad' && <span className="bg-red-50 text-red-700 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-red-100">😥 저하</span>}
            </div>
            
            <FileText className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-900 opacity-40 pointer-events-none" />
          </motion.div>

          <div className="space-y-4">
            {/* 2. 진료 요약 및 의사 소견 */}
            <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><Stethoscope className="w-5 h-5" /></div>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">진료 요약 및 의사 소견</h3>
              </div>
              <p className="text-slate-600 leading-relaxed break-keep text-sm md:text-[15px] bg-slate-50/50 p-5 rounded-2xl whitespace-pre-wrap border border-slate-100">
                {reportData.doctorOpinion}
              </p>
            </motion.section>

            {/* 3. 처방 및 복약 안내 (구조화된 데이터 렌더링) */}
            <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><Pill className="w-5 h-5" /></div>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">처방 및 복약 안내</h3>
              </div>
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
                {/* 세분화된 약 처방 정보 뱃지 */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold border border-emerald-200">
                    {reportData.medicationType || '기존 약 유지'}
                  </span>
                  {reportData.medicationType !== '처방약 없음' && reportData.medicationDays && (
                    <span className="bg-white text-slate-600 px-3 py-1 rounded-lg text-sm font-bold border border-slate-200">
                      {reportData.medicationDays}일분
                    </span>
                  )}
                  {reportData.medicationType !== '처방약 없음' && reportData.medicationTime && (
                    <span className="bg-white text-slate-600 px-3 py-1 rounded-lg text-sm font-bold border border-slate-200">
                      {reportData.medicationTime}
                    </span>
                  )}
                </div>
                {/* 추가 메모 (prescription) */}
                {reportData.prescription && (
                  <p className="text-slate-600 leading-relaxed break-keep text-sm md:text-[15px] whitespace-pre-wrap font-medium border-t border-slate-100 pt-3">
                    {reportData.prescription}
                  </p>
                )}
              </div>
            </motion.section>

            {/* 4. 매니저 동행 코멘트 */}
            <motion.section variants={itemVariants} className="bg-emerald-50/80 rounded-[24px] p-6 shadow-sm border border-emerald-100/80 mt-4">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-white p-2.5 rounded-xl text-emerald-600 shadow-sm"><User className="w-5 h-5" /></div>
                <h3 className="font-extrabold text-lg text-emerald-900 tracking-tight">매니저 동행 코멘트</h3>
              </div>
              <p className="text-emerald-800 leading-relaxed break-keep text-sm md:text-[15px] whitespace-pre-wrap px-1 font-medium">
                {reportData.managerComment}
              </p>
            </motion.section>

            {/* 5. 다음 진료 일정 */}
            <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500"><CalendarClock className="w-5 h-5" /></div>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">다음 진료 일정</h3>
              </div>
              <p className="text-slate-600 leading-relaxed break-keep text-sm md:text-[15px] px-1 font-medium">
                {reportData.nextSchedule ? (
                  <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-md">
                    {formatKoreanDate(reportData.nextSchedule)}
                  </span>
                ) : '다음 일정 없음'}
              </p>
            </motion.section>
            
            {/* 6. 진료 및 처방 관련 사진 */}
            {reportData.imageUrls && reportData.imageUrls.length > 0 && (
              <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-500"><Camera className="w-5 h-5" /></div>
                  <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">진료 및 처방 관련 사진</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {reportData.imageUrls.map((url: string, idx: number) => (
                    <div key={idx} onClick={() => setSelectedImage(getImageUrl(url))}
                      className="aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm hover:scale-[1.02] transition-transform duration-200 cursor-zoom-in"
                    >
                      <img src={getImageUrl(url)} alt={`진료 및 처방 관련 사진 ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        </div> 

        {/* PDF 다운로드 버튼 */}
        <motion.div variants={itemVariants} className="mt-8 flex gap-3">
          <button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="w-full bg-slate-800 text-white font-bold py-4.5 rounded-[20px] shadow-lg hover:bg-slate-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {isGeneratingPdf ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 리포트 생성 중...</>
            ) : (
              <><Download className="w-5 h-5" /> 리포트 PDF 저장하기</>
            )}
          </button>
        </motion.div>
      </motion.main>
      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out backdrop-blur-sm">
            <img src={selectedImage} alt="확대된 사진" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/10 hover:bg-white/25 rounded-full text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}