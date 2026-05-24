// app/support/inquiry/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Send, ImagePlus, X } from 'lucide-react';
import { inquiryApi } from '@/src/api/index'; // 중앙 API 모듈
import { Toast } from '@/src/utils/alert';    // 공통 Toast 유틸리티 
import Image from 'next/image';

export default function InquiryCreatePage() {
  const router = useRouter();

  // 사용자 문의 기본 작성란
  const INQUIRY_TEMPLATE = `[문의 상세 내용]
(예약 관련 문의라면 예약하신 날짜와 환자 성함을 꼭 적어주세요.)
 - 예약 날짜 : 
 - 환자 성함 : 
 - 내용 : 


[환자 특이사항 (선택)]
(휠체어 이용 여부, 거동 상태 등 매니저가 알아야 할 사항이 있다면 적어주세요.)
 - `;

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 3;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // 텍스트 데이터 상태
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: INQUIRY_TEMPLATE,
    isPrivate: true, // 기본값을 비공개로 설정
    password: ''     // 비밀번호 상태
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // 용량 체크 로직 (Toast 적용)
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

  // 중앙 집중화된 API 모듈 사용 및 Toast 연동
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
    if (formData.isPrivate) {
        submitData.append('password', formData.password);
    }
    
    files.forEach((file) => {
      submitData.append('images', file);
    });

    try {
      // 1. API 호출
      await inquiryApi.submitInquiry(submitData);
      
      // 2. 성공 알림 (사용자가 토스트를 볼 수 있도록 await 처리)
      await Toast.fire({
        icon: 'success',
        title: '문의가 성공적으로 접수되었습니다.'
      });
      
      // 3. 페이지 이동
      router.push('/support/faq');
    } catch (error) {
      console.error('문의 접수 에러:', error);
      Toast.fire({
        icon: 'error',
        title: '문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-10">
        
        {/* 헤더 */}
        <div className="flex items-center mb-8">
          <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">1:1 문의하기</h1>
        </div>

        {/* 작성 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 카테고리 선택 */}
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

          {/* 제목 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">제목 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              placeholder="문의 제목을 입력해주세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all 
              text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* 내용 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">내용 <span className="text-red-500">*</span></label>
            <textarea required rows={15} placeholder="문의하실 내용을 자세히 적어주세요. (개인정보는 포함하지 않도록 주의해주세요)"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all 
              resize-none text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* 이미지 첨부 영역 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">사진 첨부 <span className="text-gray-400 font-normal text-xs ml-1">(최대 3장)</span></label>
            <div className="flex flex-wrap gap-3">
              {/* 첨부 버튼 */}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={files.length >= MAX_IMAGES}
                className="w-20 h-20 flex flex-col items-center justify-center gap-1 bg-gray-50 border border-dashed border-gray-300 rounded-xl hover:bg-gray-100 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs font-medium">{files.length}/{MAX_IMAGES}</span>
              </button>
              
              {/* 숨겨진 파일 인풋 */}
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple className="hidden"/>

              {/* 이미지 미리보기 리스트 */}
              {previewUrls.map((url, index) => (
                <div key={url} className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group">
                  <img src={url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                  {/* 삭제 버튼 (오버레이) */}
                  <button type="button" onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* 공개/비공개 설정 및 비밀번호 
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">공개 설정</label>
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="isPrivate" checked={!formData.isPrivate} 
                  onChange={() => {
                    setFormData({ ...formData, isPrivate: false, password: '' });
                    setShowPassword(false); // 공개로 바꿀 때 보이기 상태도 초기화
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">공개</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="isPrivate" checked={formData.isPrivate} 
                  onChange={() => setFormData({ ...formData, isPrivate: true })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">비공개</span>
              </label>
            </div>

            {//* 비공개일 때만 나타나는 비밀번호 입력란
            {formData.isPrivate && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative w-full md:w-1/2">
                  <input type={showPassword ? "text" : "password"} // 체크 여부에 따라 type 변경
                    required
                    maxLength={4}
                    placeholder="비밀번호 4자리를 입력해주세요"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all 
                    text-gray-900 placeholder:text-gray-400 font-medium tracking-widest"
                  />
                </div>
                
                {//* 비밀번호 보이기 체크박스
                <label className="inline-flex items-center gap-2 mt-3 cursor-pointer">
                  <input type="checkbox" checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 font-medium">숨겨진 비밀번호 보기</span>
                </label>
              </div>
            )}
          </div> */}

          {/* 하단 버튼 */}
          <div className="pt-4">
            <button type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              <Send className="w-5 h-5" /> 문의 접수하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}