'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { YesAlert } from '@/src/utils/alert';
import { reservationApi } from '@/src/api/index';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const confirmPaymentAndReserve = async () => {
      // 1. 토스가 URL로 넘겨준 영수증 데이터 추출
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      // 2. 결제창 띄우기 직전에 임시 저장했던 예약 폼 데이터 추출
      const tempReservationData = sessionStorage.getItem('tempReservationData');

      if (!paymentKey || !orderId || !amount || !tempReservationData) {
        YesAlert.fire({ icon: 'error', title: '잘못된 접근', text: '결제 정보 또는 예약 정보가 유실되었습니다.' });
        router.push('/apply');
        return;
      }

      try {
        const parsedReservationData = JSON.parse(tempReservationData);

        // 3. 백엔드에 결제 최종 승인 및 예약 저장 요청
        // (api/index.ts의 reservationApi.create에 결제 정보까지 같이 보내도록 DTO를 수정해야 합니다)
        const requestBody = {
          ...parsedReservationData,
          paymentKey,
          orderId,
          amount: Number(amount)
        };

        await reservationApi.create(requestBody); // 백엔드 호출

        // 4. 성공 처리
        sessionStorage.removeItem('tempReservationData'); // 임시 데이터 청소
        setIsProcessing(false);
        
        await YesAlert.fire({ 
          icon: 'success', 
          title: '결제 및 신청 완료', 
          text: '동행 서비스 결제와 예약이 성공적으로 완료되었습니다.', 
          confirmButtonText: '내 예약 확인하기',
          confirmButtonColor: '#1e3a8a' 
        });
        
        router.push('/mypage');

      } catch (error: any) {
        console.error('결제 승인 실패:', error);
        YesAlert.fire({ 
          icon: 'error', 
          title: '결제 승인 실패', 
          text: '결제는 되었으나 예약 저장 중 문제가 발생했습니다. 고객센터로 문의해주세요.' 
        });
        router.push('/apply/fail');
      }
    };

    confirmPaymentAndReserve();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {isProcessing ? (
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">안전하게 결제를 승인하고 있습니다...</h2>
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