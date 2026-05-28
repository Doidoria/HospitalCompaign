'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  const privacyData = [
    {
      id: 1,
      title: "1. 수집하는 개인정보 항목",
      content: "회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.\n\n• 필수항목: 이름, 연락처, 이메일, 비밀번호, 서비스 이용지 주소\n• 민감정보 (선택): 기본 질환 정보, 복용 약물, 거동 상태"
    },
    {
      id: 2,
      title: "2. 개인정보의 수집 및 이용 목적",
      content: "수집된 개인정보는 병원 동행 매니저 매칭, 예약 및 결제 관리, 긴급 상황 발생 시 보호자 연락 등의 목적으로만 이용됩니다."
    },
    {
      id: 4,
      title: "4. 개인정보의 보유 및 파기",
      content: "원칙적으로 목적 달성 후 지체 없이 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 아래의 기간 동안 보관합니다.\n\n• 계약/청약철회 기록: 5년\n• 대금결제 및 서비스 공급 기록: 5년\n• 소비자 불만/분쟁처리 기록: 3년"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">

      {/* 본문 영역 */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        <div className="mb-6 px-2 flex flex-col items-center text-center sm:block sm:text-left">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3 sm:hidden">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-blue-950 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600 hidden sm:block" />
            개인정보처리방침
          </h2>
          <p className="text-sm text-slate-500">
            예스케어는 고객님의 소중한 개인정보를 안전하게 보호합니다.
          </p>
        </div>

        <div className="space-y-4">
          {privacyData.map((policy) => (
            <section key={policy.id} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100/50">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3">{policy.title}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-wrap">
                {policy.content}
              </p>
            </section>
          ))}

          {/* 제 3자 제공 동의 (매우 중요하므로 강조 박스 처리) */}
          <section className="bg-emerald-50/50 p-5 sm:p-6 rounded-2xl border border-emerald-100">
            <h3 className="text-base sm:text-lg font-bold text-emerald-900 mb-3">3. 개인정보의 제3자 제공</h3>
            <p className="text-sm sm:text-base text-emerald-800/80 leading-relaxed mb-3">
              원활하고 안전한 병원 동행을 위해 매칭 시 '동행 매니저'에게 최소한의 정보를 제공합니다.
            </p>
            <div className="bg-white/60 p-3 rounded-xl text-sm text-emerald-900 space-y-1.5">
              <p><strong>• 제공받는 자:</strong> 매칭된 병원 동행 매니저</p>
              <p><strong>• 제공 항목:</strong> 환자 이름, 연락처, 주소, 거동 상태</p>
              <p><strong>• 보유 기간:</strong> 서비스 종료 및 정산 완료 후 7일 이내 파기</p>
            </div>
          </section>

          {/* DPO 책임자 정보 (명함 스타일) */}
          <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100/50 mt-4">
            <h3 className="text-base font-bold text-slate-800 mb-4">6. 개인정보 보호책임자</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">책임자 및 소속</span>
                <span className="font-medium text-slate-800">여미영 (고객지원실)</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">연락처</span>
                <span className="font-medium text-slate-800">053-982-2778</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">이메일</span>
                <span className="font-medium text-slate-800">wellcommunity982@gmail.com</span>
              </div>
            </div>
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