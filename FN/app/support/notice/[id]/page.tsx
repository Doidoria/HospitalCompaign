'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Bell, Loader2 } from 'lucide-react';
import { noticeApi } from '@/src/api/index';
import { Toast } from '@/src/utils/alert';

export default function NoticeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await noticeApi.getNotice(Number(id));
        setNotice(response.data);
      } catch (error) {
        Toast.fire({ icon: 'error', title: '공지사항을 불러올 수 없습니다.' });
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (!notice) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* 상단 헤더 */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" /> 공지사항
            </h1>
          </div>
        </div>

        <div className="p-8 md:p-10">
          {/* 공지 제목 및 메타 정보 */}
          <div className="mb-8 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2 mb-4">
              {notice.important ? (
                <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full">중요</span>
              ) : (
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">안내</span>
              )}
              <span className="text-gray-400 text-sm">{notice.createdAt?.substring(0, 10)}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              {notice.title}
            </h2>
          </div>

          {/* 공지 본문 내용 */}
          <div className="text-gray-700 leading-loose whitespace-pre-wrap text-base md:text-lg min-h-[300px]">
            {notice.content}
          </div>

          {/* 하단 목록으로 버튼 */}
          <div className="mt-12 flex justify-center pt-8 border-t border-dashed border-gray-200">
            <button 
              onClick={() => router.push('/support/faq?tab=notice')} 
              className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md"
            >
              목록으로 돌아가기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}