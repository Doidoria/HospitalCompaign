'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Loader2, FileCheck2, Building2, Activity, 
  Stethoscope, Pill, MessageSquare, CalendarClock 
} from 'lucide-react';
import { reportApi } from '@/src/api/index';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: number | null;
}

export default function ReportModal({ isOpen, onClose, reservationId }: ReportModalProps) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && reservationId) {
      const fetchReport = async () => {
        setLoading(true);
        try {
          const res = await reportApi.getReportByReservationId(String(reservationId));
          setReportData(res.data);
        } catch (error) {
          console.log("리포트를 불러올 수 없습니다.");
          setReportData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    } else {
      setReportData(null);
    }
  }, [isOpen, reservationId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6">
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="bg-[#F8FAFC] rounded-[28px] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
            
          {/* 헤더 영역 */}
          <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-slate-100 relative z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100/50">
                <FileCheck2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-800 leading-tight">
                  케어 리포트 상세 내역
                </h3>
                {reservationId && <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-wide">예약번호 #{reservationId}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* (재전송) 배지 - PC 화면용 */}
              {reportData?.isModified && (
                <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[11px] font-extrabold rounded-lg border border-orange-200/60 shadow-sm hidden sm:block">
                  수정됨 (재전송)
                </span>
              )}
              <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 본문 영역 */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-slate-400 font-bold text-sm">리포트 데이터를 불러오는 중입니다...</p>
              </div>
            ) : reportData ? (
              <div className="space-y-4">
                {/* (재전송) 배지 - 모바일 화면용 */}
                {reportData.isModified && (
                  <div className="sm:hidden mb-4">
                    <span className="px-2.5 py-1 inline-block bg-orange-50 text-orange-600 text-[11px] font-extrabold rounded-lg border border-orange-200/60 shadow-sm">
                      수정됨 (재전송)
                    </span>
                  </div>
                )}

                {/* 1. 상단 요약 정보 (방문 진료과, 환자 컨디션) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <p className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> 방문 진료과
                    </p>
                    <p className="font-extrabold text-slate-800 text-base">{reportData.department}</p>
                  </div>
                  <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <p className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> 환자 컨디션
                    </p>
                    <p className="font-extrabold text-slate-800 text-base flex items-center gap-1">
                      {reportData.patientCondition === 'good' ? '😊 매우 좋음' : reportData.patientCondition === 'normal' ? '😐 보통' : '😥 저하됨'}
                    </p>
                  </div>
                </div>

                {/* 2. 진료 요약 및 의사 소견 */}
                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg"><Stethoscope className="w-4 h-4 text-blue-600" /></div>
                    진료 요약 및 의사 소견
                  </h4>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 font-medium">
                    {reportData.doctorOpinion}
                  </div>
                </div>

                {/* 3. 처방 및 다음 일정 */}
                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-rose-50 rounded-lg"><Pill className="w-4 h-4 text-rose-500" /></div>
                    처방 및 다음 일정
                  </h4>
                  <div className="space-y-3">
                    <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 font-medium">
                      {reportData.prescription}
                    </div>
                    <div className={`flex items-center gap-2 p-3.5 rounded-xl border font-bold text-sm shadow-sm
                      ${reportData.noNextSchedule ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                      <CalendarClock className="w-4 h-4" />
                      {reportData.noNextSchedule ? '다음 진료 일정 없음' : `다음 방문일: ${reportData.nextSchedule}`}
                    </div>
                  </div>
                </div>

                {/* 4. 매니저 코멘트 */}
                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-400"></div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 rounded-lg"><MessageSquare className="w-4 h-4 text-purple-600" /></div>
                    매니저 동행 코멘트
                  </h4>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-purple-50/30 p-4 rounded-xl border border-purple-100/50 font-medium">
                    {reportData.managerComment}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-[24px] border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center mt-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FileCheck2 className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-slate-700 font-bold mb-1 text-lg">작성된 리포트가 없습니다</h4>
                <p className="text-slate-400 text-sm">해당 예약건에 대한 리포트 정보를 찾을 수 없습니다.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}