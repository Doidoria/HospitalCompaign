'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  const termsData = [
    {
      id: 1,
      title: "제 1 조 (목적)",
      content: "본 약관은 예스케어(이하 '회사'라 함)가 제공하는 병원 동행 서비스 및 관련 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다."
    },
    {
      id: 2,
      title: "제 2 조 (서비스의 제공 및 한계)",
      content: "회사는 환자의 병원 방문 시 이동 보조, 접수 및 수납, 진료 동행 등의 편의를 제공합니다.\n\n단, 매니저는 의료 행위를 할 수 없으며 의학적 판단을 요하는 요청은 거절할 수 있습니다."
    },
    {
      id: 3,
      title: "제 3 조 (면책 및 손해배상)",
      content: "회사는 천재지변, 병원 측의 사정(진료 지연 등), 심각한 교통 체증 등 회사의 귀책사유가 아닌 불가항력적 사유로 서비스가 지연되거나 제공되지 못한 경우 책임을 지지 않습니다.\n\n매니저의 고의 또는 중과실로 인한 손해 발생 시 회사가 가입한 배상책임보험의 한도 내에서 보상합니다."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">

      {/* 본문 영역 */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        <div className="mb-6 px-2">
          <h2 className="text-2xl font-extrabold text-blue-950 mb-2">예스케어 서비스 이용약관</h2>
          <p className="text-sm text-slate-500">안전하고 편리한 서비스 이용을 위해 약관을 확인해 주세요.</p>
        </div>

        <div className="space-y-4">
          {termsData.map((term) => (
            <section key={term.id} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100/50">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3">{term.title}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-wrap">
                {term.content}
              </p>
            </section>
          ))}

          {/* 환불 규정 등 핵심 조항 하이라이트 */}
          <section className="bg-blue-50/50 p-5 sm:p-6 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-bold text-blue-900">제 4 조 (취소, 환불 및 추가 과금)</h3>
            </div>
            <ul className="text-sm sm:text-base text-slate-700 space-y-2 list-disc pl-5">
              <li><strong>서비스 이용 24시간 전 취소:</strong> 전액 환불</li>
              <li><strong>서비스 이용 12시간 전 취소:</strong> 결제 금액의 50% 공제 후 환불</li>
              <li><strong>당일 취소 및 노쇼:</strong> 환불 불가</li>
              <li className="pt-2 text-slate-500 text-sm list-none -ml-5">
                * 예상 진료 시간을 초과할 경우 30분 단위로 추가 요금이 결제될 수 있습니다.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-8 px-2 text-xs text-slate-400 font-medium">
          <p>공고일자: 2026년 4월 25일</p>
          <p>시행일자: 2026년 5월 1일</p>
        </div>
      </main>
    </div>
  );
}