import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-14">
        <h1 className="text-3xl font-extrabold text-blue-950 mb-8">이용약관</h1>
        
        <div className="text-gray-700 text-sm md:text-base space-y-6 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제 1 조 (목적)</h2>
            <p>본 약관은 예스케어(이하 "회사"라 함)가 제공하는 병원 동행 서비스 및 관련 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제 2 조 (서비스의 제공)</h2>
            <p>회사는 환자의 병원 방문 시 이동 보조, 접수 및 수납, 진료 동행, 약국 동행 등의 편의를 제공하는 '병원 동행 매니저 서비스'를 제공합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">제 3 조 (취소 및 환불 규정)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 이용 24시간 전 취소: 전액 환불</li>
              <li>서비스 이용 12시간 전 취소: 결제 금액의 50% 공제 후 환불</li>
              <li>서비스 이용 당일 취소 또는 노쇼: 환불 불가</li>
            </ul>
          </section>
          
          {/* 필요에 따라 실제 약관 내용을 추가하세요 */}
          <p className="text-gray-500 mt-10 text-sm">본 약관은 2026년 5월 1일부터 적용됩니다.</p>
        </div>
      </div>
    </div>
  );
}