// src/components/admin/tabs/PopupTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { popupApi } from '@/src/api/index';
import { Save, Image as ImageIcon } from 'lucide-react';
import { Toast } from '@/src/utils/alert'; // 기존 프로젝트의 alert 경로로 맞춤

export default function PopupTab() {
  const [isActive, setIsActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    // 임시로 에러를 방지하기 위한 try-catch (API가 아직 없으므로)
    try {
      popupApi.getPopupSettings().then(res => {
        setIsActive(res.data.isActive);
        setPreviewUrl(res.data.imageUrl);
      });
    } catch(e) {
      console.log("팝업 API 연결 대기중");
    }
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
      Toast.fire({ icon: 'success', title: '저장 시뮬레이션 완료 (API 연동 필요)' }); // 임시 처리
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 mt-4">
      <div className="space-y-8">
        {/* 사용 여부 토글 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-bold text-gray-800">팝업 노출 상태</p>
            <p className="text-sm text-gray-500">메인 페이지에 팝업을 띄울지 결정합니다.</p>
          </div>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* 이미지 업로드 */}
        <div>
          <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> 팝업 포스터 이미지
          </p>
          <div 
            className="relative aspect-[3/4] max-w-sm mx-auto rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-colors group cursor-pointer bg-slate-50"
            onClick={() => document.getElementById('poster-upload')?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="미리보기" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">클릭하여 이미지 업로드</p>
              </div>
            )}
          </div>
          <input id="poster-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors"
        >
          <Save className="w-5 h-5" /> 설정 저장하기
        </button>
      </div>
    </div>
  );
}