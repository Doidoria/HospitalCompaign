// app/pay/extra/success/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { YesAlert } from '@/src/utils/alert';
import { reservationApi } from '@/src/api/index';

export default function ExtraPaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  // ⭐ API 중복 호출 방어막
  const hasProcessed = useRef(false);

  useEffect(() => {
    const confirmPayment = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      const targetReservationId = sessionStorage.getItem('extraPaymentTargetId');

      if (!paymentKey || !orderId || !amount || !targetReservationId) {
        YesAlert.fire({ icon: 'error', title: '잘못된 접근', text: '결제 정보가 유실되었습니다.' });
        router.push('/mypage');
        return;
      }

      try {
        // 🚨 핵심 수정: 예약 생성(create)이 아니라 '추가 요금 승인'을 백엔드에 요청해야 합니다!
        await reservationApi.confirmExtraPayment(Number(targetReservationId), {
          paymentKey,
          orderId,
          amount: Number(amount)
        });

        sessionStorage.removeItem('extraPaymentTargetId'); // 임시 데이터 청소
        setIsProcessing(false);
        
        await YesAlert.fire({ 
          icon: 'success', 
          title: '결제 완료', 
          text: '추가 요금 결제가 성공적으로 완료되었습니다.', 
          confirmButtonText: '확인',
          confirmButtonColor: '#1e3a8a' 
        });
        
        router.push('/mypage');

      } catch (error: any) {
        console.error('추가 요금 결제 승인 실패:', error);
        YesAlert.fire({ 
          icon: 'error', 
          title: '결제 승인 실패', 
          text: '결제는 되었으나 서버 저장 중 문제가 발생했습니다. 고객센터로 문의해주세요.' 
        });
        // ⭐ 핵심 수정: 대표님이 만드신 경로(/pay/extra/fail)로 정확히 튕겨줌
        router.push('/pay/extra/fail'); 
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {isProcessing ? (
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">추가 요금 결제를 확인하고 있습니다...</h2>
          <p className="text-gray-500">창을 닫거나 새로고침하지 마세요.</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-800">처리가 완료되었습니다.</h2>
        </div>
      )}
    </div>
  );
}