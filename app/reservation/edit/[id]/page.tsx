'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, MapPin, Calendar, FileText, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { reservationApi } from '@/src/api/index';

export default function ReservationEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isOpenPost, setIsOpenPost] = useState(false); // 🌟 주소 검색 모달 상태

  const [formData, setFormData] = useState({
    hospitalName: '', date: '', time: '', requirements: ''
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
          requirements: data.requirements || ''
        });
        setLoading(false);
      })
      .catch(() => {
        Swal.fire('오류', '예약 정보를 불러올 수 없습니다.', 'error');
        router.push('/mypage');
      });
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🌟 주소 검색 완료 시 병원명에 자동 입력
  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    if (data.buildingName) fullAddress += ` (${data.buildingName})`;
    setFormData(prev => ({ ...prev, hospitalName: fullAddress }));
    setIsOpenPost(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time || !formData.hospitalName) {
      Swal.fire('입력 오류', '병원 이름과 날짜, 시간을 모두 입력해주세요.', 'warning');
      return;
    }

    const formattedTime = `${formData.date}T${formData.time}:00`;
    try {
      await reservationApi.update(id as string, {
        hospitalName: formData.hospitalName.trim(),
        reservationTime: formattedTime,
        requirements: formData.requirements
      });

      await Swal.fire('수정 완료', '예약 내용이 성공적으로 변경되었습니다.', 'success');
      router.push(`/reservation/${id}`); 
    } catch (error) {
      Swal.fire('수정 실패', '오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-blue-900">데이터를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      
      {/* 🌟 주소 검색 팝업 (모달) */}
      {isOpenPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">병원 주소 검색</h3>
              <button type="button" onClick={() => setIsOpenPost(false)} className="text-gray-500 font-bold px-2">X</button>
            </div>
            <div className="h-[400px]">
              <DaumPostcodeEmbed onComplete={handleCompletePost} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b h-16 flex items-center px-5 sticky top-0 z-10">
        <button type="button" onClick={() => router.back()} className="text-slate-600"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="flex-1 text-center font-bold text-lg mr-6 text-gray-900">예약 정보 수정</h1>
      </header>

      <main className="max-w-xl mx-auto p-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" /> 병원 정보
            </h3>
            <div className="flex gap-2">
              <input 
                type="text" name="hospitalName" value={formData.hospitalName} readOnly
                onClick={() => setIsOpenPost(true)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" required 
              />
              <button 
                type="button" onClick={() => setIsOpenPost(true)}
                className="bg-gray-800 text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center whitespace-nowrap"
              >
                <Search className="w-4 h-4 mr-1.5" /> 검색
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> 일정 수정
            </h3>
            <div className="flex gap-3">
              <input 
                type="date" name="date" value={formData.date} onChange={handleChange} 
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" required
              />
              <input 
                type="time" name="time" value={formData.time} onChange={handleChange} 
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" required
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> 특이사항 및 요청사항
            </h3>
            <textarea 
              name="requirements" rows={4} value={formData.requirements} onChange={handleChange} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            ></textarea>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md">
            <Save className="w-5 h-5" /> 변경 사항 저장
          </button>
        </form>
      </main>
    </div>
  );
}