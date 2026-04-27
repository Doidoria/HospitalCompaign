'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, Stethoscope, CalendarClock, Pill, User, Heart, Download, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { reportApi, reservationApi } from '@/src/api/index';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // 🌟 1. 리포트 데이터 가져오기
        const res = await reportApi.getDetail(params.id as string);
        const data = res.data;

        // 🌟 2. 날짜 가공 (예: 2026. 04. 15 (수))
        const dateObj = new Date(data.date);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

        setReportData({
          ...data,
          formattedDate: dateStr,
          managerName: data.managerName
        });
      } catch (error) {
        console.error('리포트 로딩 에러:', error);
        Swal.fire({ icon: 'error', title: '조회 실패', text: '아직 작성된 리포트가 없거나 오류가 발생했습니다.' });
        router.push('/mypage');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [params.id, router]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;

    try {
      setIsGeneratingPdf(true);

      // 1. html-to-image로 화면 캡처 (최신 CSS 완벽 지원)
      const imgData = await toPng(reportRef.current, {
        quality: 0.95,
        backgroundColor: '#f9fafb', // Tailwind bg-gray-50 색상 유지
        cacheBust: true,
      });

      // 2. 이미지를 PDF 규격으로 변환
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (reportRef.current.offsetHeight * pdfWidth) / reportRef.current.offsetWidth;

      // 3. PDF에 이미지 추가 및 브라우저 다운로드 실행
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`예스케어_리포트_${reportData.patientName}님.pdf`);

    } catch (error) {
      console.error('PDF 생성 에러:', error);
      Swal.fire('오류', 'PDF를 생성하는 중 문제가 발생했습니다.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 text-blue-900 animate-spin" /></div>;
  }

  if (!reportData) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/mypage" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg text-blue-950">케어 리포트 상세</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <motion.main className="max-w-2xl mx-auto px-4 pt-6" initial="hidden" animate="visible" variants={containerVariants}>
        
        <div ref={reportRef} className="pb-4">
          
          {/* 헤더 카드 */}
          <motion.div variants={itemVariants} className="bg-blue-950 text-white rounded-3xl p-6 mb-6 shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-block bg-blue-800/50 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-lg mb-3">
                진료 동행 완료
              </div>
              <h2 className="text-2xl font-extrabold mb-1">{reportData.hospitalName}</h2>
              <p className="text-blue-200">{reportData.department} | {reportData.formattedDate}</p>
              
              <div className="flex items-center gap-4 mt-5 pt-5 border-t border-blue-800/50 text-sm">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-300" />
                  <span>환자: <strong>{reportData.patientName}</strong>님</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  <span>담당 매니저: <strong>{reportData.managerName}</strong></span>
                </div>
              </div>
            </div>
            <FileText className="absolute -bottom-6 -right-6 w-32 h-32 text-blue-900 opacity-50" />
          </motion.div>

          <div className="space-y-4">
            {/* 진료 요약 및 의사 소견 */}
            <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Stethoscope className="w-5 h-5" /></div>
                <h3 className="font-bold text-lg text-gray-800">진료 요약 및 의사 소견</h3>
              </div>
              <p className="text-gray-600 leading-relaxed break-keep text-sm md:text-base bg-gray-50 p-4 rounded-2xl whitespace-pre-wrap">
                {reportData.doctorOpinion}
              </p>
            </motion.section>

            {/* 다음 일정 및 안내 */}
            <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-500"><CalendarClock className="w-5 h-5" /></div>
                <h3 className="font-bold text-lg text-gray-800">다음 일정 및 안내</h3>
              </div>
              <p className="text-gray-600 leading-relaxed break-keep text-sm md:text-base">
                {reportData.nextSchedule || '다음 일정 없음'}
              </p>
            </motion.section>

            {/* 처방 및 복약 안내 */}
            <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Pill className="w-5 h-5" /></div>
                <h3 className="font-bold text-lg text-gray-800">처방 및 복약 안내</h3>
              </div>
              <p className="text-gray-600 leading-relaxed break-keep text-sm md:text-base whitespace-pre-wrap">
                {reportData.prescription || '특이사항 없음'}
              </p>
            </motion.section>

            {/* 매니저 동행 코멘트 */}
            <motion.section variants={itemVariants} className="bg-emerald-50 rounded-[24px] p-6 shadow-sm border border-emerald-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white p-2 rounded-xl text-emerald-600 shadow-sm"><User className="w-5 h-5" /></div>
                <h3 className="font-bold text-lg text-emerald-900">매니저 동행 코멘트</h3>
              </div>
              <p className="text-emerald-800 leading-relaxed break-keep text-sm md:text-base whitespace-pre-wrap">
                {reportData.managerComment}
              </p>
            </motion.section>
          </div>
        </div> 

        {/* PDF 다운로드 버튼 */}
        <motion.div variants={itemVariants} className="mt-8 flex gap-3">
          <button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {isGeneratingPdf ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 생성 중...</>
            ) : (
              <><Download className="w-5 h-5" /> PDF 다운로드</>
            )}
          </button>
        </motion.div>

      </motion.main>
    </div>
  );
}