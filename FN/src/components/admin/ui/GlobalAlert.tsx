// src/components/admin/ui/GlobalAlert.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlertStore } from '@/src/store/useAlertStore';
import { AlertCircle, CheckCircle2, Info, HelpCircle, XCircle } from 'lucide-react';

export default function GlobalAlert() {
  const { 
    isOpen, title, text, html, icon, showCancelButton, confirmButtonText, 
    cancelButtonText, input, inputValue: initialInputValue, inputValidator, close 
  } = useAlertStore();
  
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 모달이 열릴 때 입력값 초기화
  useEffect(() => { 
    if (isOpen) { 
      setInputValue(initialInputValue !== undefined ? String(initialInputValue) : ''); 
      setErrorMsg(null); 
    } 
  }, [isOpen, initialInputValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValidator) {
      const error = inputValidator(inputValue);
      if (error) { setErrorMsg(error); return; }
    }
    const value = input === 'number' ? Number(inputValue) : (input ? inputValue : true);
    close({ isConfirmed: true, value });
  };

  const renderIcon = () => {
    switch (icon) {
      case 'success': return <CheckCircle2 className="w-10 h-10 text-emerald-500" />;
      case 'error': return <XCircle className="w-10 h-10 text-red-500" />;
      case 'warning': return <AlertCircle className="w-10 h-10 text-orange-500" />;
      case 'question': return <HelpCircle className="w-10 h-10 text-blue-500" />;
      default: return <Info className="w-10 h-10 text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={() => close({ isConfirmed: false })} 
          className="absolute inset-0 bg-slate-900/60"
        />
        <motion.div 
          style={{ willChange: "transform, opacity" }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }} 
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm sm:max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden border border-slate-100 p-6 flex flex-col items-center text-center"
        >
          <div className="mb-4 bg-slate-50 p-3 rounded-full">{renderIcon()}</div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-2">{title}</h3>
          {text && ( <div className="text-sm text-slate-500 font-medium leading-relaxed mb-4 whitespace-pre-line">{text}</div>)}
          {html && <div className="text-sm text-slate-500 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: html }} />}
          {input === 'textarea' && (
            <div className="w-full mt-2 mb-4">
              <textarea value={inputValue} onChange={(e) => { setInputValue(e.target.value); setErrorMsg(null); }}
                className={`w-full p-3 bg-slate-50 border ${errorMsg ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 resize-none h-24`}
                placeholder="내용을 입력하세요..."
              />
              {errorMsg && <p className="text-xs text-red-500 font-bold mt-1 text-left">{errorMsg}</p>}
            </div>
          )}
          {input === 'number' && (
            <div className="w-full mt-2 mb-4">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setErrorMsg(null); }}
                autoFocus
                className={`w-[80%] mx-auto block px-4 py-3 bg-slate-50 border ${errorMsg ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl text-slate-800 font-bold text-lg text-center focus:outline-none focus:ring-2 transition-all`}
              />
              {errorMsg && <p className="text-xs text-red-500 font-bold mt-1 text-center">{errorMsg}</p>}
            </div>
          )}
          <div className="w-full flex gap-2 mt-4">
            {showCancelButton && (
              <button onClick={() => close({ isConfirmed: false })} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors active:scale-95">
                {cancelButtonText || '취소'}
              </button>
            )}
            <button onClick={handleConfirm} className="flex-1 py-3.5 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 shadow-md transition-colors active:scale-95">
              {confirmButtonText || '확인'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}