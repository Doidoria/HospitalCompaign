'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeft, Receipt, Clock, AlertCircle, ChevronDown, CheckCircle2, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
  // FAQ 아코디언 열림/닫힘 상태 관리
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: '예약을 취소하거나 변경하고 싶어요.',
      answer: '서비스 이용일 기준 24시간 전까지는 위약금 없이 100% 무료 취소 및 변경이 가능합니다. 단, 24시간 이내 취소 시에는 기본 요금의 50%가 위약금으로 발생하며, 서비스 당일 취소는 환불이 불가합니다.'
    },
    {
      question: '멀리 사는 부모님을 대신해 제가 신청해도 되나요?',
      answer: '네, 가능합니다! 보호자님께서 신청하시고 실제 이용하시는 부모님의 정보를 입력해 주시면 됩니다. 진료가 끝난 후에는 보호자님의 카카오톡으로 상세한 케어 리포트를 전송해 드립니다.'
    },
    {
      question: '매니저님들은 어떤 교육을 받으셨나요?',
      answer: '예스케어의 모든 매니저는 요양보호사, 사회복지사 등 관련 자격을 보유하거나 이에 준하는 당사의 전문 교육(질환별 케어, 낙상 방지, 의사소통 기술 등)을 100% 이수한 검증된 전문가입니다.'
    },
    {
      question: '이용 시간이 예상보다 길어지면 어떻게 되나요?',
      answer: '기본 2시간을 초과할 경우, 30분 단위로 8,000원의 추가 요금이 발생합니다. 추가 요금은 서비스가 모두 종료된 후 등록된 결제 수단으로 자동 결제되거나 별도로 청구됩니다.'
    }
  ];

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">

      <motion.main 
        className="max-w-4xl mx-auto px-4 pt-8"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        {/* 1. 요금 안내 섹션 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-blue-950 mb-2">투명하고 합리적인 요금</h2>
          <p className="text-gray-500 text-sm md:text-base break-keep">
            예스케어는 숨겨진 비용 없이 정찰제로 운영됩니다.
          </p>
        </div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* 기본 요금 카드 */}
          <div className="bg-white rounded-[32px] p-8 shadow-md border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">기본 서비스</h3>
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
                <span>접수, 진료 동석, 약국 방문 포함</span>
              </li>
              <li className="flex items-center text-sm text-gray-600 gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span>보호자 안심 케어 리포트 제공</span>
              </li>
            </ul>
          </div>

          {/* 추가 요금 카드 */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">
             <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">추가 요금 안내</h3>
                <p className="text-sm text-gray-500 mt-1">시간 연장 및 할증 기준</p>
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

        {/* 2. 결제 및 주의사항 */}
        <motion.div variants={itemVariants} className="bg-blue-50 rounded-2xl p-5 flex gap-4 items-start mb-16 border border-blue-100 text-sm">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-900 leading-relaxed break-keep">
            <strong>알려드립니다: </strong> 택시비 등 이동에 발생하는 교통비와 병원 진료비, 약제비는 서비스 요금에 포함되지 않으며, 고객님께서 별도로 실비 결제해 주셔야 합니다.
          </div>
        </motion.div>

        {/* 3. 자주 묻는 질문 (FAQ) 아코디언 */}
        <motion.div variants={itemVariants}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-800">자주 묻는 질문 (FAQ)</h2>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-800 pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {/* 아코디언 내용 애니메이션 */}
                <AnimatePresence>
                  {openFaqIndex === index && (
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
            ))}
          </div>
        </motion.div>

        {/* 하단 동행 신청 CTA */}
        <motion.div variants={itemVariants} className="mt-12 text-center pb-8">
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