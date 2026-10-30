// app/pay/reservation/[id]/page.tsx (매니저 대리 신청 예약의 보호자 선결제)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { CreditCard, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { reservationApi } from '@/src/api/index';
import { YesAlert } from '@/src/utils/alert';

export default function ProxyPaymentPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const reservationId = rawId ? Number(rawId) : 0;

  const [isLoading, setIsLoading] = useState(true);
  const [reservation, setReservation] = useState<any>(null);
  
  // 토스 위젯을 useState 대신 useRef로 관리
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  // 위젯 중복 실행 방지용 Ref 추가
  const widgetInit = useRef(false);

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
  const customerKey = "generate-random-customer-key";

  // 1. 예약 정보 불러오기 및 토스 위젯 렌더링
  useEffect(() => {
    const fetchDetailAndWidget = async () => {
      if (!reservationId) return; // ID가 없으면 실행 안 함
      
      // React Strict Mode의 이중 렌더링 강제 방어
      if (widgetInit.current) return;
      widgetInit.current = true;

      try {
        // 예약 정보 조회
        const res = await reservationApi.getDetail(String(reservationId));
        const data = res.data;
        
        // 결제 대기 상태가 아니면 결제할 금액이 없음
        if (data.status !== 'PAYMENT_PENDING' || !data.baseFee) {
          await YesAlert.fire({ icon: 'info', title: '안내', text: '결제가 필요한 예약이 아닙니다.' });
          router.push('/mypage');
          return;
        }

        setReservation(data);

        // 토스 결제 위젯 로드 및 저장 (Ref 사용)
        const widget = await loadPaymentWidget(clientKey, customerKey);
        paymentWidgetRef.current = widget;

        // 위젯 화면에 렌더링 (서버에 저장된 기본 요금, 승인 시 서버에서 다시 검증)
        widget.renderPaymentMethods('#payment-widget', { value: data.baseFee });
        widget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' });

        setIsLoading(false);
      } catch (error) {
        console.error("예약 결제 정보 로드 실패:", error);
        YesAlert.fire({ icon: 'error', title: '오류', text: '결제 정보를 불러올 수 없습니다.' });
        router.push('/mypage');
      }
    };

    fetchDetailAndWidget();
  }, [reservationId, router]);

  // 2. 결제 요청 실행
  const handlePaymentRequest = async () => {
    try {
      const orderId = `res_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      sessionStorage.setItem('proxyPaymentTargetId', String(reservationId));

      await paymentWidgetRef.current?.requestPayment({
        orderId: orderId,
        orderName: `${reservation.hospitalName} 병원 동행 서비스`,
        successUrl: `${window.location.origin}/pay/reservation/success`,
        failUrl: `${window.location.origin}/pay/reservation/fail`,
        customerName: reservation.patientName,
      });
    } catch (error) {
      console.error("결제 호출 에러:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <main className="max-w-xl mx-auto px-6 pt-12">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-2xl font-extrabold text-gray-800">동행 예약 결제</h2>
        </div>

        {/* 결제 정보 요약 카드 */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500 mb-1">매니저 대리 신청 예약</h3>
              <p className="text-base font-bold text-gray-800">{reservation.hospitalName} · {reservation.category}</p>
              <p className="text-sm text-gray-500 mt-1">결제가 완료되면 매니저 매칭이 시작됩니다.</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-500 font-bold">결제 금액</span>
            <span className="text-2xl font-extrabold text-blue-600">
              {reservation.baseFee?.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 토스 위젯 영역 */}
        <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm mb-6">
          <div id="payment-widget" className="w-full" />
          <div id="agreement" className="w-full" />
        </div>

        {/* 결제 버튼 */}
        <button 
          onClick={handlePaymentRequest}
          className="w-full bg-blue-600 text-white text-lg font-bold py-5 rounded-[20px] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <CreditCard className="w-6 h-6" />
          {reservation.baseFee?.toLocaleString()}원 결제하기
        </button>
      </main>
    </div>
  );
}