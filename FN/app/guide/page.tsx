// app/guide/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Receipt, Clock, AlertCircle, ChevronDown, CheckCircle2, CreditCard, Sparkles, Copy } from 'lucide-react';
import { Toast } from '@/src/utils/alert';
import Link from 'next/link';

const FAQS = [
  {
    question: '결제는 어떻게 진행되나요?',
    answer: '현재는 예약 확정을 위해 기본 2시간 요금에 대한 [무통장 입금 및 계좌이체]만 지원하고 있습니다. 보호자님들의 더욱 편리한 결제를 위해 신용카드 및 간편결제 시스템이 곧 도입될 예정이오니 많은 기대 부탁드립니다.'
  },
  {
    question: '예약을 취소하거나 변경하고 싶어요.',
    answer: '서비스 이용일 기준 24시간 전까지는 위약금 없이 100% 환불 및 변경이 가능합니다. 단, 24시간 이내 취소 시에는 선입금하신 기본 요금의 50%가 위약금으로 발생하며, 서비스 당일 취소는 환불이 불가합니다.'
  },
  {
    question: '멀리 사는 부모님을 대신해 제가 신청해도 되나요?',
    answer: '네, 가능합니다! 보호자님께서 신청 및 입금해 주시고 실제 이용하시는 부모님의 정보를 입력해 주시면 됩니다. 진료가 끝난 후에는 보호자님의 카카오톡으로 상세한 케어 리포트를 전송해 드립니다.'
  },
  {
    question: '이용 시간이 예상보다 길어지면 어떻게 되나요?',
    answer: '기본 2시간을 초과할 경우, 30분 단위로 8,000원의 추가 요금이 발생합니다. 추가 요금은 서비스가 모두 종료된 후 매니저의 안내에 따라 추가로 계좌이체 해 주시면 됩니다.'
  }
];

const PAGE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export default function GuidePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleCopyAccount = async () => {
    const accountText = "00000000000000";
    try {
      await navigator.clipboard.writeText(accountText);
      Toast.fire({ 
        icon: 'success', 
        title: '계좌번호 복사 완료', 
      });
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      <motion.main 
        className="max-w-4xl mx-auto px-4 pt-8"
        initial="hidden"
        animate="visible"
        variants={PAGE_VARIANTS}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-blue-950 mb-2">투명하고 합리적인 요금</h2>
          <p className="text-gray-500 text-sm md:text-base break-keep">
            예약 확정을 위해 기본 서비스 요금 선입금이 필요합니다.
          </p>
        </div>

        <motion.div variants={ITEM_VARIANTS} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 기본 요금 카드 */}
          <div className="bg-white rounded-[32px] p-8 shadow-md border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">기본 서비스 (사전결제)</h3>
                <p className="text-sm text-gray-500 mt-1">집 ↔ 병원 왕복 및 진료 동행</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
            
            <div className="mb-6 flex items-end gap-1.5">
              <span className="text-4xl font-extrabold text-blue-950">33,000</span>
              <span className="text-lg text-gray-500 font-medium mb-1">원</span>
            </div>

            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-600 gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span>기본 2시간 제공 (이동 시간 포함)</span>
              </li>
              <li className="flex items-center text-sm text-gray-600 gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span>예약 시 100% 선입금 (현재 계좌이체 한정)</span>
              </li>
              <li className="flex items-center text-sm text-gray-600 gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span>접수, 진료 동석, 약국 방문 포함</span>
              </li>
            </ul>
          </div>

          {/* 추가 요금 카드 */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">
             <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">추가 요금 안내</h3>
                <p className="text-sm text-gray-500 mt-1">시간 연장 시 현장/사후 결제</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-2xl text-orange-500">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium">시간 초과 시 (30분당)</span>
                <span className="font-bold text-blue-950">8,000원</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium flex items-center gap-1.5">
                  주말/공휴일 할증
                </span>
                <span className="font-bold text-blue-950">+ 5,000원</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-700 font-medium">야간 할증 (18시 이후)</span>
                <span className="font-bold text-blue-950">+ 5,000원</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. 결제 및 주의사항 (도입 예정 문구 추가) */}
        <motion.div variants={ITEM_VARIANTS} className="bg-emerald-50 rounded-2xl p-6 flex flex-col gap-4 items-start mb-16 border border-emerald-100 text-sm">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <strong className="text-emerald-900 text-base">결제 및 입금 안내</strong>
            </div>
            {/* 결제 시스템 도입 예정 뱃지 */}
            <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" />
              카드 결제 도입 예정
            </span>
          </div>
          
          <div className="text-emerald-800 leading-relaxed break-keep space-y-2.5">
            <p>• 원활한 예약 확정을 위해 <strong>현재 [무통장 입금 및 계좌이체]를 통한 선결제</strong>를 진행하고 있습니다.</p>
            <div className="bg-white/80 p-3 rounded-lg border border-emerald-100">
              <p className="text-emerald-900 font-bold mb-1">입금 계좌 안내</p>
              <button onClick={handleCopyAccount}
                className="group flex items-center gap-1.5 text-emerald-800 hover:text-emerald-600 transition-colors active:scale-95 outline-none text-left"
                title="계좌번호 복사하기"
              >
                국민은행 000-000000-00000 (예금주: 예스케어)
                <Copy className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-600 transition-colors shrink-0" />
              </button>
            </div>
            <p className="text-emerald-700/80 text-sm mt-2">* 택시비 등 이동 교통비와 병원 진료비, 약제비는 서비스 요금에 포함되지 않으며 현장에서 별도로 실비 결제해 주셔야 합니다.</p>
          </div>
        </motion.div>

        {/* 3. 자주 묻는 질문 (FAQ) 아코디언 */}
        <motion.div variants={ITEM_VARIANTS}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-800">자주 묻는 질문 (FAQ)</h2>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              
              return (
                <div key={index} className="border-b border-gray-100 last:border-0">
                  <button 
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-gray-800 pr-4">{faq.question}</span>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-1 text-gray-600 text-sm leading-relaxed bg-gray-50/50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 하단 동행 신청 CTA */}
        <motion.div variants={ITEM_VARIANTS} className="mt-12 text-center pb-8">
          <Link href="/apply">
            <button className="w-full md:w-auto bg-blue-900 text-white text-lg font-bold py-4 px-12 rounded-2xl shadow-lg hover:bg-blue-950 transition-all active:scale-[0.98]">
              동행 서비스 신청하기
            </button>
          </Link>
        </motion.div>

      </motion.main>
    </div>
  );
}