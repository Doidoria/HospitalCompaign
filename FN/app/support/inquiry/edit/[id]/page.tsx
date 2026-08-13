'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Send, ImagePlus, X } from 'lucide-react';
import { inquiryApi } from '@/src/api/index'; 
import { Toast } from '@/src/utils/alert'; 

export default function InquiryEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    isPrivate: true,
    password: '' 
  });

  const [loading, setLoading] = useState(true);

  // 1. 기존 데이터 불러오기
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await inquiryApi.getInquiry(Number(id));
        const data = response.data;
        
        // 답변 완료 상태면 강제로 튕겨냄 (백엔드에서도 막지만 프론트에서도 방어)
        if (data.status === 'ANSWERED') {
          Toast.fire({ icon: 'warning', title: '답변이 완료된 문의는 수정할 수 없습니다.' });
          router.replace(`/support/inquiry/${id}`);
          return;
        }

        setFormData({
          category: data.category,
          title: data.title,
          content: data.content,
          isPrivate: data.isPrivate ?? true,
          password: '' // 비밀번호는 새로 입력받거나 비워둠
        });
      } catch (error) {
        Toast.fire({ icon: 'error', title: '데이터를 불러올 수 없습니다.' });
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        Toast.fire({
          icon: 'error',
          title: `[${file.name}] 용량이 5MB를 초과하여 제외되었습니다.`
        });
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > MAX_IMAGES) {
      Toast.fire({
        icon: 'warning',
        title: `이미지는 최대 ${MAX_IMAGES}장까지만 첨부 가능합니다.`
      });
      return;
    }

    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 2. 수정 API 호출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category) {
      return Toast.fire({ icon: 'info', title: '문의 유형을 선택해주세요.' });
    }

    const submitData = new FormData();
    submitData.append('category', formData.category);
    submitData.append('title', formData.title);
    submitData.append('content', formData.content);
    submitData.append('isPrivate', String(formData.isPrivate));
    
    if (formData.isPrivate && formData.password) {
        submitData.append('password', formData.password);
    }
    
    files.forEach((file) => {
      submitData.append('images', file);
    });

    try {
      // updateInquiry 호출 (PUT 요청)
      await inquiryApi.updateInquiry(Number(id), submitData);
      
      await Toast.fire({
        icon: 'success',
        timer: 1000,
        title: '문의가 성공적으로 수정되었습니다.'
      });
      
      router.replace(`/support/inquiry/${id}`);
    } catch (error) {
      console.error('문의 수정 에러:', error);
      Toast.fire({
        icon: 'error',
        timer: 2000,
        title: '문의 수정 중 오류가 발생했습니다.'
      });
    }
  };

  if (loading) return <div className="flex justify-center py-20">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-10">
        
        <div className="flex items-center mb-8">
          <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">문의 수정하기</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">문의 유형 <span className="text-red-500">*</span></label>
            <select 
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900"
            >
              <option value="" disabled>유형을 선택해주세요</option>
              <option value="RESERVATION">예약/매칭</option>
              <option value="PAYMENT">결제/환불</option>
              <option value="SERVICE">서비스 이용</option>
              <option value="OTHER">기타</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">제목 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              placeholder="문의 제목을 입력해주세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">내용 <span className="text-red-500">*</span></label>
            <textarea required rows={15} 
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              사진 재첨부 <span className="text-gray-400 font-normal text-xs ml-1">(새로 첨부 시 기존 사진은 삭제됩니다)</span>
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={files.length >= MAX_IMAGES}
                className="w-20 h-20 flex flex-col items-center justify-center gap-1 bg-gray-50 border border-dashed border-gray-300 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 text-gray-500"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs font-medium">{files.length}/{MAX_IMAGES}</span>
              </button>
              
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple className="hidden"/>

              {previewUrls.map((url, index) => (
                <div key={url} className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group">
                  <img src={url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              <Send className="w-5 h-5" /> 수정 완료하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}