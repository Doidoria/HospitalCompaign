'use client';

import React, { useState, useEffect } from 'react';
import { popupApi } from '@/src/api/index';
// 💡 제목, 링크, 알림 배너용 아이콘 추가
import { Save, Image as ImageIcon, Type, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Toast } from '@/src/utils/alert';

export default function PopupTab() {
  // 💡 백엔드와 맞춘 상태(State) 변수들
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    popupApi.getPopupSettings().then(res => {
      // 배열로 올 경우를 대비해 첫 번째 데이터 추출
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      if (data) {
        setTitle(data.title || '');
        setLinkUrl(data.linkUrl || '');

        const status = data.isActive !== undefined ? data.isActive : data.active;
        setIsActive(status || false);

        if (data.imageUrl) {
          const fullImageUrl = data.imageUrl.startsWith('http') 
            ? data.imageUrl 
            : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${data.imageUrl}`;
          setPreviewUrl(fullImageUrl);
        }
      }
    }).catch(e => {
      console.log("등록된 팝업이 없습니다.");
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 용량 제한 검사 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        Toast.fire({ icon: 'warning', title: '5MB 이하의 이미지만 업로드 가능합니다.' });
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    // 필수값(제목) 체크
    if (!title.trim()) {
      Toast.fire({ icon: 'warning', title: '팝업 제목을 입력해주세요.' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      if (linkUrl) formData.append('linkUrl', linkUrl);
      formData.append('isActive', String(isActive));
      if (imageFile) formData.append('image', imageFile);

      await popupApi.updatePopup(formData);
      Toast.fire({ icon: 'success', title: '팝업 설정이 저장되었습니다.' });
    } catch (err) {
      Toast.fire({ icon: 'error', title: '저장에 실패했습니다.' });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 mt-4">
      <div className="space-y-8">
        
        {/* 디자이너 가이드 (앱/웹 호환 4:5 규격 안내 박스) */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">팝업 이미지 등록 가이드</p>
            <ul className="list-disc list-inside space-y-1 ml-1 text-blue-700">
              <li>권장 사이즈: <b>가로 800px × 세로 1000px (4:5 비율)</b></li>
              <li>로딩 속도를 위해 가급적 <b>500KB 이하</b>의 최적화된 이미지를 권장합니다.</li>
            </ul>
          </div>
        </div>

        {/* 제목 입력 */}
        <div>
          <label className="block font-bold text-gray-800 mb-2 flex items-center gap-1">
            <Type className="w-4 h-4 text-gray-500" /> 팝업 제목 <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 예스케어 봄맞이 무료 동행 이벤트"
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        {/* 링크 입력 */}
        <div>
          <label className="block font-bold text-gray-800 mb-2 flex items-center gap-1">
            <LinkIcon className="w-4 h-4 text-gray-500" /> 클릭 시 이동할 링크 (선택)
          </label>
          <input 
            type="text" 
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://yescare.com/event"
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        {/* 사용 여부 토글 */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-bold text-gray-800 text-sm sm:text-base">팝업 노출 상태</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">메인 페이지에 팝업을 띄울지 결정합니다.</p>
          </div>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* 이미지 업로드 */}
        <div>
          <p className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" /> 팝업 포스터 이미지 <span className="text-red-500">*</span>
          </p>
          <div 
            className="relative w-full max-w-[320px] aspect-[4/5] mx-auto rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-colors group cursor-pointer bg-slate-50"
            onClick={() => document.getElementById('poster-upload')?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="미리보기" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                <p className="text-gray-500 font-medium mb-1">클릭하여 이미지 업로드</p>
                {/* 규격 안내 문구 */}
                <p className="text-xs text-gray-400">
                  권장 크기: 800 x 1000 px <br/>
                  최대 용량: 5MB
                </p>
              </div>
            )}
          </div>
          <input id="poster-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
        </div>

        {/* 저장 버튼 */}
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