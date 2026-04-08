'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Clock, User, CreditCard, AlertCircle, XCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ReservationDetailPage() {
  // TODO: 실제 환경에서는 URL 파라미터(id)를 통해 백엔드에서 데이터를 불러옵니다.
  // 임시(Mock) 데이터 상태 관리
  const [reservation, setReservation] = useState({
    id: 'RES-2026-001',
    status: '결제 대기', // 상태 예시: '매칭 대기', '결제 대기', '예약 확정', '이용 완료', '취소됨'
    date: '2026. 04. 15 (수)',
    time: '오전 10:00',
    hospital: '서울대학교병원 본원',
    patientName: '김부모',
    patientPhone: '010-1111-2222',
    memo: '휠체어 이동 도움이 필요합니다.',
    
    // 매칭된 매니저 정보 (매칭 전이면 null)
    manager: {
      name: '이동행',
      license: '요양보호사 1급',
      rating: 4.9,
    },

    // 결제 정보
    payment: {
      baseFee: 33000,
      extraFee: 0,
      totalFee: 33000,
    }
  });

  const handlePayment = () => {
    // TODO: 결제 모듈(토스페이먼츠, 포트원 등) 연동
    alert('결제창으로 이동합니다.');
    // 결제 성공 시뮬레이션
    setReservation(prev => ({ ...prev, status: '예약 확정' }));
  };

  const handleCancel = () => {
    const isConfirm = window.confirm('정말 예약을 취소하시겠습니까?\n취소 규정에 따라 위약금이 발생할 수 있습니다.');
    if (isConfirm) {
      // TODO: 백엔드 취소 API 연동
      alert('예약이 취소되었습니다.');
      setReservation(prev => ({ ...prev, status: '취소됨' }));
    }
  };

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // 상태별 뱃지 색상 지정 함수
  const getStatusColor = (status: string) => {
    switch (status) {
      case '매칭 대기': return 'bg-orange-100 text-orange-700';
      case '결제 대기': return 'bg-blue-100 text-blue-700';
      case '예약 확정': return 'bg-emerald-100 text-emerald-700';
      case '취소됨': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* 모바일 최적화 헤더 */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/mypage" className="flex items-center text-gray-600 hover:text-blue-900 transition-colors p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg text-blue-950">예약 상세 내역</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <motion.main 
        className="max-w-2xl mx-auto px-4 pt-6 space-y-6"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        {/* 1. 상태 및 기본 정보 카드 */}
        <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
              {reservation.status}
            </span>
            <span className="text-sm text-gray-400">예약번호: {reservation.id}</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-gray-800">{reservation.hospital}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span>{reservation.date}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-gray-400" />
                <span>{reservation.time}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-gray-400" />
                <span>환자: {reservation.patientName} ({reservation.patientPhone})</span>
              </div>
            </div>
            
            {reservation.memo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                <span className="font-semibold text-gray-700">요청사항: </span>
                {reservation.memo}
              </div>
            )}
          </div>
        </motion.section>

        {/* 2. 매니저 정보 카드 (매칭된 경우만 표시) */}
        {reservation.manager && reservation.status !== '취소됨' && (
          <motion.section variants={itemVariants} className="bg-emerald-50 rounded-[24px] p-6 shadow-sm border border-emerald-100">
            <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              배정된 매니저 정보
            </h3>
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg">
                {reservation.manager.name.charAt(0)}
              </div>
              <div>
                <p className="font-extrabold text-gray-800">{reservation.manager.name} 매니저</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {reservation.manager.license} | 평점 ⭐ {reservation.manager.rating}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* 3. 결제 정보 카드 */}
        <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-500" />
            결제 정보
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>기본 서비스 요금 (2시간)</span>
              <span>{reservation.payment.baseFee.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>추가 요금 / 할증</span>
              <span>{reservation.payment.extraFee.toLocaleString()}원</span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
              <span className="font-bold text-gray-800">총 결제 금액</span>
              <span className="text-xl font-extrabold text-blue-950">
                {reservation.payment.totalFee.toLocaleString()}원
              </span>
            </div>
          </div>
        </motion.section>

        {/* 4. 취소 규정 안내 */}
        {reservation.status !== '취소됨' && (
          <motion.div variants={itemVariants} className="bg-gray-50 rounded-xl p-4 flex gap-3 items-start border border-gray-200">
            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              서비스 이용 24시간 전까지는 위약금 없이 무료 취소가 가능합니다. 그 이후 취소 시 규정에 따라 위약금이 발생할 수 있습니다. 
              <Link href="/guide" className="text-blue-600 underline ml-1">상세 보기</Link>
            </p>
          </motion.div>
        )}

        {/* 5. 하단 액션 버튼 (상태에 따라 변경됨) */}
        <motion.div variants={itemVariants} className="pt-4 flex gap-3">
          {reservation.status === '결제 대기' && (
            <button 
              onClick={handlePayment}
              className="flex-1 bg-blue-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-950 transition-colors"
            >
              결제하기
            </button>
          )}

          {(reservation.status === '결제 대기' || reservation.status === '매칭 대기' || reservation.status === '예약 확정') && (
            <button 
              onClick={handleCancel}
              className="px-6 bg-white border border-gray-200 text-gray-600 font-bold py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              <span className="hidden md:inline">예약 취소</span>
            </button>
          )}
          
          {reservation.status === '취소됨' && (
            <button className="flex-1 bg-gray-200 text-gray-500 font-bold py-4 rounded-2xl cursor-not-allowed">
              취소된 예약입니다
            </button>
          )}
        </motion.div>

      </motion.main>
    </div>
  );
}