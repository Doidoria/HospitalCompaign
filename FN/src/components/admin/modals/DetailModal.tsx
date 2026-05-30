// src/components/admin/modals/DetailModal.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Loader2, Users, MapPin, CalendarDays, Navigation, Stethoscope, AlertCircle, HelpCircle } from 'lucide-react';
import { Toast } from '@/src/utils/alert';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequest: any | null;
}

export default function DetailModal({ isOpen, onClose, selectedRequest }: DetailModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="bg-[#F8FAFC] rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
        >
          {/* 헤더 영역 */}
          <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-slate-100 relative z-10 shadow-sm">
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100/50">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                예약 상세 정보
                {selectedRequest && <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-wide">예약번호 #{selectedRequest.id}</p>}
              </div>
            </h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 본문 영역 */}
          {!selectedRequest ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white flex-1">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-slate-400 font-bold text-sm">상세 정보를 불러오는 중입니다...</p>
            </div>
          ) : (
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar touch-pan-y overscroll-contain">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. 고객 정보 카드 */}
                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg"><Users className="w-4 h-4 text-slate-600"/></div>
                    고객 정보
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                      <span className="font-bold text-slate-400">환자명</span>
                      <span className="font-bold text-slate-800">{selectedRequest.patientName} <span className="font-medium text-slate-500 text-xs ml-1">({selectedRequest.patientPhone})</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-400">보호자</span>
                      <span className="font-bold text-slate-800">{selectedRequest.guardianName || '-'} <span className="font-medium text-slate-500 text-xs ml-1">({selectedRequest.guardianPhone || '-'})</span></span>
                    </div>
                  </div>
                </div>

                {/* 2. 일정 및 장소 요약 카드 */}
                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg"><CalendarDays className="w-4 h-4 text-slate-600"/></div>
                    일정 및 수단
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                      <span className="font-bold text-slate-400">일시</span>
                      <span className="font-extrabold text-blue-600">{selectedRequest.reservationTime.replace('T', ' ').substring(0, 16)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-400">이동 수단</span>
                      <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{selectedRequest.transportation || '미기재'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 장소 상세 카드 */}
              <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg"><MapPin className="w-4 h-4 text-indigo-500"/></div>
                  장소 정보
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-400 text-xs block mb-1.5">만나는 장소</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 text-sm truncate">
                        {selectedRequest.meetingPoint ? selectedRequest.meetingPoint.replace(' /// ', ' ') : '자택'}
                      </span>
                      <button onClick={() => {
                          const rawPoint = selectedRequest.meetingPoint || '자택';
                          const searchTarget = rawPoint === '자택' ? selectedRequest.patientAddress : rawPoint.split(' /// ')[0];
                          if (!searchTarget) return Toast.fire({ icon: 'warning', title: '주소 정보가 없습니다.' });
                          window.open(`https://map.kakao.com/link/search/${encodeURIComponent(searchTarget)}`, '_blank');
                        }}
                        className="shrink-0 px-3 py-2 sm:px-2 sm:py-1.5 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] text-[10px] font-extrabold rounded-md transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Navigation className="w-3 h-3" /> 지도 열기
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-400 text-xs block mb-1.5">목적지 (방문 병원)</span>
                    <button 
                      onClick={() => {
                        // 1. 주소에 '///' 가 있다면 그 앞부분(기본 주소)만 추출하고 양옆 공백을 제거
                        const cleanAddress = selectedRequest.hospitalName.split('///')[0].trim();
                        
                        // 2. 추출한 주소를 안전하게 URL 인코딩하여 카카오맵 링크로 넘김
                        window.open(`https://map.kakao.com/link/search/${encodeURIComponent(cleanAddress)}`, '_blank');
                      }} 
                      className="w-full text-left font-bold text-blue-600 text-sm truncate hover:text-blue-800 transition-colors flex items-center gap-1.5"
                    >
                      {selectedRequest.hospitalName.split('///')[0].trim()} <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. 진료 및 요청사항 상세 카드 영역 */}
              <div className="space-y-4">
                {/* 보호자 특별 요청사항 */}
                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg"><AlertCircle className="w-4 h-4 text-slate-600"/></div>
                    보호자 특별 요청사항
                  </h4>
                  <div className="bg-slate-50/50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap border border-slate-100 font-medium leading-relaxed">
                    {selectedRequest.requirements || selectedRequest.memo || '요청사항이 없습니다.'}
                  </div>
                </div>

                {/* 상세 진료 및 검사 내용 */}
                <div className="bg-white p-5 rounded-[20px] border border-blue-50 shadow-[0_2px_10px_rgb(59,130,246,0.04)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400"></div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg"><Stethoscope className="w-4 h-4 text-blue-600"/></div>
                    상세 진료 및 검사 내용
                  </h4>
                  <div className="bg-blue-50/30 p-4 rounded-xl text-sm text-blue-900 whitespace-pre-wrap border border-blue-100/50 font-bold leading-relaxed">
                    {selectedRequest.detailedContent || '상세 내용이 없습니다.'}
                  </div>
                </div>

                {/* 의사 선생님께 여쭤봐야 할 질문 */}
                <div className="bg-white p-5 rounded-[20px] border border-orange-50 shadow-[0_2px_10px_rgb(249,115,22,0.04)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 rounded-lg"><HelpCircle className="w-4 h-4 text-orange-600"/></div>
                    의사 선생님께 꼭 여쭤봐야 할 질문
                  </h4>
                  <div className="bg-orange-50/30 p-4 rounded-xl text-sm text-orange-900 whitespace-pre-wrap border border-orange-100/50 font-bold leading-relaxed">
                    {selectedRequest.doctorInquiry || '질문 사항이 없습니다.'}
                  </div>
                </div>
              </div>

            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}