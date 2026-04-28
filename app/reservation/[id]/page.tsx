'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Clock, User, CreditCard, AlertCircle, XCircle, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { reservationApi, authApi } from '@/src/api/index';

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [reservation, setReservation] = useState({
    id: '',
    status: '', 
    date: '',
    time: '',
    hospital: '',
    patientName: '',
    patientPhone: '010-0000-0000',
    memo: '안전한 동행 부탁드립니다.',
    manager: null as any,
    payment: { baseFee: 33000, extraFee: 0, totalFee: 33000 },
    category: '진료',
    detailedContent: '',
    doctorInquiry: ''
  });

  useEffect(() => {
    const fetchDetail = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const [userRes, resDetail] = await Promise.all([
          authApi.getMe(),
          reservationApi.getDetail(params.id as string)
        ]);
        
        setUserEmail(userRes.data.email);
        const apiData = resDetail.data;

        const dateObj = new Date(apiData.reservationTime);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
        const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

        setReservation(prev => ({
          ...prev,
          id: apiData.id,
          status: apiData.status === 'WAITING' ? '매칭 대기' : apiData.status,
          date: dateStr,
          time: timeStr,
          hospital: apiData.hospitalName,
          patientName: apiData.patientName,
          patientPhone: apiData.patientPhone || '연락처 없음', 
          memo: apiData.requirements || '요청사항 없음',
          manager: apiData.managerName && apiData.managerName !== '-' 
            ? { name: apiData.managerName, license: '자격증 검증 완료', rating: '5.0' } 
            : null,
          category: apiData.category || '진료',
          detailedContent: apiData.detailedContent || '',
          doctorInquiry: apiData.doctorInquiry || ''
        }));

      } catch (error) {
        console.error('로딩 에러:', error);
        Swal.fire({ icon: 'error', title: '오류', text: '예약 내역을 불러올 수 없습니다.' });
        router.push('/mypage');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [params.id, router]);

  // 결제 버튼 로직 (원본 유지)
  const handlePayment = () => {
    alert('결제창으로 이동합니다.');
    setReservation(prev => ({ ...prev, status: '예약 확정' }));
  };

  // 예약 취소 로직 (비밀번호 확인 추가)
  const handleCancel = async () => {
    // 1. 상태 체크 (매칭 대기 상태에서만 가능)
    if (reservation.status !== '매칭 대기') {
      Swal.fire({
        icon: 'error',
        title: '취소 불가',
        text: '매칭 대기 상태에서만 직접 취소가 가능합니다. 그 외 상태는 고객센터로 문의해 주세요.'
      });
      return;
    }

    // 2. 비밀번호 입력 (보안)
    const { value: password } = await Swal.fire({
      title: '예약 취소 본인 확인',
      text: '보안을 위해 계정 비밀번호를 한 번 더 입력해 주세요.',
      input: 'password',
      inputPlaceholder: '비밀번호 입력',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: '비밀번호 확인 및 취소',
      cancelButtonText: '닫기'
    });

    if (password) {
      try {
        // 3. 비밀번호 검증 후 삭제 진행
        await authApi.login({ email: userEmail, password: password });
        await reservationApi.cancel(reservation.id); 

        await Swal.fire({ icon: 'success', title: '취소 완료', text: '예약이 정상적으로 취소되었습니다.' });
        router.push('/mypage');
      } catch (error) {
        Swal.fire({ icon: 'error', title: '인증 실패', text: '비밀번호가 일치하지 않거나 서버 오류가 발생했습니다.' });
      }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case '매칭 대기': return 'bg-orange-100 text-orange-700';
      case '결제 대기': return 'bg-blue-100 text-blue-700';
      case '예약 확정': return 'bg-emerald-100 text-emerald-700';
      case '취소됨': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-900 w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
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
        initial="hidden" animate="visible" variants={pageVariants}
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
            <div>
              <span className={`inline-block px-2.5 py-1 mb-2 rounded-md text-xs font-bold ${
                reservation.category === '검사' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {reservation.category}
              </span>
              <h2 className="text-xl font-extrabold text-gray-800">{reservation.hospital}</h2>
            </div>
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

            {/* 상세 내역 출력 */}
            {reservation.detailedContent && (
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600">
                <span className="font-semibold text-gray-800 block mb-1">상세 내역:</span>
                {reservation.detailedContent}
              </div>
            )}

            {/* 의사 질의 출력 */}
            {reservation.doctorInquiry && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900">
                <span className="font-semibold text-amber-800 block mb-1">의사 선생님께 드릴 질문:</span>
                {reservation.doctorInquiry}
              </div>
            )}
          </div>
        </motion.section>

        {/* 2. 매니저 정보 카드 */}
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

        {/* 5. 하단 액션 버튼 */}
        <motion.div variants={itemVariants} className="pt-4 flex gap-3">
          {reservation.status === '결제 대기' && (
            <button onClick={handlePayment} className="flex-1 bg-blue-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-950 transition-colors">
              결제하기
            </button>
          )}

          {/* 오직 '매칭 대기' 일 때만 취소 버튼 활성화 */}
          {reservation.status === '매칭 대기' ? (
            <div className="w-full flex gap-3">
              <button 
                onClick={() => router.push(`/reservation/edit/${reservation.id}`)}
                className="flex-1 bg-white border border-blue-200 text-blue-600 font-bold py-4 rounded-2xl hover:bg-blue-50 transition-colors"
              >
                예약 수정
              </button>
              <button 
                onClick={handleCancel}
                className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                <span>예약 취소</span>
              </button>
            </div>
          ) : (
            reservation.status !== '결제 대기' && (
              <div className="w-full bg-gray-100 text-gray-400 text-sm font-bold py-4 rounded-2xl text-center">
                현재 상태에서는 직접 수정 및 취소가 불가합니다
              </div>
            )
          )}
        </motion.div>

      </motion.main>
    </div>
  );
}