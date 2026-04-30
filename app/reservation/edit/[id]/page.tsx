'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, MapPin, Calendar, FileText, Search, MessageSquare, HelpCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { reservationApi } from '@/src/api/index';

export default function ReservationEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isOpenPost, setIsOpenPost] = useState(false);

  const [formData, setFormData] = useState({
    hospitalName: '', 
    date: '', 
    time: '', 
    requirements: '',     // 보호자 특별 요청사항
    detailedContent: '',  // 상세 진료 내용
    doctorInquiry: ''     // 의사 질의
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
          requirements: data.requirements || data.memo || '', // 백엔드 필드 매핑
          detailedContent: data.detailedContent || '',
          doctorInquiry: data.doctorInquiry || ''
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

  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    if (data.buildingName) fullAddress += ` (${data.buildingName})`;
    setFormData(prev => ({ ...prev, hospitalName: fullAddress }));
    setIsOpenPost(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedTime = `${formData.date}T${formData.time}:00`;
      
      const requestData = {
        hospitalName: formData.hospitalName,
        reservationTime: formattedTime,
        requirements: formData.requirements,
        detailedContent: formData.detailedContent,
        doctorInquiry: formData.doctorInquiry
      };

      // api/index.ts 에 선언된 수정 함수명(update 또는 edit)에 맞게 호출합니다.
      // 만약 함수명이 update라면 reservationApi.update() 로 변경해주세요.
      await reservationApi.update(id as string, requestData); 

      await Swal.fire({ icon: 'success', title: '수정 완료', text: '예약 정보가 성공적으로 수정되었습니다.', confirmButtonColor: '#1e3a8a' });
      router.push(`/reservation/${id}`);
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: '수정 실패', text: '입력 정보를 다시 확인해주세요.' });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans text-gray-500">데이터를 불러오는 중입니다...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      
      {/* 주소 검색 모달 */}
      {isOpenPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">병원 주소 검색</h3>
              <button onClick={() => setIsOpenPost(false)} className="text-gray-500 font-bold px-2 hover:text-red-500 transition-colors">X</button>
            </div>
            <div className="h-[400px]">
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
              <h3 className="text-xl font-bold text-gray-800">일정 및 병원 수정</h3>
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
                  <input type="text" name="hospitalName" value={formData.hospitalName} readOnly placeholder="검색 버튼을 눌러주세요" onClick={() => setIsOpenPost(true)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none cursor-pointer" required />
                  <button type="button" onClick={() => setIsOpenPost(true)} className="bg-gray-800 text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center whitespace-nowrap shadow-sm">
                    <Search className="w-4 h-4 mr-1.5" /> 검색
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 3단 분할 상세 내용 수정 */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">상세 요청사항 수정</h3>
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