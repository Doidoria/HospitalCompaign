import React from 'react';
import { motion } from 'framer-motion';
import { FileText, X, MapPin, Activity } from 'lucide-react';
import { YesAlert } from '@/src/utils/alert';

interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export default function ReservationDetailModal({ isOpen, onClose, data }: ReservationDetailModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="bg-white rounded-[32px] w-full max-w-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
      >
        <div className="px-6 py-5 flex justify-between items-center bg-white border-b border-slate-100 relative">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 relative z-10">
            <div className="p-1.5 bg-emerald-50 rounded-lg"><FileText className="w-5 h-5 text-emerald-600" /></div> 예약 상세 정보
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 space-y-6">
          {/* 1. 기본 정보 */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-2 tracking-wide">기본 정보</h4>
            <div className="bg-white p-5 rounded-[20px] text-sm text-slate-700 space-y-3 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                <span className="font-semibold text-slate-400 w-16 shrink-0">환자명</span> 
                <span className="font-bold text-slate-800 text-base">{data.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-400 w-16 shrink-0">목적지</span> 
                <button  onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(data.hospitalName)}`, '_blank')}
                  className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
                  <MapPin className="w-3.5 h-3.5" /> {data.hospitalName}
                </button>
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="font-semibold text-slate-400 w-16 shrink-0 whitespace-nowrap">만나는 장소</span> 
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">
                    {data.meetingPoint ? data.meetingPoint.replace(' /// ', ' ') : '자택 앞 (연락 요망)'}
                  </span>
                  <button onClick={() => {
                      const rawPoint = data.meetingPoint || '자택';
                      const searchTarget = rawPoint === '자택' ? data.patientAddress : rawPoint.split(' /// ')[0];
                      if (!searchTarget) return YesAlert.fire({ icon: 'warning', title: '주소 미등록', html: '정확한 주소가 없습니다.' });
                      window.open(`https://map.kakao.com/link/search/${encodeURIComponent(searchTarget)}`, '_blank');
                    }}
                    className="px-2.5 py-1 bg-[#FEE500] text-[#191919] text-[11px] font-bold rounded-md hover:bg-[#FADA0A] transition-colors flex items-center gap-1 shadow-sm">
                    카카오맵 열기
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-400 w-16 shrink-0">이동 수단</span> 
                <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{data.transportation}</span>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                <span className="font-semibold text-slate-400 w-16 shrink-0">거동 상태</span> 
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">{data.mobility || '독립 보행 가능'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 2. 특별 요청사항 */}
            {data.requirements && (
              <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <h4 className="text-xs font-bold text-slate-400 mb-2 tracking-wide flex items-center gap-1">특별 요청사항</h4>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {data.requirements}
                </div>
              </div>
            )}

            {/* 3. 상세 진료 내용 */}
            {data.detailedContent && (
              <div className="bg-blue-50/50 p-5 rounded-[20px] border border-blue-100 shadow-[0_2px_10px_rgb(59,130,246,0.02)]">
                <h4 className="text-xs font-bold text-blue-400 mb-2 tracking-wide">상세 진료 및 검사 내용</h4>
                <div className="text-sm text-blue-900 font-medium space-y-1.5">
                  {data.detailedContent.split('\n').map((line: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                      <p className="leading-relaxed">{line.replace('- ', '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 의사 선생님께 여쭤볼 내용 */}
            {data.doctorInquiry && (
              <div className="bg-amber-50/50 p-5 rounded-[20px] border border-amber-200/60 shadow-[0_2px_10px_rgb(245,158,11,0.02)]">
                <h4 className="text-xs font-bold text-amber-500 mb-2 tracking-wide">의사 선생님께 꼭 여쭤봐야 할 질문</h4>
                <div className="text-sm text-amber-900 font-bold whitespace-pre-wrap leading-relaxed">
                  {data.doctorInquiry}
                </div>
              </div>
            )}
            
            {/* 5. 환자 사전 건강 정보 */}
            {(data.bloodType || data.underlyingDisease || data.medication) && (
              <div className="bg-rose-50/50 p-5 rounded-[20px] border border-rose-100 shadow-[0_2px_10px_rgb(225,29,72,0.02)]">
                <h4 className="text-xs font-bold text-rose-500 mb-3 tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> 환자 사전 건강 정보
                </h4>
                <div className="text-sm text-rose-900 font-medium space-y-2.5">
                  {data.bloodType && (
                    <div className="flex items-start gap-3">
                      <span className="w-14 shrink-0 text-rose-400/80 font-bold">혈액형</span>
                      <span className="flex-1">{data.bloodType}</span>
                    </div>
                  )}
                  {data.underlyingDisease && (
                    <div className="flex items-start gap-3">
                      <span className="w-14 shrink-0 text-rose-400/80 font-bold">기저질환</span>
                      <span className="flex-1 whitespace-pre-wrap leading-relaxed">{data.underlyingDisease}</span>
                    </div>
                  )}
                  {data.medication && (
                    <div className="flex items-start gap-3">
                      <span className="w-14 shrink-0 text-rose-400/80 font-bold">복용 약</span>
                      <span className="flex-1 whitespace-pre-wrap leading-relaxed">{data.medication}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!data.memo && !data.detailedContent && !data.doctorInquiry && 
             !data.bloodType && !data.underlyingDisease && !data.medication && (
              <div className="bg-white p-6 rounded-[20px] border border-slate-100 text-center">
                <p className="text-sm text-slate-400 font-medium">작성된 특별 요청사항 및 건강 정보가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 bg-white border-t border-slate-100">
          <button onClick={onClose}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 transition-colors shadow-[0_4px_14px_rgba(15,23,42,0.2)] active:scale-[0.98]">
            확인 완료
          </button>
        </div>
      </motion.div>
    </div>
  );
}