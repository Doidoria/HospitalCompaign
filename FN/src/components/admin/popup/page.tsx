// src/components/admin/popup/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { popupApi } from '@/src/api/index';
import { Save, Image as ImageIcon, Power } from 'lucide-react';
import { Toast } from '@/src/utils/alert';

export default function AdminPopupPage() {
  const [isActive, setIsActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 초기 설정 로드
  useEffect(() => {
    popupApi.getPopupSettings().then(res => {
      setIsActive(res.data.isActive);
      
      if (res.data.imageUrl) {
        const getFileUrl = (path: string) => {
          if (!path) return '';
          if (path.startsWith('http')) return path;
          
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
          const cleanPath = path.replace(/^\/?(uploads\/)?/, 'uploads/');
            
          return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
        };
        setPreviewUrl(getFileUrl(res.data.imageUrl));
      }
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      formData.append('isActive', String(isActive));

      await popupApi.updatePopup(formData);
      Toast.fire({ icon: 'success', title: '팝업 설정이 저장되었습니다.' });
    } catch (err) {
      Toast.fire({ icon: 'error', title: '저장에 실패했습니다.' });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ImageIcon className="text-blue-600" /> 이벤트 팝업 관리
      </h2>

      <div className="space-y-8">
        {/* 사용 여부 토글 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-bold text-gray-800">팝업 노출 상태</p>
            <p className="text-sm text-gray-500">현재 메인 페이지에 팝업을 띄울지 결정합니다.</p>
          </div>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* 이미지 업로드 및 미리보기 */}
        <div>
          <p className="font-bold text-gray-800 mb-3">팝업 이미지 (포스터)</p>
          <div 
            className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-colors group cursor-pointer"
            onClick={() => document.getElementById('poster-upload')?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="미리보기" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">이미지를 업로드하려면 클릭하세요</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-medium">
              이미지 변경
            </div>
          </div>
          <input id="poster-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Save className="w-5 h-5" /> 설정 저장하기
        </button>
      </div>
    </div>
  );
}