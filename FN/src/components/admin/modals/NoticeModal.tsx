'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, CheckCircle2 } from 'lucide-react';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNotice: any | null;
  noticeForm: { title: string; content: string; important: boolean };
  setNoticeForm: React.Dispatch<React.SetStateAction<{ title: string; content: string; important: boolean }>>;
  onSave: () => void;
}

export default function NoticeModal({ isOpen, onClose, selectedNotice, noticeForm, setNoticeForm, onSave }: NoticeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center p-5 bg-red-50/30 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800">
              <Megaphone className="w-5 h-5 inline text-red-600 mr-2"/> 
              {selectedNotice ? '공지 수정' : '새 공지 작성'}
            </h3>
            <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
          </div>
          <div className="p-6 space-y-5 bg-white">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">제목</label>
              <input type="text" value={noticeForm.title} onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})}
                placeholder="공지사항 제목을 입력하세요"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">내용</label>
              <textarea value={noticeForm.content} onChange={(e) => setNoticeForm({...noticeForm, content: e.target.value})}
                placeholder="공지사항 내용을 상세히 작성해주세요."
                className="w-full h-48 sm:h-80 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm leading-relaxed resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 p-3 rounded-xl w-fit hover:bg-red-50 transition-colors">
              <input type="checkbox" checked={noticeForm.important} onChange={(e) => setNoticeForm({...noticeForm, important: e.target.checked})}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" />
              <span className="text-sm font-bold text-slate-700">중요 공지</span>
            </label>
          </div>
          <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2 bg-slate-50/50">
            <button onClick={onClose} className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
              취소
            </button>
            <button onClick={onSave} className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {selectedNotice ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}