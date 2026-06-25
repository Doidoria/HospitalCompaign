// app/manager/proxy/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { 
  CalendarPlus, ArrowLeft, Loader2, CheckCircle2, Calendar, X, MapPin, User,
  Stethoscope, Car, Accessibility, Info, Search, Building2, HelpCircle, Activity
} from 'lucide-react';
import { reservationApi, reportApi } from '@/src/api/index';
import { useSearchParams } from 'next/navigation';
import { Toast, YesAlert, MySwal } from '@/src/utils/alert';

export default function ProxyReservationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams(); 
  const defaultDate = searchParams.get('date') || '';
  const defaultTime = searchParams.get('time') || '';
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 주소 검색 모달 타겟 상태
  const [postTarget, setPostTarget] = useState<'none' | 'hospital' | 'meeting'>('none');

  const HOURS = Array.from({ length: 10 }, (_, i) => String(i + 9).padStart(2, '0'));
  const MINUTES = ['00', '10', '20', '30', '40', '50'];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  tomorrowDate.setHours(tomorrowDate.getHours() + 9);
  const minDate = tomorrowDate.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    revisitCount: '1차 재방문',
    date: defaultDate,
    time: defaultTime,
    hospitalName: '',
    guardianName: '',
    guardianPhone: '',
    requirements: '',
    doctorInquiry: '',
    bloodType: '',
    underlyingDisease: '',
    medication: '',
    preparedDocuments: ''
  });

  const [category, setCategory] = useState('일반 진료');

  // 동행 기본 정보 (만나는 장소 파싱용)
  const [basicExtraData, setBasicExtraData] = useState({
    meetingType: '자택',
    meetingAddress: '',
    meetingDetail: '',
    transportation: '택시 이용',
    mobility: '독립 보행 가능'
  });

  // 진료 상세 정보 (텍스트 파싱용)
  const [detailData, setDetailData] = useState({
    department: '', 
    symptoms: '', 
    testType: '', 
    isFasting: '해당 없음'
  });

  useEffect(() => {
    const fetchOriginalReservation = async () => {
      try {
        const res = await reservationApi.getDetail(params.id as string);
        const data = res.data;
        
        setFormData(prev => ({
          ...prev,
          hospitalName: data.hospitalName || '',
          guardianName: data.guardianName || '',
          guardianPhone: data.guardianPhone || '',
          requirements: data.requirements || data.memo || '',
          doctorInquiry: data.doctorInquiry || '',
          bloodType: data.bloodType || '',
          underlyingDisease: data.underlyingDisease || '',
          medication: data.medication || '',
          preparedDocuments: data.preparedDocuments || ''
        }));

        try {
          const reportRes = await reportApi.getReportByReservationId(params.id as string);
          
          if (reportRes.data && reportRes.data.nextSchedule) {
            const [nDate, nTimeFull] = reportRes.data.nextSchedule.split('T');
            const nTime = nTimeFull ? nTimeFull.substring(0, 5) : '';

            // nDate가 선택 가능한 최소 날짜(minDate)보다 과거가 아닐 때만 자동 입력
            if (nDate >= minDate) {
              setFormData(prev => ({
                ...prev,
                date: nDate || '',
                time: nTime || ''
              }));
            }
          }
        } catch (reportError) {
          console.log("리포트 정보가 없거나 일정이 없습니다.");
        }

        setCategory(data.category || '일반 진료');

        // 상세 내용 파싱
        const parsed = { department: '', symptoms: '', testType: '', isFasting: '해당 없음'};
        if (data.detailedContent) {
          const lines = data.detailedContent.split('\n');
          lines.forEach((line: string) => {
            if (line.includes('진료 과목:')) parsed.department = line.replace('- 진료 과목:', '').trim();
            if (line.includes('주요 증상:')) parsed.symptoms = line.replace('- 주요 증상:', '').trim();
            if (line.includes('검사 종류:')) parsed.testType = line.replace('- 검사 종류:', '').trim();
            if (line.includes('금식 여부:')) parsed.isFasting = line.replace('- 금식 여부:', '').trim();
          });
        }
        setDetailData(parsed);

        // 만나는 장소 파싱
        let mType = '자택';
        let mAddr = '';
        let mDetail = '';
        if (data.meetingPoint && data.meetingPoint !== '자택') {
          mType = '직접 지정';
          const parts = data.meetingPoint.split('///');
          mAddr = parts[0]?.trim() || '';
          mDetail = parts[1]?.trim() || '';
        }

        setBasicExtraData({
          meetingType: mType,
          meetingAddress: mAddr,
          meetingDetail: mDetail,
          transportation: data.transportation || '택시 이용',
          mobility: data.mobility || '독립 보행 가능'
        });

      } catch (error) {
        MySwal.fire({ icon: 'error', title: '오류', text: '기존 예약 정보를 불러올 수 없습니다.' });
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchOriginalReservation();
  }, [params.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeSelect = (type: 'hour' | 'minute', value: string) => {
    const currentHour = formData.time ? formData.time.split(':')[0] : '09';
    const currentMinute = formData.time ? formData.time.split(':')[1] : '00';
    let newHour = type === 'hour' ? value : currentHour;
    let newMinute = type === 'minute' ? value : currentMinute;

    if (newHour === '18') newMinute = '00';
    setFormData(prev => ({ ...prev, time: `${newHour}:${newMinute}` }));
  };

  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    let bName = data.buildingName || '';

    const hospitalKeywords = ['병원', '의원', '치과', '한의원', '보건소', '센터', '클리닉', '대학'];
    const isHospital = hospitalKeywords.some(keyword => bName.includes(keyword) || fullAddress.includes(keyword));

    if (bName) fullAddress += ` (${bName})`;

    const currentTarget = postTarget;
    setPostTarget('none');

    if (currentTarget === 'hospital' && !isHospital) {
      MySwal.fire({
        title: '병원이 맞나요?',
        text: `선택하신 주소(${bName || '건물명 없음'})에서 병원 관련 단어가 발견되지 않았습니다. 그래도 등록하시겠습니까?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ea580c',
        cancelButtonColor: '#94A3B8',
        confirmButtonText: '네, 병원 맞습니다',
        cancelButtonText: '다시 검색하기'
      }).then((result) => {
        if (result.isConfirmed) {
          setFormData(prev => ({ ...prev, hospitalName: fullAddress }));
        } else {
          setTimeout(() => setPostTarget('hospital'), 300);
        }
      });
    } else {
      if (currentTarget === 'hospital') {
        setFormData(prev => ({ ...prev, hospitalName: fullAddress }));
      } else if (currentTarget === 'meeting') {
        setBasicExtraData(prev => ({ ...prev, meetingAddress: fullAddress }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time || !formData.hospitalName) {
      return MySwal.fire({ icon: 'warning', title: '입력 확인', text: '방문 일시와 병원명은 필수입니다.' });
    }

    setIsSubmitting(true);
    try {
      // 1. 만나는 장소 조합
      const finalMeetingPoint = basicExtraData.meetingType === '자택' 
        ? '자택' 
        : `${basicExtraData.meetingAddress} /// ${basicExtraData.meetingDetail}`.trim();

      // 2. 상세 내용 조합
      const combinedDetail = category === '일반 진료'
        ? `- 진료 과목: ${detailData.department}\n- 주요 증상: ${detailData.symptoms}`
        : `- 검사 종류: ${detailData.testType}\n- 금식 여부: ${detailData.isFasting}`;

      const payload = {
        reservationTime: `${formData.date}T${formData.time}:00`,
        revisitCount: formData.revisitCount,
        hospitalName: formData.hospitalName,
        category: category,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        meetingPoint: finalMeetingPoint,
        transportation: basicExtraData.transportation,
        mobility: basicExtraData.mobility,
        requirements: formData.requirements,
        detailedContent: combinedDetail,
        doctorInquiry: formData.doctorInquiry,
        bloodType: formData.bloodType,
        underlyingDisease: formData.underlyingDisease,
        medication: formData.medication,
        preparedDocuments: formData.preparedDocuments,
        memo: "재방문 대리 신청"
      };

      await reservationApi.createProxy(Number(params.id), payload);
      await MySwal.fire({ 
        icon: 'success', 
        title: '대리 신청 완료', 
        text: '다음 일정이 성공적으로 접수되었으며, 고객님께 접수 안내 알림톡이 발송되었습니다.', 
        confirmButtonColor: '#ea580c' 
      });
      router.push('/manager/dashboard');
    } catch (error) {
      MySwal.fire({ icon: 'error', title: '신청 실패', text: '서버 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedHour = formData.time ? formData.time.split(':')[0] : '';
  const selectedMinute = formData.time ? formData.time.split(':')[1] : '';

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
      
      {/* 주소 검색 모달 */}
      {postTarget !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">주소 검색</h3>
              <button onClick={() => setPostTarget('none')} className="text-gray-400 hover:text-red-500 transition-colors p-1"><X className="w-6 h-6" /></button>
            </div>
            <div className="h-[470px]">
              <DaumPostcodeEmbed onComplete={handleCompletePost} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-5 pt-8">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-2xl font-extrabold flex items-center gap-2 tracking-tight">
            <CalendarPlus className="w-7 h-7 text-orange-500" /> 대리 신청
          </h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
          className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-[20px] shadow-sm flex items-start gap-3 text-orange-800"
        >
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-orange-500" />
          <p className="text-[14px] font-medium leading-relaxed">
            기존 환자님의 정보가 자동으로 불려옵니다.<br/>
            <strong>다음 일정과 변경된 내용만 수정</strong>하여 빠르게 접수하세요.
          </p>
        </motion.div>

        <motion.form onSubmit={handleSubmit} className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
          
          {/* 1. 재방문 일정 및 병원 선택 */}
          <motion.div variants={itemVariants} className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-50 pb-4">
              <div className="p-2 bg-orange-50 rounded-xl"><Calendar className="w-5 h-5 text-orange-600" /></div>
              1. 다음 일정 및 병원 선택
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-3 ml-1">재방문 회차</label>
                <div className="flex flex-wrap gap-2">
                    {['1차 재방문', '2차 재방문', '3차 재방문', '4차 재방문'].map(count => (
                        <button key={count} type="button" onClick={() => setFormData({...formData, revisitCount: count})}
                        className={`px-4 py-2.5 rounded-xl font-bold text-[13px] transition-all border-2 ${formData.revisitCount === count ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}>
                        {count}
                        </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">방문 날짜 <span className="text-red-500">*</span></label>
                  <input type="date" name="date" min={minDate} value={formData.date} onChange={handleChange} 
                  className="w-full px-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 
                  focus:ring-orange-500 transition-all outline-none font-bold text-gray-800 text-sm md:text-base" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">방문 시간 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 text-sm md:text-base">
                      <select value={selectedHour} onChange={(e) => handleTimeSelect('hour', e.target.value)} 
                      className="w-full px-3 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 
                      focus:ring-orange-500 transition-all outline-none font-bold text-gray-800 appearance-none text-center">
                        <option value="" disabled>시</option>
                        {HOURS.map(h => <option key={h} value={h}>{h}시</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-center font-bold text-gray-400">:</div>
                    <div className="relative flex-1 text-sm md:text-base">
                      <select value={selectedMinute} onChange={(e) => handleTimeSelect('minute', e.target.value)} disabled={selectedHour === '18'} 
                      className="w-full px-3 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 
                      focus:ring-orange-500 transition-all outline-none font-bold text-gray-800 appearance-none text-center disabled:opacity-50">
                        <option value="" disabled>분</option>
                        {MINUTES.map(m => <option key={m} value={m}>{m}분</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">방문 병원 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                    <input type="text" name="hospitalName" value={formData.hospitalName} readOnly onClick={() => setPostTarget('hospital')} placeholder="병원 검색" 
                    className="w-[calc(100%-80px)] px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-800 outline-none cursor-pointer text-sm" />
                    <button type="button" onClick={() => setPostTarget('hospital')} className="w-[72px] bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center whitespace-nowrap text-sm shrink-0">
                        <Search className="w-4 h-4 mr-1" /> 검색
                    </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. 장소 및 이동 정보 */}
          <motion.div variants={itemVariants} className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-50 pb-4">
              <div className="p-2 bg-blue-50 rounded-xl"><MapPin className="w-5 h-5 text-blue-600" /></div>
              2. 장소 및 이동 정보
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-3 ml-1">매니저와 만나는 장소</label>
                <div className="flex gap-3 mb-4">
                  {['자택', '직접 지정'].map((type) => (
                    <button key={type} type="button" onClick={() => setBasicExtraData({...basicExtraData, meetingType: type})} 
                      className={`flex-1 py-3.5 rounded-2xl font-bold text-[14px] transition-all border-2 ${basicExtraData.meetingType === type ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}>
                      {type}
                    </button>
                  ))}
                </div>

                {basicExtraData.meetingType === '직접 지정' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex gap-2">
                        <input type="text" value={basicExtraData.meetingAddress} readOnly placeholder="장소 검색" className="flex-1 min-w-0 px-3 py-3.5 rounded-xl bg-gray-50 border border-gray-100 outline-none text-gray-800 text-sm" />
                        <button type="button" onClick={() => setPostTarget('meeting')} className="w-12 shrink-0 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center justify-center">
                            <Search className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => {
                            if(!formData.hospitalName) return MySwal.fire('알림', '먼저 방문 병원을 입력해주세요.', 'warning');
                            setBasicExtraData({...basicExtraData, meetingAddress: formData.hospitalName});
                            }} 
                            className="w-16 shrink-0 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-[13px]"
                        >
                            <Building2 className="w-3.5 h-3.5"/> 병원
                        </button>
                    </div>
                    <input type="text" placeholder="상세 위치를 입력하세요 (예: 본관 1층 로비 키오스크 앞)" value={basicExtraData.meetingDetail} onChange={(e) => setBasicExtraData({...basicExtraData, meetingDetail: e.target.value})} 
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-gray-800" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-3 ml-1">이동 수단</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {['택시 이용', '자차 이용', '도보/대중교통'].map(item => (
                     <button key={item} type="button" onClick={() => setBasicExtraData({...basicExtraData, transportation: item})} 
                      className={`py-3.5 px-4 rounded-2xl font-bold text-[14px] transition-all border-2 flex items-center justify-between ${basicExtraData.transportation === item ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                       {item} {basicExtraData.transportation === item && <Car className="w-4 h-4" />}
                     </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-3 ml-1">환자 거동 상태</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {['독립 보행 가능', '부축 필요', '휠체어 이용'].map(item => (
                     <button key={item} type="button" onClick={() => setBasicExtraData({...basicExtraData, mobility: item})} 
                      className={`py-3.5 px-4 rounded-2xl font-bold text-[14px] transition-all border-2 flex items-center justify-between ${basicExtraData.mobility === item ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                       {item} {basicExtraData.mobility === item && <Accessibility className="w-4 h-4" />}
                     </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. 진료 및 요청사항 */}
          <motion.div variants={itemVariants} className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-50 pb-4">
              <div className="p-2 bg-emerald-50 rounded-xl"><Stethoscope className="w-5 h-5 text-emerald-600" /></div>
              3. 상세 진료 및 요청사항
            </h3>
            
            <div className="space-y-6">
              <div className="bg-blue-50/40 p-5 rounded-[20px] border border-blue-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 border-b border-blue-200/60 pb-4 gap-3">
                  <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    상세 진료 및 검사 내용
                  </label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-sm border border-blue-200 rounded-xl px-3 py-2 outline-none text-blue-800 bg-white cursor-pointer font-bold shadow-sm focus:ring-2 focus:ring-blue-400">
                    <option value="일반 진료">일반 진료</option>
                    <option value="정밀 검사">정밀 검사</option>
                  </select>
                </div>
                
                {category === '일반 진료' ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-blue-800 mb-2 block ml-1">진료 과목</span>
                      <input type="text" value={detailData.department} onChange={e => setDetailData({...detailData, department: e.target.value})} className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800" placeholder="예) 내과, 정형외과" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-800 mb-2 block ml-1">주요 증상</span>
                      <input type="text" value={detailData.symptoms} onChange={e => setDetailData({...detailData, symptoms: e.target.value})} className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800" placeholder="예) 기침, 무릎 통증" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-blue-800 mb-2 block ml-1">검사 종류</span>
                      <input type="text" value={detailData.testType} onChange={e => setDetailData({...detailData, testType: e.target.value})} className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800" placeholder="예) 수면 내시경, MRI" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-800 mb-2 block ml-1">금식 여부</span>
                      <div className="flex gap-2">
                        {['금식 완료', '해당 없음'].map(f => (
                           <button key={f} type="button" onClick={() => setDetailData({...detailData, isFasting: f})} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${detailData.isFasting === f ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-blue-100 hover:bg-blue-50'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">보호자 특별 요청사항</label>
                <textarea name="requirements" rows={2} value={formData.requirements} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-gray-300 transition-all outline-none font-medium text-gray-800 resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-amber-600 mb-2 flex items-center gap-1.5 ml-1">
                  <HelpCircle className="w-4 h-4" /> 의사 선생님께 꼭 여쭤봐야 할 질문
                </label>
                <textarea name="doctorInquiry" rows={2} value={formData.doctorInquiry} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-amber-50/30 border border-amber-200 focus:bg-white focus:ring-2 focus:ring-amber-400 transition-all outline-none font-medium text-amber-900 resize-none"></textarea>
              </div>
            </div>
          </motion.div>

          {/* 4. 환자 사전 건강 정보 */}
          <motion.div variants={itemVariants} className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-50 pb-4">
              <div className="p-2 bg-rose-50 rounded-xl"><Activity className="w-5 h-5 text-rose-600" /></div>
              4. 환자 사전 건강 정보
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">혈액형</label>
                  <input type="text" name="bloodType" value={formData.bloodType} onChange={handleChange} placeholder="예) A형 (Rh+)" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-400 transition-all text-gray-800 font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">필요 지참 서류</label>
                  <input type="text" name="preparedDocuments" value={formData.preparedDocuments} onChange={handleChange} placeholder="예) 신분증, 기존 처방전" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-400 transition-all text-gray-800 font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">주요 기저질환</label>
                <textarea name="underlyingDisease" rows={2} value={formData.underlyingDisease} onChange={handleChange} placeholder="환자분이 앓고 계신 만성 질환이나 주의 성분을 적어주세요." 
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-rose-400 transition-all outline-none font-medium text-gray-800 resize-none text-sm"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">현재 복용 중인 약</label>
                <textarea name="medication" rows={2} value={formData.medication} onChange={handleChange} placeholder="정기적으로 복용 중인 약품명이나 복약 특이사항이 있다면 명시해 주세요." 
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-rose-400 transition-all outline-none font-medium text-gray-800 resize-none text-sm"></textarea>
              </div>
            </div>
          </motion.div>

          {/* 대리 신청 완료 버튼 */}
          <motion.div variants={itemVariants} className="pt-2">
            <div className="max-w-2xl mx-auto">
              <button type="submit" disabled={isSubmitting} className="w-full bg-orange-500 text-white text-lg font-bold py-4 rounded-2xl shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                {isSubmitting ? '접수 중...' : '대리 신청 완료하기'}
              </button>
            </div>
          </motion.div>
          
        </motion.form>
      </main>
    </div>
  );
}