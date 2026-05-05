'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';

const faqs = [
  {
    q: "예약 취소 수수료는 어떻게 되나요?",
    a: "서비스 시작 24시간 전까지는 100% 무료 취소가 가능합니다. 단, 12시간 전 취소 시 50%의 수수료가 부과되며, 당일 취소 또는 노쇼의 경우 환불이 불가합니다."
  },
  {
    q: "매니저 교체가 가능한가요?",
    a: "네, 가능합니다. 서비스 이용 후 불편함이 있으셨거나 다른 매니저를 원하실 경우 고객센터(1588-0000)로 연락주시면 다음 예약 시 반영해 드립니다."
  },
  {
    q: "어떤 병원이든 동행이 가능한가요?",
    a: "현재 수도권(대구/서울(일부)) 내에 있는 대학병원, 종합병원, 일반 의원 모두 동행 가능합니다."
  },
  {
    q: "환자가 휠체어를 타야 하는데 가능한가요?",
    a: "네, 예약 신청 시 '거동 상태' 항목에 휠체어 이용 여부를 체크해 주시면, 휠체어 이동 보조에 능숙한 매니저가 배정됩니다."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-14">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircleQuestion className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-extrabold text-blue-950">자주 묻는 질문 (FAQ)</h1>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center p-5 text-left focus:outline-none hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-gray-800 text-lg flex gap-3">
                  <span className="text-blue-600">Q.</span> {faq.q}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 pt-2 text-gray-600 border-t border-dashed border-gray-100 bg-blue-50/30">
                      <span className="font-bold text-blue-600 mr-2">A.</span> {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl text-center border border-gray-200">
          <p className="text-gray-600 font-medium mb-2">원하시는 답변을 찾지 못하셨나요?</p>
          <p className="text-gray-900 font-bold text-xl">고객센터 : 1588-0000 <span className="text-sm font-normal text-gray-500">(평일 09:00 ~ 18:00)</span></p>
        </div>
      </div>
    </div>
  );
}