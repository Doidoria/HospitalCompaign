// src/components/admin/modals/ReservationEditModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { X, Loader2, CalendarDays, MapPin, Stethoscope, HelpCircle, FileText, Navigation, Car, Accessibility, Search, Building2 } from 'lucide-react';
import { adminApi } from '@/src/api/index';
import { Toast } from '@/src/utils/alert';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequest: any | null;
  onSuccess: () => void;
}

export default function EditModal({ isOpen, onClose, selectedRequest, onSuccess }: EditModalProps) {
  const [submitting, setSubmitting] = useState(false);
  
  // 1. 기본 텍스트 데이터 상태
  const [formData, setFormData] = useState({
    hospitalName: '',
    reservationTime: '',
    transportation: '택시 이용',
    mobility: '독립 보행 가능',
    requirements: '',
    detailedContent: '',
    doctorInquiry: ''
  });

  const [category, setCategory] = useState('일반 진료');
  const [detailData, setDetailData] = useState({
    department: '', symptoms: '', testType: '', isFasting: '해당 없음'
  });

  const [postTarget, setPostTarget] = useState<'none' | 'hospital' | 'meeting'>('none');

  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    if (data.buildingName) fullAddress += ` (${data.buildingName})`;
    
    if (postTarget === 'hospital') {
      setFormData(prev => ({ ...prev, hospitalName: fullAddress }));
    } else if (postTarget === 'meeting') {
      setMeetingData(prev => ({ ...prev, address: fullAddress }));
    }
    setPostTarget('none');
  };

  // 2. 만나는 장소 (자택 vs 직접 지정 분리) 상태
  const [meetingData, setMeetingData] = useState({
    type: '자택',
    address: '',
    detail: ''
  });

  // 모달이 열리거나 대상 예약이 바뀔 때 기존 값 세팅
  useEffect(() => {
    if (selectedRequest && isOpen) {
      const formattedTime = selectedRequest.reservationTime 
        ? selectedRequest.reservationTime.substring(0, 16) 
        : '';

      setFormData({
        hospitalName: selectedRequest.hospitalName || '',
        reservationTime: formattedTime,
        transportation: selectedRequest.transportation || '택시 이용',
        mobility: selectedRequest.mobility || '독립 보행 가능',
        requirements: selectedRequest.requirements || '',
        detailedContent: selectedRequest.detailedContent || '',
        doctorInquiry: selectedRequest.doctorInquiry || ''
      });

      setCategory(selectedRequest.category || '일반 진료');
      
      const parsed = { department: '', symptoms: '', testType: '', isFasting: '해당 없음'};
      if (selectedRequest.detailedContent) {
        const lines = selectedRequest.detailedContent.split('\n');
        lines.forEach((line: string) => {
          if (line.includes('진료 과목:')) parsed.department = line.replace('- 진료 과목:', '').trim();
          if (line.includes('주요 증상:')) parsed.symptoms = line.replace('- 주요 증상:', '').trim();
          if (line.includes('검사 종류:')) parsed.testType = line.replace('- 검사 종류:', '').trim();
          if (line.includes('금식 여부:')) parsed.isFasting = line.replace('- 금식 여부:', '').trim();
        });
      }
      setDetailData(parsed);

      // 백엔드의 meetingPoint 값 파싱 ('///' 기준 분리)
      let mType = '자택';
      let mAddr = '';
      let mDetail = '';
      
      if (selectedRequest.meetingPoint && selectedRequest.meetingPoint !== '자택') {
        mType = '직접 지정';
        const parts = selectedRequest.meetingPoint.split('///');
        mAddr = parts[0]?.trim() || selectedRequest.meetingPoint;
        mDetail = parts[1]?.trim() || '';
      }

      setMeetingData({ type: mType, address: mAddr, detail: mDetail });
    }
  }, [selectedRequest, isOpen]);

  if (!isOpen || !selectedRequest) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 만나는 장소 문자열 재조합
      const finalMeetingPoint = meetingData.type === '자택' 
        ? '자택' 
        : `${meetingData.address} /// ${meetingData.detail}`.trim();
      
      const combinedDetail = category === '일반 진료'
        ? `- 진료 과목: ${detailData.department}\n- 주요 증상: ${detailData.symptoms}`
        : `- 검사 종류: ${detailData.testType}\n- 금식 여부: ${detailData.isFasting}`;

      const requestData = {
        ...formData,
        category: category,
        detailedContent: combinedDetail,
        meetingPoint: finalMeetingPoint
      };

      await adminApi.updateReservation(selectedRequest.id, requestData);
      Toast.fire({ icon: 'success', title: '예약 정보가 성공적으로 변경되었습니다.' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: '정보 변경에 실패했습니다. 입력값을 확인해주세요.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6"
      >
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="bg-[#F8FAFC] rounded-[28px] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_20px_60px_-15px_rgba(15,23,42,0.3)]"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100 rounded-t-[28px]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">예약 일정 및 정보 변경</h3>
                <p className="text-xs text-slate-400 mt-0.5">환자명: {selectedRequest.patientName} 님</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 바디 (스크롤 영역) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar touch-pan-y overscroll-contain">
            
            {/* 1. 병원 및 일정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-500" /> 희망 병원명
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" name="hospitalName" value={formData.hospitalName} readOnly onClick={() => setPostTarget('hospital')} placeholder="검색 버튼을 누르세요" required
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                    />
                    <button type="button" onClick={() => setPostTarget('hospital')} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center shadow-sm">
                        <Search className="w-4 h-4" />
                    </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> 예약 일시
                </label>
                <input 
                  type="datetime-local" name="reservationTime" value={formData.reservationTime} onChange={handleChange} required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* 2. 동행 정보 (버튼 선택형 UI 적용 부분) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm">
              
              {/* 장소 선택 */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" /> 만나는 장소
                </label>
                <div className="flex gap-2 mb-3">
                  {['자택', '직접 지정'].map((type) => (
                    <button 
                      key={type} type="button" 
                      onClick={() => setMeetingData({...meetingData, type})} 
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${meetingData.type === type ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {meetingData.type === '직접 지정' && (
                  <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                      <div className="flex gap-2">
                        <input type="text" placeholder="장소 검색" readOnly value={meetingData.address} 
                            className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none" 
                        />
                        <button type="button" onClick={() => setPostTarget('meeting')} className="w-10 shrink-0 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center">
                            <Search className="w-4 h-4" />
                        </button>
                        <button type="button" 
                            onClick={() => {
                              if(!formData.hospitalName) return Toast.fire({ icon: 'warning', title: '병원 주소를 먼저 입력해주세요.' });
                              setMeetingData({...meetingData, address: formData.hospitalName});
                            }} 
                            className="w-14 shrink-0 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1 whitespace-nowrap text-xs"
                        >
                            <Building2 className="w-3 h-3"/> 병원
                        </button>
                      </div>
                      <input 
                      type="text" placeholder="상세 위치 (예: 본관 1층 로비)" 
                      value={meetingData.detail} onChange={(e) => setMeetingData({...meetingData, detail: e.target.value})} 
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white" 
                      />
                  </div>
                )}
              </div>

              {/* 이동 수단 선택 */}
              <div className="sm:col-span-1.5">
                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-slate-500" /> 이동 수단
                </label>
                <div className="flex flex-col gap-2">
                  {['택시 이용', '자차 이용', '도보/대중교통'].map((item) => (
                    <button 
                      key={item} type="button" 
                      onClick={() => setFormData({...formData, transportation: item})} 
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border-2 ${formData.transportation === item ? 'border-slate-800 bg-slate-800 text-white shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 거동 상태 선택 */}
              <div className="sm:col-span-1.5">
                <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                  <Accessibility className="w-3.5 h-3.5 text-slate-500" /> 환자 거동 상태
                </label>
                <div className="flex flex-col gap-2">
                  {['독립 보행 가능', '부축 필요', '휠체어'].map((item) => (
                    <button 
                      key={item} type="button" 
                      onClick={() => setFormData({...formData, mobility: item})} 
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border-2 ${formData.mobility === item ? 'border-slate-800 bg-slate-800 text-white shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. 3단 분할 내용 편집 영역 */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> 보호자 전달 및 기본 요구사항
                </label>
                <textarea 
                  name="requirements" value={formData.requirements} onChange={handleChange} rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              {/* 파란 박스: 어드민 모달용 UI (개선본) */}
              <div className="bg-white p-5 rounded-[20px] border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <label className="block text-sm font-extrabold text-blue-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-blue-600" /> 상세 진료 및 검사 내용
                  </label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 outline-none text-blue-800 bg-blue-50 cursor-pointer font-bold focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="일반 진료">일반 진료</option>
                    <option value="정밀 검사">정밀 검사</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {category === '일반 진료' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">진료 과목</span>
                        <input type="text" value={detailData.department} onChange={e => setDetailData({...detailData, department: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="예: 내과" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">주요 증상</span>
                        <input type="text" value={detailData.symptoms} onChange={e => setDetailData({...detailData, symptoms: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="예: 기침, 발열" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">검사 종류</span>
                        <input type="text" value={detailData.testType} onChange={e => setDetailData({...detailData, testType: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="예: 수면 내시경" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">금식 여부</span>
                        <div className="flex gap-2">
                          {['금식 완료', '해당 없음'].map(f => (
                             <button key={f} type="button" onClick={() => setDetailData({...detailData, isFasting: f})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${detailData.isFasting === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{f}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-[20px] border border-orange-50 shadow-sm">
                <label className="block text-xs font-bold text-orange-800 mb-1.5 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-orange-500" /> 의사 선생님께 여쭤볼 질문
                </label>
                <textarea 
                  name="doctorInquiry" value={formData.doctorInquiry} onChange={handleChange} rows={3}
                  className="w-full p-3 bg-orange-50/20 border border-orange-100 rounded-xl text-xs font-medium text-orange-900 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

          </div>

          {/* 푸터 액션 버튼 */}
          <div className="flex items-center gap-2 p-5 bg-white border-t border-slate-100 rounded-b-[28px]">
            <button 
              type="button" onClick={onClose} disabled={submitting}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs"
            >
              취소
            </button>
            <button 
              type="submit" disabled={submitting}
              className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  변경 사항 저장 중...
                </>
              ) : (
                '수정 완료'
              )}
            </button>
          </div>
        </motion.form>
        {postTarget !== 'none' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm rounded-[28px]">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800 text-lg">주소 검색</h3>
                <button type="button" onClick={() => setPostTarget('none')} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="h-[400px]">
                <DaumPostcodeEmbed onComplete={handleCompletePost} style={{ height: '100%' }} />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}