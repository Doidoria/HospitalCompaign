'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, Stethoscope, CalendarClock, Pill, User, Heart, Download, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ReportDetailPage() {
  // TODO: 실제 백엔드 연동 시 URL의 [id] 파라미터를 가져와서 API(예: GET /api/reports/{id})를 호출합니다.
  // const params = useParams();
  
  // 임시(Mock) 데이터
  const reportData = {
    id: 'REP-001',
    date: '2026. 04. 15 (수)',
    hospital: '서울대학교병원 본원',
    department: '신경과',
    patientName: '홍길동',
    managerName: '이동행',
    doctorOpinion: '최근 인지 기능 저하 속도가 다소 진행됨. 혈압은 안정적이나 주 3회 30분 이상 가벼운 산책을 권장함. 어지럼증 호소 시 즉시 내원 요망.',
    nextSchedule: '2026. 05. 15 (금) 오전 11:00 (MRI 재촬영 및 결과 상담)',
    prescription: '기존 복용 약물 유지, 저녁 식후 복용하는 소화제 1종 추가 (총 5알)',
    managerComment: '오늘 아버님께서 병원 이동하시는 내내 컨디션이 좋으셨습니다. 대기 시간이 조금 길어졌지만, 준비해 간 따뜻한 물을 드시며 편안하게 기다리셨어요. 진료실에서도 의사 선생님 질문에 또박또박 대답을 잘 하셨습니다. 수고 많으셨습니다!'
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* 모바일 최적화 헤더 */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/mypage" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg text-blue-950">케어 리포트 상세</h1>
          <div className="w-10"></div> {/* 중앙 정렬용 여백 */}
        </div>
      </header>

      <motion.main 
        className="max-w-2xl mx-auto px-4 pt-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* 리포트 상단 요약 (뱃지 및 기본 정보) */}
        <motion.div variants={itemVariants} className="bg-blue-950 text-white rounded-3xl p-6 mb-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-block bg-blue-800/50 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-lg mb-3">
              진료 동행 완료
            </div>
            <h2 className="text-2xl font-extrabold mb-1">{reportData.hospital}</h2>
            <p className="text-blue-200">{reportData.department} | {reportData.date}</p>
            
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
          {/* 장식용 배경 로고/아이콘 */}
          <FileText className="absolute -bottom-6 -right-6 w-32 h-32 text-blue-900 opacity-50" />
        </motion.div>

        <div className="space-y-4">
          {/* 1. 의사 소견 및 진료 내용 */}
          <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-gray-800">진료 요약 및 의사 소견</h3>
            </div>
            <p className="text-gray-600 leading-relaxed break-keep text-sm md:text-base bg-gray-50 p-4 rounded-2xl">
              {reportData.doctorOpinion}
            </p>
          </motion.section>

          {/* 2. 다음 예약 및 검사 */}
          <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-orange-50 p-2 rounded-xl text-orange-500">
                <CalendarClock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-gray-800">다음 일정 및 안내</h3>
            </div>
            <p className="text-gray-600 leading-relaxed break-keep text-sm md:text-base">
              {reportData.nextSchedule}
            </p>
          </motion.section>

          {/* 3. 복약 안내 */}
          <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-gray-800">처방 및 복약 안내</h3>
            </div>
            <p className="text-gray-600 leading-relaxed break-keep text-sm md:text-base">
              {reportData.prescription}
            </p>
          </motion.section>

          {/* 4. 매니저 코멘트 */}
          <motion.section variants={itemVariants} className="bg-emerald-50 rounded-[24px] p-6 shadow-sm border border-emerald-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white p-2 rounded-xl text-emerald-600 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-emerald-900">매니저 동행 코멘트</h3>
            </div>
            <p className="text-emerald-800 leading-relaxed break-keep text-sm md:text-base">
              "{reportData.managerComment}"
            </p>
          </motion.section>
        </div>

        {/* 하단 액션 버튼 */}
        <motion.div variants={itemVariants} className="mt-8 flex gap-3">
          <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            PDF 다운로드
          </button>
        </motion.div>

      </motion.main>
    </div>
  );
}