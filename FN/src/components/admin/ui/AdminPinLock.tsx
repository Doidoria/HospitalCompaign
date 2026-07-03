// src/components/admin/ui/AdminPinLock.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LockKeyhole, Loader2, ShieldPlus } from 'lucide-react';
import { useAdminAuthStore } from '@/src/store/useAdminAuthStore';
import { adminApi } from '@/src/api/index';
import { Toast } from '@/src/utils/alert';

type PinMode = 'LOADING' | 'VERIFY' | 'SETUP' | 'CONFIRM';

export default function AdminPinLock() {
  const { isLocked, pendingAction, unlock, clearPendingAction } = useAdminAuthStore();
  const [mode, setMode] = useState<PinMode>('LOADING'); 
  const [pin, setPin] = useState('');
  const [setupPin, setSetupPin] = useState(''); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isError, setIsError] = useState(false);

  // 상태 확인 함수 독립 분리 및 로직 강화
  const checkStatus = useCallback(async () => {
    setMode('LOADING'); 
    try {
      const res = await adminApi.checkPinStatus();
      
      const isSetup = res.data === true || res.data?.data === true;
      
      if (isSetup) {
        setMode('VERIFY'); // 100% 설정된 게 맞으므로 -> PIN 입력(검증) 창으로 이동
      } else {
        setMode('SETUP');  // 진짜로 설정이 안 된 신규 유저이므로 -> 초기 설정 창으로 이동
      }
    } catch (error) {
      console.error('PIN 상태 확인 실패', error);
      setMode('VERIFY'); // 에러 시 가장 안전한 방어벽 모드로 포지셔닝
    }
  }, []);

  // 모달이 열릴 때(`isLocked === true`)에만 명확하게 백엔드 상태를 조회하도록 바인딩
  useEffect(() => {
    if (isLocked) {
      setPin('');
      setSetupPin('');
      setIsError(false);
      checkStatus();
    }
  }, [isLocked, checkStatus]);

  // PIN 6자리 입력 완료 핸들러
  useEffect(() => {
    if (pin.length === 6 && !isProcessing && mode !== 'LOADING') {
      handlePinComplete(pin);
    }
  }, [pin, mode, isProcessing]);

  const handlePinComplete = async (inputPin: string) => {
    setIsProcessing(true);
    setIsError(false);

    try {
      if (mode === 'SETUP') {
        setSetupPin(inputPin);
        setPin('');
        setMode('CONFIRM');
        Toast.fire({ icon: 'info', title: '확인을 위해 한 번 더 입력해주세요.' });
      } 
      else if (mode === 'CONFIRM') {
        if (inputPin === setupPin) {
          await adminApi.setupPin(inputPin);
          Toast.fire({ icon: 'success', title: 'PIN 설정이 완료되었습니다.' });
          setMode('VERIFY'); 
          executeUnlock();
        } else {
          setIsError(true);
          setPin('');
          setSetupPin('');
          setMode('SETUP');
          Toast.fire({ icon: 'error', title: 'PIN 번호가 일치하지 않습니다. 처음부터 다시 입력해주세요.' });
        }
      } 
      else if (mode === 'VERIFY') {
        await adminApi.verifyPin(inputPin);
        executeUnlock();
      }
    } catch (err: any) {
      setIsError(true);
      setPin('');
      const errMsg = err.response?.data?.message || '인증에 실패했습니다. 다시 시도해주세요.';
      Toast.fire({ icon: 'error', title: errMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeUnlock = () => {
    unlock();
    setPin('');
    if (pendingAction) pendingAction();
  };

  const handleKeypadClick = (num: string) => {
    if (pin.length < 6 && mode !== 'LOADING') {
      setIsError(false);
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (mode !== 'LOADING') setPin((prev) => prev.slice(0, -1));
  };

  const handleCancelAction = () => {
    unlock();
    clearPendingAction();
    setPin('');
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center relative overflow-hidden min-h-[380px] justify-center">
        
        {/* ⭐️ LOADING 모드일 때는 완벽하게 화면을 차단하고 스피너만 보여줍니다. */}
        {mode === 'LOADING' ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-500 font-bold text-sm tracking-tight">보안 상태 확인 중...</p>
          </div>
        ) : (
          <>
            <div className={`p-4 rounded-full mb-6 transition-colors ${isError ? 'bg-red-100 text-red-500' : mode === 'VERIFY' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-600'}`}>
              {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : 
               mode === 'VERIFY' ? <LockKeyhole className="w-8 h-8" /> : <ShieldPlus className="w-8 h-8" />}
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">
              {mode === 'SETUP' ? '초기 보안 PIN 설정' : 
               mode === 'CONFIRM' ? 'PIN 번호 확인' : 
               pendingAction ? '보안 인증이 필요합니다' : '관리자 보안 잠금'}
            </h2>
            
            <p className="text-sm text-slate-400 font-medium mb-8 text-center break-keep leading-relaxed px-2">
              {mode === 'SETUP' ? '안전한 관리를 위해 최초 1회 6자리 PIN을 설정해주세요.' : 
               mode === 'CONFIRM' ? '입력하신 6자리 PIN을 한 번 더 입력해주세요.' : 
               pendingAction ? '해당 작업을 수행하려면 PIN을 입력하세요.' : '안전한 관리를 위해 6자리 PIN을 입력해주세요.'}
            </p>

            <div className="flex gap-4 mb-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 
                  ${i < pin.length 
                    ? (isError ? 'bg-red-500 scale-110' : 'bg-blue-600 scale-110') 
                    : 'bg-slate-200'}`} 
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full px-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => handleKeypadClick(String(num))} disabled={isProcessing}
                  className="h-14 text-2xl font-bold text-slate-700 rounded-2xl hover:bg-slate-100 active:bg-slate-200 transition-colors">
                  {num}
                </button>
              ))}
              <div /> 
              <button onClick={() => handleKeypadClick('0')} disabled={isProcessing}
                className="h-14 text-2xl font-bold text-slate-700 rounded-2xl hover:bg-slate-100 active:bg-slate-200 transition-colors">0</button>
              <button onClick={handleDelete} disabled={isProcessing}
                className="h-14 text-sm font-bold text-slate-500 rounded-2xl hover:bg-slate-100 active:bg-slate-200 transition-colors">지우기</button>
            </div>

            {pendingAction && (
              <button onClick={handleCancelAction} className="mt-4 text-sm text-slate-400 hover:text-slate-600 font-bold underline underline-offset-4">
                작업 취소하기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}