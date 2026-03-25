import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* 1. 상단 로고/이름 */}
      <header className="w-full max-w-md py-6 text-center">
        <h1 className="text-2xl font-bold text-blue-600">OOO 병원 캠페인</h1>
      </header>

      {/* 2. 메인 이미지 영역 (배너) */}
      <section className="w-full max-w-md bg-blue-100 rounded-2xl aspect-video flex items-center justify-center mb-6 shadow-sm text-blue-400 font-bold">
        병원 캠페인 메인 이미지 (16:9)
      </section>

      {/* 3. 안내 텍스트 영역 */}
      <section className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm space-y-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">건강한 일상을 위한 첫걸음</h2>
        <p className="text-gray-600 leading-relaxed text-sm">
          저희 OOO 병원에서는 이번 캠페인을 통해 더 많은 분께 정확한 의료 정보를 전달드리고자 합니다. QR을 통해 접속하신 모든 분께 특별한 혜택을 드립니다.
        </p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ 기간: 2026.04.01 ~ 04.30</li>
          <li>✅ 대상: 캠페인 참여 고객 전원</li>
        </ul>
      </section>

      {/* 4. 고퀄리티 포인트: 하단 플로팅 버튼 */}
      <div className="fixed bottom-6 w-full max-w-md px-4">
        <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform">
          지금 바로 상담하기 (전화연결)
        </button>
      </div>
    </main>
  );
}