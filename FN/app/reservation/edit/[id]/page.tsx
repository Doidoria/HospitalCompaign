'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, MapPin, Calendar, FileText, Search, 
  MessageSquare, HelpCircle, Car, Accessibility, Building2, X 
} from 'lucide-react';
import Swal from 'sweetalert2';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { reservationApi } from '@/src/api/index';

export default function ReservationEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // 🌟 주소 검색 타겟 상태 ('none' | 'hospital' | 'meeting')
  const [postTarget, setPostTarget] = useState<'none' | 'hospital' | 'meeting'>('none');

  // 일정 및 상세 정보 보관함
  const [formData, setFormData] = useState({
    hospitalName: '', 
    date: '', 
    time: '', 
    requirements: '',     // 보호자 특별 요청사항
    detailedContent: '',  // 상세 진료 내용
    doctorInquiry: ''     // 의사 질의
  });

  // 🌟 동행 기본 정보 보관함 추가
  const [basicExtraData, setBasicExtraData] = useState({
    meetingType: '자택',
    meetingAddress: '',
    meetingDetail: '',
    transportation: '택시 이용',
    mobility: '도보'
  });

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  useEffect(() => {
    reservationApi.getDetail(id as string)
      .then(res => {
        const data = res.data;
        if (data.status !== 'WAITING' && data.status !== '매칭 대기') {
          Swal.fire('수정 불가', '매칭 대기 상태에서만 수정할 수 있습니다.', 'error');
          router.push(`/reservation/${id}`);
          return;
        }

        const [datePart, timePart] = data.reservationTime.split('T');
        setFormData({
          hospitalName: data.hospitalName,
          date: datePart,
          time: timePart.substring(0, 5),
          requirements: data.requirements || data.memo || '',
          detailedContent: data.detailedContent || '',
          doctorInquiry: data.doctorInquiry || ''
        });

        // 🌟 백엔드에서 온 만나는 장소 파싱 (자택 vs 직접 지정)
        let mType = '자택';
        let mAddr = '';
        let mDetail = '';
        
        if (data.meetingPoint && data.meetingPoint !== '자택') {
          mType = '직접 지정';
          const parts = data.meetingPoint.split('///');
          mAddr = parts[0]?.trim() || '';
          mDetail = parts[1]?.trim() || '';
        }

        // 🌟 동행 기본 정보 세팅
        setBasicExtraData({
          meetingType: mType,
          meetingAddress: mAddr,
          meetingDetail: mDetail,
          transportation: data.transportation || '택시 이용',
          mobility: data.mobility || '독립 보행 가능'
        });

      })
      .catch(err => {
        console.error(err);
        Swal.fire('오류', '데이터를 불러올 수 없습니다.', 'error');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🌟 검색 완료 시 병원/만나는장소 분기 처리
  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    if (data.buildingName) fullAddress += ` (${data.buildingName})`;
    
    if (postTarget === 'hospital') {
      setFormData(prev => ({ ...prev, hospitalName: fullAddress }));
    } else if (postTarget === 'meeting') {
      setBasicExtraData(prev => ({ ...prev, meetingAddress: fullAddress }));
    }
    setPostTarget('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedTime = `${formData.date}T${formData.time}:00`;
      
      // 🌟 만나는 장소 문자열 조합 (직접 지정 시 /// 로 구분)
      const finalMeetingPoint = basicExtraData.meetingType === '자택' 
        ? '자택' 
        : `${basicExtraData.meetingAddress} /// ${basicExtraData.meetingDetail}`.trim();

      const requestData = {
        hospitalName: formData.hospitalName,
        reservationTime: formattedTime,
        requirements: formData.requirements,
        detailedContent: formData.detailedContent,
        doctorInquiry: formData.doctorInquiry,
        meetingPoint: finalMeetingPoint,             // 🌟 추가됨
        transportation: basicExtraData.transportation, // 🌟 추가됨
        mobility: basicExtraData.mobility            // 🌟 추가됨
      };
      
      await reservationApi.update(id as string, requestData); 
      Toast.fire({ icon: 'success', title: '예약 정보가 성공적으로 수정되었습니다.' });
      router.push(`/reservation/${id}`);
      
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: 'error', title: '수정에 실패했습니다. 다시 시도해주세요.' });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans text-gray-500">데이터를 불러오는 중입니다...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      
      {/* 🌟 주소 검색 모달 */}
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
              <DaumPostcodeEmbed onComplete={handleCompletePost} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-2xl font-extrabold text-gray-800">예약 정보 수정</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. 일정 및 병원 수정 */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">1. 일정 및 병원 수정</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">방문 일시</label>
                <div className="flex gap-3">
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                  <input type="time" name="time" value={formData.time} onChange={handleChange} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> 병원 위치
                </label>
                <div className="flex gap-2">
                  <input type="text" name="hospitalName" value={formData.hospitalName} readOnly placeholder="검색 버튼을 눌러주세요" onClick={() => setPostTarget('hospital')} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none cursor-pointer" required />
                  <button type="button" onClick={() => setPostTarget('hospital')} className="bg-gray-800 text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center whitespace-nowrap shadow-sm">
                    <Search className="w-4 h-4 mr-1.5" /> 검색
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 2. 동행 기본 정보 수정 (추가된 부분) */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">2. 동행 기본 정보 수정</h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">매니저와 만나는 장소</label>
                <div className="flex gap-3 mb-4">
                  {['자택', '직접 지정'].map((type) => (
                    <button 
                      key={type} 
                      type="button" 
                      onClick={() => setBasicExtraData({...basicExtraData, meetingType: type})} 
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${basicExtraData.meetingType === type ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {basicExtraData.meetingType === '직접 지정' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-2">
                      <input type="text" value={basicExtraData.meetingAddress} readOnly placeholder="장소를 검색하세요" className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none text-gray-800" />
                      <button type="button" onClick={() => setPostTarget('meeting')} className="px-5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center">
                        <Search className="w-4 h-4" />
                      </button>
                      
                      {/* 병원 주소 가져오기 버튼 */}
                      <button 
                        type="button" 
                        onClick={() => {
                          if(!formData.hospitalName) return Swal.fire('알림', '먼저 1번 항목에서 방문 병원을 입력해주세요.', 'warning');
                          setBasicExtraData({...basicExtraData, meetingAddress: formData.hospitalName});
                        }} 
                        className="px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap flex items-center gap-1"
                      >
                        <Building2 className="w-4 h-4"/> 병원
                      </button>
                    </div>
                    <input type="text" placeholder="상세 위치를 입력하세요 (예: 본관 1층 로비 키오스크 앞)" value={basicExtraData.meetingDetail} onChange={(e) => setBasicExtraData({...basicExtraData, meetingDetail: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none font-medium text-gray-800" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">이동 수단</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['택시 이용', '자차 이용', '도보/대중교통'].map((item) => (
                      <button key={item} type="button" onClick={() => setBasicExtraData({...basicExtraData, transportation: item})} className={`py-3 px-4 rounded-xl font-bold text-[14px] transition-all text-left flex items-center justify-between border-2 ${basicExtraData.transportation === item ? 'border-slate-800 bg-slate-800 text-white shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                        {item} {basicExtraData.transportation === item && <Car className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">환자 거동 상태</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['독립 보행 가능', '부축 필요', '휠체어'].map((item) => (
                      <button key={item} type="button" onClick={() => setBasicExtraData({...basicExtraData, mobility: item})} className={`py-3 px-4 rounded-xl font-bold text-[14px] transition-all text-left flex items-center justify-between border-2 ${basicExtraData.mobility === item ? 'border-slate-800 bg-slate-800 text-white shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                        {item} {basicExtraData.mobility === item && <Accessibility className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 3단 분할 상세 내용 수정 */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">3. 상세 요청사항 수정</h3>
            </div>

            <div className="space-y-6">
              
              {/* 회색 박스: 보호자 요청사항 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  보호자 특별 요청사항
                </label>
                <textarea name="requirements" rows={3} value={formData.requirements} onChange={handleChange} placeholder="매니저가 알아야 할 특별한 사항을 적어주세요." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-400 outline-none resize-none bg-gray-50"></textarea>
              </div>

              {/* 파란 박스: 상세 진료 내용 */}
              <div>
                <label className="block text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> 상세 진료 및 검사 내용
                </label>
                <textarea name="detailedContent" rows={3} value={formData.detailedContent} onChange={handleChange} placeholder="진료 과목이나 주요 증상을 적어주세요." className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-blue-50/30"></textarea>
              </div>

              {/* 주황 박스: 의사 선생님께 질문할 내용 */}
              <div>
                <label className="block text-sm font-semibold text-amber-600 mb-2 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" /> 의사 선생님께 꼭 여쭤봐야 할 질문
                </label>
                <textarea name="doctorInquiry" rows={3} value={formData.doctorInquiry} onChange={handleChange} placeholder="병원에서 꼭 확인해야 할 질문을 적어주세요." className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none resize-none bg-amber-50/30"></textarea>
              </div>
              
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-900 text-white font-bold text-lg py-5 rounded-2xl shadow-lg hover:bg-blue-950 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
            <Save className="w-5 h-5" /> 예약 수정 완료하기
          </button>
        </form>
      </main>
    </div>
  );
}