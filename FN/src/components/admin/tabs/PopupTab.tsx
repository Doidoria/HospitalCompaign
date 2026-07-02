// src/components/admin/tabs/PopupTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { popupApi } from '@/src/api/index';
import { Save, Image as ImageIcon, Type, Link as LinkIcon, AlertCircle, Trash2 } from 'lucide-react';
import { Toast } from '@/src/utils/alert';

export default function PopupTab() {
  // 팝업 목록과 현재 선택된 탭 인덱스 관리 (최대 3개)
  const [popups, setPopups] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 현재 탭의 폼(Form) 상태
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 이미지 URL 정제 함수
  const getFileUrl = (path: string) => {
    if (!path) return '';
    // 이미 완전한 URL 형태(http/https)라면 그대로 반환 (S3 고도화 대비)
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseUrl.replace(/\/$/, '')}/${cleanPath}`;
  };

  // 팝업 데이터 로드
  const fetchPopups = async () => {
    try {
      const res = await popupApi.getPopupSettings();
      const dataList = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      setPopups(dataList);
      loadFormData(dataList, currentIndex); 
    } catch (e) {
      console.log("등록된 팝업이 없습니다.");
      setPopups([]);
      loadFormData([], 0);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  // 선택된 탭(인덱스)의 데이터를 폼에 채우기
  const loadFormData = (dataList: any[], index: number) => {
    setCurrentIndex(index);
    setImageFile(null); // 파일 초기화

    const data = dataList[index]; // 해당 인덱스에 데이터가 있는지 확인
    
    if (data) {
      // 데이터가 있으면 수정 모드
      setCurrentId(data.id);
      setTitle(data.title || '');
      setLinkUrl(data.linkUrl || '');
      setIsActive(data.isActive !== undefined ? data.isActive : data.active || false);
      setPreviewUrl(data.imageUrl ? getFileUrl(data.imageUrl) : '');
    } else {
      // 데이터가 없으면 신규 등록 모드 (빈 폼)
      setCurrentId(null);
      setTitle('');
      setLinkUrl('');
      setIsActive(false);
      setPreviewUrl('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Toast.fire({ icon: 'warning', title: '5MB 이하의 이미지만 업로드 가능합니다.' });
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Toast.fire({ icon: 'warning', title: '팝업 제목을 입력해주세요.' });
      return;
    }
    // 신규 등록인데 이미지가 없는 경우 방어 로직
    if (!currentId && !imageFile && !previewUrl) {
      Toast.fire({ icon: 'warning', title: '팝업 포스터 이미지를 등록해주세요.' });
      return;
    }

    try {
      const formData = new FormData();
      // 기존 팝업을 수정하는 경우 id를 전송하여 백엔드에서 Update 치도록 함
      if (currentId) formData.append('id', String(currentId));
      
      formData.append('title', title);
      if (linkUrl) formData.append('linkUrl', linkUrl);
      formData.append('isActive', String(isActive));
      if (imageFile) formData.append('image', imageFile);

      await popupApi.updatePopup(formData);
      Toast.fire({ icon: 'success', title: '팝업 설정이 저장되었습니다.' });
      fetchPopups(); // 저장 후 목록 갱신
    } catch (err) {
      Toast.fire({ icon: 'error', title: '저장에 실패했습니다.' });
    }
  };

  const handleDelete = async () => {
    if (!currentId) return;
    if (!window.confirm('정말 이 팝업을 삭제하시겠습니까?')) return;

    try {
      // 주의: api/index.ts 에 deletePopup 메서드가 선언되어 있어야 합니다.
      await popupApi.deletePopup(currentId);
      Toast.fire({ icon: 'success', title: '팝업이 삭제되었습니다.' });
      fetchPopups(); // 삭제 후 목록 갱신
    } catch (err) {
      Toast.fire({ icon: 'error', title: '삭제에 실패했습니다.' });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 mt-4">
      
      {/* 상단 팝업 선택 탭 (1, 2, 3) */}
      <div className="flex gap-2 mb-8 bg-gray-50 p-2 rounded-xl">
        {[0, 1, 2].map((index) => {
          const isExist = !!popups[index];
          return (
            <button
              key={index}
              onClick={() => loadFormData(popups, index)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                currentIndex === index
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              팝업 {index + 1} {isExist ? '' : '(비어있음)'}
            </button>
          );
        })}
      </div>

      <div className="space-y-8 animate__animated animate__fadeIn">
        {/* 디자이너 가이드 */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">팝업 이미지 등록 가이드</p>
            <ul className="list-disc list-inside space-y-1 ml-1 text-blue-700">
              <li>권장 사이즈: <b>가로 800px × 세로 1000px (4:5 비율)</b></li>
              <li>최대 3개의 팝업을 순차적으로 띄울 수 있습니다.</li>
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
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
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
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-medium">
              이미지 변경
            </div>
          </div>
          <input id="poster-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
        </div>

        {/* 버튼 그룹 (저장 & 삭제) */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          {currentId && (
            <button 
              onClick={handleDelete}
              className="px-6 py-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={handleSave}
            className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors"
          >
            <Save className="w-5 h-5" /> {currentId ? '수정된 내용 저장하기' : '신규 팝업 등록하기'}
          </button>
        </div>

      </div>
    </div>
  );
}