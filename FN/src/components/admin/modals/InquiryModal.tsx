// src/components/admin/modals/InquiryModal.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleQuestion, X, Loader2, Send, PenSquare } from 'lucide-react';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInquiry: any | null;
  answerInput: string;
  setAnswerInput: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function InquiryModal({ isOpen, onClose, selectedInquiry, answerInput, setAnswerInput, onSubmit, isSubmitting }: InquiryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-blue-50/30">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5 text-blue-600" /> 문의 상세 및 답변
            </h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6">
            {!selectedInquiry ? (
              <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 w-8 h-8"/></div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">{selectedInquiry.title}</h2>
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {selectedInquiry.content}
                </div>
                
                {/* 첨부 이미지 영역 (필요시) */}
                {selectedInquiry.imageUrls && selectedInquiry.imageUrls.length > 0 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto">
                    {selectedInquiry.imageUrls.map((url: string, idx: number) => (
                      <img key={idx} src={url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`} alt="첨부" 
                           className="w-24 h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80" 
                           onClick={() => window.open(url, '_blank')} />
                    ))}
                  </div>
                )}
                <div className="border-t border-slate-200/60 pt-6 mt-4">
                  <h4 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-1.5">
                    <PenSquare className="w-4 h-4" /> 관리자 답변 작성
                  </h4>
                  <textarea 
                    value={answerInput} 
                    onChange={(e) => setAnswerInput(e.target.value)} 
                    placeholder="고객의 문의에 대한 친절한 답변을 작성해주세요." 
                    className="w-full h-40 p-4 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-slate-800 resize-none shadow-sm" 
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">취소</button>
                    <button onClick={onSubmit} disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} 
                      {selectedInquiry.status === 'PENDING' ? '답변 등록' : '답변 수정'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}