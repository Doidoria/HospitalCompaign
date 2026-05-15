// src/components/admin/modals/DetailModal.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Loader2, Users, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';

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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100"
        >
          <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
              예약 상세 정보 
              {selectedRequest && <span className="text-sm font-medium text-slate-400 ml-1">#{selectedRequest.id}</span>}
            </h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!selectedRequest ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-slate-400 font-medium text-sm">상세 정보를 불러오는 중입니다...</p>
            </div>
          ) : (
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* 1. 고객 정보 */}
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Users className="w-4 h-4"/> 고객 정보</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <p><span className="font-semibold text-slate-900 block mb-1">환자명</span> {selectedRequest.patientName} ({selectedRequest.patientPhone})</p>
                  <p><span className="font-semibold text-slate-900 block mb-1">보호자명</span> {selectedRequest.guardianName || '-'} ({selectedRequest.guardianPhone || '-'})</p>
                </div>
              </div>

              {/* 2. 일정 및 장소 */}
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4"/> 일정 및 장소</h4>
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 space-y-3 border border-slate-100">
                  <p><span className="font-semibold text-slate-900 w-20 inline-block">일시</span> {selectedRequest.reservationTime.replace('T', ' ').substring(0, 16)}</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 w-20 inline-block shrink-0">목적지</span> 
                    <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(selectedRequest.hospitalName)}`, '_blank')} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                      {selectedRequest.hospitalName} <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 w-20 inline-block shrink-0">만나는 장소</span> 
                    <span className="text-slate-800 font-medium">
                      {selectedRequest.meetingPoint ? selectedRequest.meetingPoint.replace(' /// ', ' ') : '자택'}
                    </span>
                    <button onClick={() => {
                        const rawPoint = selectedRequest.meetingPoint || '자택';
                        const searchTarget = rawPoint === '자택' ? selectedRequest.patientAddress : rawPoint.split(' /// ')[0];
                        if (!searchTarget) return Swal.fire('알림', '주소 정보가 없습니다.', 'warning');
                        window.open(`https://map.kakao.com/link/search/${encodeURIComponent(searchTarget)}`, '_blank');
                      }}
                      className="ml-2 px-2.5 py-1 bg-[#FEE500] text-[#191919] text-[11px] font-bold rounded-md hover:bg-[#FADA0A] transition-colors flex items-center gap-1 shadow-sm"
                    >
                      지도 보기
                    </button>
                  </div>
                  <p><span className="font-semibold text-slate-900 w-20 inline-block">이동 수단</span> {selectedRequest.transportation || '미기재'}</p>
                </div>
              </div>

              {/* 3. 진료 및 요청사항 상세 */}
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-500 mb-1.5">보호자 특별 요청사항</h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap border border-slate-200/60 leading-relaxed">
                    {selectedRequest.requirements || selectedRequest.memo || '요청사항이 없습니다.'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-600 mb-1.5">상세 진료 및 검사 내용</h4>
                  <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-slate-800 border border-blue-100/50 whitespace-pre-wrap leading-relaxed">
                    {selectedRequest.detailedContent || '상세 내용이 없습니다.'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-600 mb-1.5">의사 선생님께 꼭 여쭤봐야 할 질문</h4>
                  <div className="bg-amber-50/50 p-4 rounded-xl text-sm text-amber-900 font-bold whitespace-pre-wrap border border-amber-100/50 leading-relaxed">
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