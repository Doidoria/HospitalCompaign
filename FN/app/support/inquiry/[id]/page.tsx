'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { inquiryApi } from '@/src/api/index';
import { Toast } from '@/src/utils/alert';

export default function InquiryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await inquiryApi.getInquiry(Number(id));
        setInquiry(response.data);
      } catch (error) {
        Toast.fire({ icon: 'error', title: '문의 내용을 불러올 수 없습니다.' });
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {/* 상단 헤더 */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">문의 상세 내용</h1>
        </div>

        <div className="p-8">
          {/* 질문 영역 */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                {inquiry.category === 'RESERVATION' ? '예약/매칭' : 
                 inquiry.category === 'PAYMENT' ? '결제/환불' : 
                 inquiry.category === 'SERVICE' ? '서비스 이용' : '기타'}
              </span>
              <span className="text-gray-400 text-xs">{inquiry.createdAt?.substring(0, 10)}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{inquiry.title}</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[150px]">
              {inquiry.content}
            </div>
            
            {/* 첨부 이미지 리스트 */}
            {inquiry.imageUrls?.length > 0 && (
              <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
                {inquiry.imageUrls.map((url: string, index: number) => {
                  
                  // url이 http로 시작하지 않으면, 백엔드 주소를 강제로 앞에 붙여줍니다!
                  const fullImageUrl = url.startsWith('http') 
                    ? url 
                    : `${process.env.NEXT_PUBLIC_API_URL}${url}`;

                  return (
                    <img key={index} src={fullImageUrl} alt={`첨부사진-${index + 1}`} 
                      className="w-32 h-32 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity" 
                      onClick={() => window.open(fullImageUrl, '_blank')} // (보너스) 클릭 시 원본 사진 새 창으로 보기
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* 답변 영역 */}
          <div className="pt-10 border-t border-dashed border-gray-200">
            {inquiry.status === 'ANSWERED' ? (
              <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-700 font-bold">
                  <CheckCircle2 className="w-5 h-5" /> 답변 완료
                </div>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{inquiry.answer}</p>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-3">
                <Clock className="w-10 h-10 opacity-30" />
                <p>답변을 준비 중입니다. 조금만 기다려주세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}