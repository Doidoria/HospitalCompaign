// app/pay/reservation/success/page.tsx (대리 신청 예약 선결제 승인)
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { YesAlert } from '@/src/utils/alert';
import { reservationApi } from '@/src/api/index';

export default function ProxyPaymentSuccessPage() {
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

      const targetReservationId = sessionStorage.getItem('proxyPaymentTargetId');

      if (!paymentKey || !orderId || !amount || !targetReservationId) {
        YesAlert.fire({ icon: 'error', title: '잘못된 접근', text: '결제 정보가 유실되었습니다.' });
        router.push('/mypage');
        return;
      }

      try {
        // 대리 신청 예약 결제 승인 (서버가 저장된 기본 요금과 대조)
        await reservationApi.confirmProxyPayment(Number(targetReservationId), {
          paymentKey,
          orderId,
          amount: Number(amount)
        });

        sessionStorage.removeItem('proxyPaymentTargetId'); // 임시 데이터 청소
        setIsProcessing(false);
        
        await YesAlert.fire({ 
          icon: 'success', 
          title: '결제 완료', 
          text: '결제가 완료되었습니다. 곧 동행 매니저를 매칭해 드립니다.', 
          confirmButtonText: '확인',
          confirmButtonColor: '#1e3a8a' 
        });
        
        router.push('/mypage');

      } catch (error: unknown) {
        console.error('예약 결제 승인 실패:', error);
        const serverMessage = axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined;
        await YesAlert.fire({ 
          icon: 'error', 
          title: '결제 승인 실패', 
          text: serverMessage ?? '결제 승인 중 문제가 발생했습니다. 고객센터로 문의해주세요.' 
        });
        router.push('/pay/reservation/fail');
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {isProcessing ? (
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">결제를 확인하고 있습니다...</h2>
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