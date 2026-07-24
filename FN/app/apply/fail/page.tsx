// app/apply/fail/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 토스페이먼츠가 URL 파라미터로 넘겨주는 실패 사유 추출
  const code = searchParams.get('code');
  const message = searchParams.get('message') || '결제 진행 중 알 수 없는 오류가 발생했습니다.';

  return (
    <div className="bg-white p-8 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 text-center max-w-md w-full mx-4">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      
      <h2 className="text-2xl font-extrabold text-gray-800 mb-3">결제 실패</h2>
      
      <div className="bg-gray-50 rounded-2xl p-4 mb-8">
        <p className="text-gray-600 text-[15px] font-medium break-keep leading-relaxed">
          {message}
        </p>
        {code && <p className="text-gray-400 text-[12px] mt-2">에러 코드: {code}</p>}
      </div>

      <button
        onClick={() => router.push('/apply')}
        className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white text-[16px] font-bold rounded-2xl transition-all shadow-md flex justify-center items-center gap-2 active:scale-[0.98]"
      >
        <ArrowLeft className="w-5 h-5" /> 다시 신청하기
      </button>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* useSearchParams를 사용할 때는 Next.js 권장에 따라 Suspense로 감싸줍니다 */}
      <Suspense fallback={<div className="text-gray-500 font-bold">로딩 중...</div>}>
        <FailContent />
      </Suspense>
    </div>
  );
}