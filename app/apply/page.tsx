'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Calendar, MapPin, User, FileText, ArrowLeft, CheckCircle2, Search, Car, Accessibility, HeartPulse, Stethoscope, Building2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DaumPostcodeEmbed from 'react-daum-postcode';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { reservationApi, authApi } from '@/src/api/index';

export default function ApplyPage() {
  const router = useRouter();
  const [postTarget, setPostTarget] = useState<'none' | 'hospital' | 'meeting'>('none');

  // 🌟 통합 데이터 관리 보관함
  const [formData, setFormData] = useState({
    date: '', 
    time: '', 
    hospitalName: '', 
    patientName: '',
    patientPhone: '', 
    guardianName: '', 
    guardianPhone: '',
    category: '일반 진료', 
    memo: '', 
    requirements: '', 
    doctorInquiry: ''
  });

  const [basicExtraData, setBasicExtraData] = useState({
    meetingType: '자택',
    meetingAddress: '',
    meetingDetail: '',
    transportation: '택시 이용',
    mobility: '도보'
  });

  const [detailData, setDetailData] = useState({
    department: '', 
    symptoms: '', 
    needPharmacy: '필요함',
    testType: '', 
    isFasting: '금식 완료'
  });

  // 내 정보 가져오기 및 자동 입력 (기본 정보 섹션용)
  useEffect(() => {
    authApi.getMe().then(res => {
      setFormData(prev => ({
        ...prev,
        patientName: res.data.name || '',
        patientPhone: res.data.phoneNumber || '',
        guardianName: res.data.guardianName || '',
        guardianPhone: res.data.guardianPhone || ''
      }));
    }).catch(err => console.log("사용자 정보를 불러올 수 없습니다."));
  }, []);

  const handleSmartChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePostComplete = (data: any) => {
    let fullAddress = data.address;
    if (data.buildingName) {
      fullAddress += ` (${data.buildingName})`;
    }

    if (postTarget === 'hospital') {
      setFormData({ ...formData, hospitalName: fullAddress });
    } else if (postTarget === 'meeting') {
      setBasicExtraData({ ...basicExtraData, meetingAddress: fullAddress });
    }
    setPostTarget('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalMeetingPoint = basicExtraData.meetingType === '자택' 
        ? '자택' 
        : `${basicExtraData.meetingAddress} /// ${basicExtraData.meetingDetail}`.trim();

      const combinedDetailedContent = formData.category === '일반 진료'
        ? `- 진료 과목: ${detailData.department}\n- 주요 증상: ${detailData.symptoms}\n- 약국 동행: ${detailData.needPharmacy}`
        : `- 검사 종류: ${detailData.testType}\n- 금식 여부: ${detailData.isFasting}\n- 약국 동행: ${detailData.needPharmacy}`;

      const requestBody = {
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        hospitalName: formData.hospitalName,
        reservationTime: `${formData.date}T${formData.time}:00`,
        category: formData.category,
        meetingPoint: finalMeetingPoint,
        transportation: basicExtraData.transportation,
        mobility: basicExtraData.mobility,
        requirements: formData.memo,
        detailedContent: combinedDetailedContent,
        doctorInquiry: formData.doctorInquiry
      };

      await reservationApi.create(requestBody);
      await Swal.fire({ 
        icon: 'success', 
        title: '신청 완료', 
        text: '동행 서비스 예약이 성공적으로 접수되었습니다.', 
        confirmButtonColor: '#1e3a8a' 
      });
      router.push('/mypage');
    } catch (error) {
      Swal.fire({ icon: 'error', title: '신청 실패', text: '입력 내용을 다시 확인해 주세요.' });
    }
  };

  // 🌟 Framer Motion 애니메이션 설정 복원
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      
      {/* 주소 검색 모달 */}
      {postTarget !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">주소 검색</h3>
              <button onClick={() => setPostTarget('none')} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="h-[450px]">
              <DaumPostcodeEmbed onComplete={handlePostComplete} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-6 pt-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-10">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-white shadow-sm border border-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">서비스 예약 신청</h2>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* 🌟 1. 일정 및 장소 선택 */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl"><Calendar className="w-6 h-6 text-blue-600" /></div>
              1. 일정 및 장소 선택
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">진료 날짜</label>
                  <input type="date" name="date" onChange={handleSmartChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">진료 시간</label>
                  <input type="time" name="time" onChange={handleSmartChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-gray-800" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">방문 병원</label>
                <div className="flex gap-2">
                  <input type="text" name="hospitalName" value={formData.hospitalName} placeholder="병원을 검색하거나 직접 입력하세요" onChange={handleSmartChange} className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-gray-800" required />
                  <button type="button" onClick={() => setPostTarget('hospital')} className="px-6 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-colors shadow-md flex items-center justify-center">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🌟 2. 기본 정보 입력 */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl"><User className="w-6 h-6 text-emerald-600" /></div>
              2. 기본 정보 입력
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">실제 이용자 성함 (환자)</label>
                  <input type="text" name="patientName" value={formData.patientName} onChange={handleSmartChange} placeholder="예: 홍길동" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium text-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">환자 연락처</label>
                  <input type="text" name="patientPhone" value={formData.patientPhone} onChange={handleSmartChange} placeholder="010-0000-0000" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium text-gray-800" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">보호자 성함</label>
                  <input type="text" name="guardianName" value={formData.guardianName} onChange={handleSmartChange} placeholder="예: 김보호 (자녀)" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium text-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">보호자 비상연락처</label>
                  <input type="text" name="guardianPhone" value={formData.guardianPhone} onChange={handleSmartChange} placeholder="010-0000-0000" className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium text-gray-800" required />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🌟 3. 동행 기본 정보 */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-orange-50 rounded-xl"><MapPin className="w-6 h-6 text-orange-600" /></div>
              3. 동행 기본 정보
            </h3>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-3 ml-1">매니저와 만나는 장소</label>
                <div className="flex gap-3 mb-4">
                  {['자택', '직접 지정'].map((type) => (
                    <button 
                      key={type} 
                      type="button" 
                      onClick={() => setBasicExtraData({...basicExtraData, meetingType: type})} 
                      className={`flex-1 py-4 rounded-2xl font-bold text-base transition-all border-2 ${basicExtraData.meetingType === type ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {basicExtraData.meetingType === '직접 지정' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                    <div className="flex gap-2">
                      <input type="text" value={basicExtraData.meetingAddress} readOnly placeholder="장소를 검색하세요" className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-gray-800" />
                      <button type="button" onClick={() => setPostTarget('meeting')} className="px-6 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-colors shadow-md flex items-center justify-center">
                        <Search className="w-5 h-5" />
                      </button>
                      
                      {/* ✨ 병원 주소 가져오기 버튼 */}
                      <button 
                        type="button" 
                        onClick={() => {
                          if(!formData.hospitalName) return Swal.fire('알림', '먼저 1번 항목에서 방문 병원을 입력해주세요.', 'warning');
                          setBasicExtraData({...basicExtraData, meetingAddress: formData.hospitalName});
                        }} 
                        className="px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap flex items-center gap-1"
                      >
                        <Building2 className="w-4 h-4"/> 병원
                      </button>
                    </div>
                    <input type="text" placeholder="상세 위치를 입력하세요 (예: 본관 1층 로비 키오스크 앞)" value={basicExtraData.meetingDetail} onChange={(e) => setBasicExtraData({...basicExtraData, meetingDetail: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none font-medium text-gray-800" />
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-3 ml-1">이동 수단</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['택시 이용', '자차 이용', '도보/대중교통'].map((item) => (
                      <button key={item} type="button" onClick={() => setBasicExtraData({...basicExtraData, transportation: item})} className={`py-4 px-5 rounded-2xl font-bold text-[15px] transition-all text-left flex items-center justify-between border-2 ${basicExtraData.transportation === item ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                        {item} {basicExtraData.transportation === item && <Car className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-3 ml-1">환자 거동 상태</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['도보', '부축 필요', '휠체어'].map((item) => (
                      <button key={item} type="button" onClick={() => setBasicExtraData({...basicExtraData, mobility: item})} className={`py-4 px-5 rounded-2xl font-bold text-[15px] transition-all text-left flex items-center justify-between border-2 ${basicExtraData.mobility === item ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                        {item} {basicExtraData.mobility === item && <Accessibility className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🌟 4. 검사 상세 정보 */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-rose-50 rounded-xl"><Stethoscope className="w-6 h-6 text-rose-600" /></div>
              4. 검사 상세 정보
            </h3>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-3 ml-1">동행 목적 구분</label>
                <div className="flex gap-3">
                  {['일반 진료', '정밀 검사'].map((cat) => (
                    <button key={cat} type="button" onClick={() => setFormData({...formData, category: cat})} className={`flex-1 py-4 rounded-2xl font-bold text-base transition-all border-2 ${formData.category === cat ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {formData.category === '일반 진료' ? (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">진료 과목</label>
                      <input type="text" placeholder="예) 내과, 정형외과" value={detailData.department} onChange={(e) => setDetailData({...detailData, department: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all outline-none font-medium text-gray-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">주요 증상</label>
                      <input type="text" placeholder="예) 기침, 무릎 통증" value={detailData.symptoms} onChange={(e) => setDetailData({...detailData, symptoms: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all outline-none font-medium text-gray-800" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">검사 종류</label>
                      <input type="text" placeholder="예) 위/대장 수면 내시경" value={detailData.testType} onChange={(e) => setDetailData({...detailData, testType: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all outline-none font-medium text-gray-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">금식 여부</label>
                      <div className="flex gap-2 h-[54px]">
                        {['금식 완료', '해당 없음'].map((f) => (
                          <button key={f} type="button" onClick={() => setDetailData({...detailData, isFasting: f})} className={`flex-1 rounded-2xl text-[13px] font-bold transition-all border-2 ${detailData.isFasting === f ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">보호자 특별 요청사항 (메모)</label>
                <textarea 
                  name="memo" 
                  rows={3} 
                  placeholder="예) 치매 초기 증상이 있으십니다. 휠체어 이용 도움이 필요합니다." 
                  onChange={handleSmartChange} 
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none font-medium text-gray-800"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-amber-600 mb-2 ml-1">의사 선생님께 꼭 여쭤봐야 할 질문 (선택)</label>
                <textarea 
                  name="doctorInquiry" 
                  rows={3} 
                  placeholder="예) 고혈압 약을 먹고 있는데, 이번에 처방받는 약과 같이 먹어도 되는지 여쭤봐주세요." 
                  onChange={handleSmartChange} 
                  className="w-full px-5 py-4 rounded-2xl bg-amber-50/30 border border-amber-200 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none resize-none font-medium text-amber-900 placeholder:text-amber-700/50"
                ></textarea>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-6">
            <button type="submit" className="w-full bg-blue-950 text-white text-xl font-bold py-6 rounded-[24px] shadow-xl hover:bg-blue-900 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
              <CheckCircle2 className="w-7 h-7" /> 동행 서비스 신청 완료하기
            </button>
          </motion.div>
        </motion.form>
      </main>
    </div>
  );
}