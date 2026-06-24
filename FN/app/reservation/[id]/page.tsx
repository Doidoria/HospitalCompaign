// app/reservation/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Clock, User, CreditCard, AlertCircle, XCircle, ShieldCheck, FileText, MessageSquare, HelpCircle, 
  ChevronRight, Navigation, Heart 
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { reservationApi, authApi } from '@/src/api/index';
import { Toast, YesAlert } from '@/src/utils/alert';
import { ReservationDetailState } from '@/src/types/reservation';
import Link from 'next/link';

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const [reservation, setReservation] = useState<ReservationDetailState>({
    id: '', status: '', date: '', time: '', hospital: '',
    patientName: '', patientPhone: '', memo: '',
    manager: null, payment: { baseFee: 0, extraFee: 0, totalFee: 0 },
    category: '', detailedContent: '', doctorInquiry: '', meetingPoint: '', patientAddress: '',
    transportation: '', mobility: '',
    bloodType: '', underlyingDisease: '', medication: '', preparedDocuments: '' // 건강 정보 초기화
  });
  // 로그인 제공자(provider) 저장용 상태
  const [authProvider, setAuthProvider] = useState("LOCAL");

  // 주소의 '///' 기호를 공백으로 예쁘게 치환해주는 포맷 함수
  const formatAddress = (address: string) => {
    if (!address) return '장소 정보 없음';
    // '///'를 띄어쓰기로 변경하고, 혹시 모를 다중 공백을 하나로 압축
    return address.split('///').join(' ').replace(/\s+/g, ' ').trim();
  };

  useEffect(() => {
    let isMounted = true; 

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
        
        if (!isMounted) return;

        setUserEmail(userRes.data.email);
        // 백엔드에서 주는 가입 경로 정보 저장 (없으면 기본값 LOCAL)
        setAuthProvider(userRes.data.provider || 'LOCAL');
        const apiData = resDetail.data;

        const dateObj = new Date(apiData.reservationTime);
        const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
        const timeStr = dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

        setReservation({
          id: String(apiData.id),
          status: apiData.status === 'WAITING' ? '매칭 대기' : apiData.status,
          date: dateStr,
          time: timeStr,
          hospital: apiData.hospitalName,
          patientName: apiData.patientName,
          patientPhone: apiData.patientPhone || '연락처 없음', 
          memo: apiData.requirements || '',
          manager: (apiData.managerName && apiData.managerName !== '-' && apiData.managerName !== '배정완료')
            ? { id: String(apiData.managerId) || '', name: apiData.managerName, license: '전문 교육 수료', rating: '5.0' } 
            : null,
          payment: { baseFee: 33000, extraFee: 0, totalFee: 33000 },
          category: apiData.category || '진료',
          detailedContent: apiData.detailedContent || '',
          doctorInquiry: apiData.doctorInquiry || '',
          meetingPoint: apiData.meetingPoint || '자택',
          patientAddress: apiData.patientAddress || '',
          transportation: apiData.transportation || '택시 이용',
          mobility: apiData.mobility || '독립 보행 가능',
          bloodType: apiData.bloodType || '',
          underlyingDisease: apiData.underlyingDisease || '',
          medication: apiData.medication || '',
          preparedDocuments: apiData.preparedDocuments || ''
        });

      } catch (error) {
        console.error('로딩 에러:', error);
        if (isMounted) {
          Toast.fire({ icon: 'error', title: '예약 내역을 불러올 수 없습니다.' });
          router.push('/mypage');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => { isMounted = false; };
  }, [params.id, router]);

  const handlePayment = useCallback(() => {
    Toast.fire({ icon: 'info', title: '결제창으로 이동합니다.' });
    setReservation(prev => ({ ...prev, status: '예약 확정' }));
  }, []);

  const handleCancel = useCallback(async () => {
    if (reservation.status !== '매칭 대기') {
      Toast.fire({ icon: 'warning', title: '매칭 대기 상태에서만 취소가 가능합니다.' });
      return;
    }

    if (authProvider === 'KAKAO') {
      const confirmResult = await YesAlert.fire({
        title: '예약 취소',
        text: '정말 예약을 취소하시겠습니까?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: '네, 취소합니다',
        cancelButtonText: '닫기'
      });

      if (confirmResult.isConfirmed) {
        try {
          await reservationApi.cancel(reservation.id as any);
          Toast.fire({ icon: 'success', title: '예약이 정상적으로 취소되었습니다.' });
          router.push('/mypage');
        } catch (error) {
          Toast.fire({ icon: 'error', title: '오류가 발생했습니다.' });
        }
      }
      return;
    }

    const { value: password } = await YesAlert.fire({
      title: '예약 취소 본인 확인',
      text: '보안을 위해 계정 비밀번호를 한 번 더 입력해 주세요.',
      input: 'password',
      inputPlaceholder: '비밀번호 입력',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: '취소 진행',
      cancelButtonText: '닫기',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl font-bold',
        cancelButton: 'rounded-xl font-bold'
      }
    });

    if (password) {
      try {
        await authApi.login({ email: userEmail, password });
        await reservationApi.cancel(reservation.id as any);

        Toast.fire({ icon: 'success', title: '예약이 정상적으로 취소되었습니다.' });
        router.push('/mypage');
      } catch (error) {
        Toast.fire({ icon: 'error', title: '비밀번호가 일치하지 않거나 오류가 발생했습니다.' });
      }
    }
  }, [reservation.status, reservation.id, userEmail, router]);

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
      case '매칭 대기': return 'bg-orange-50 text-orange-600 border-orange-200';
      case '결제 대기': return 'bg-blue-50 text-blue-600 border-blue-200';
      case '예약 확정': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case '취소됨': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <div className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100 animate-pulse">
          <div className="flex justify-between items-start mb-6">
            <div className="h-6 bg-slate-200 rounded-md w-1/4"></div>
            <div className="h-8 bg-slate-200 rounded-full w-24"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded-md w-2/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-16 bg-slate-50 rounded-2xl w-full"></div>
            <div className="h-16 bg-slate-50 rounded-2xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* 상단 네비게이션바 느낌의 헤더 */}
      <header className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">예약 상세내역</h1>
      </header>

      <motion.main className="max-w-2xl mx-auto px-4 space-y-5" initial="hidden" animate="visible" variants={pageVariants}>
        
        {/* 1. 메인 예약 정보 카드 */}
        <motion.section variants={itemVariants} className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold mb-3 ${
                reservation.category === '검사' ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {reservation.category} 목적
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {reservation.hospital}
              </h2>
            </div>
            <div className={`flex flex-col items-end`}>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(reservation.status)} whitespace-nowrap`}>
                {reservation.status}
              </span>
              <span className="text-[11px] text-slate-400 mt-2 font-medium">No. {reservation.id}</span>
            </div>
          </div>

          {/* 주요 정보 요약 박스 */}
          <div className="bg-slate-50 rounded-2xl p-5 grid grid-cols-2 gap-y-5 gap-x-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 예약일
              </p>
              <p className="font-bold text-slate-800">{reservation.date}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> 시간
              </p>
              <p className="font-bold text-slate-800">{reservation.time}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> 동행 대상 (환자)
              </p>
              <p className="font-bold text-slate-800">{reservation.patientName} <span className="text-slate-500 font-normal ml-1">({reservation.patientPhone})</span></p>
            </div>
          </div>

          {/* 동행 기본 정보 */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-orange-100 mb-6 bg-orange-50/20">
            <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" /> 동행 기본 정보
            </h4>
            
            <div className="space-y-3">
              {/* 만나는 장소 */}
              <div className="flex items-start gap-4 border-b border-slate-100/50 pb-4">
                <span className="text-sm font-semibold text-slate-500 w-20 shrink-0 mt-2">만나는 장소</span>
                <div className="flex-1 flex items-center gap-3 text-left">
                  <span className="text-sm font-bold text-slate-800 break-keep mt-0.5">
                    {reservation.meetingPoint.includes('///') 
                      ? reservation.meetingPoint.split('///').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)
                      : reservation.meetingPoint}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      const searchTarget = reservation.meetingPoint === '자택' ? reservation.patientAddress : reservation.meetingPoint.split('///')[0];
                      if (!searchTarget || searchTarget === '자택') {
                        Toast.fire({ icon: 'warning', title: '정확한 주소 정보가 없습니다.' });
                        return;
                      }
                      window.open(`https://map.kakao.com/link/search/${encodeURIComponent(searchTarget.trim())}`, '_blank');
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FEE500] text-[#191919] text-[11px] font-bold rounded-lg hover:bg-[#FADA0A] transition-all shadow-sm"
                  >
                    <Navigation className="w-3 h-3" /> 카카오맵
                  </button>
                </div>
              </div>

              {/* 이동 수단 */}
              <div className="flex items-center gap-4 border-b border-slate-100/50 pb-4">
                <span className="text-sm font-semibold text-slate-500 w-20 shrink-0">이동 수단</span>
                <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  {reservation.transportation}
                </span>
              </div>

              {/* 환자 거동 상태 */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-500 w-20 shrink-0">거동 상태</span>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                  {reservation.mobility}
                </span>
              </div>
            </div>
          </div>

          {/* 텍스트 요청사항 섹션들 */}
          {(reservation.memo || reservation.detailedContent || reservation.doctorInquiry) && (
            <div className="mt-8 space-y-3">
              {reservation.memo && (
                <div className="p-4 bg-slate-50/80 rounded-2xl flex gap-3 border border-slate-100">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1">보호자 특별 요청사항</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{reservation.memo}</p>
                  </div>
                </div>
              )}
              {reservation.detailedContent && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl flex gap-3 border border-indigo-100/50">
                  <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <span className="text-xs font-bold text-indigo-600 block mb-2">진료/검사 상세 내역</span>
                    <div className="space-y-1">
                      {reservation.detailedContent.split('\n').map((line, index) => (
                        <p key={index} className="text-sm text-slate-700 leading-relaxed flex gap-2">
                          <span className="text-indigo-300">•</span> {line.replace('- ', '')}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {reservation.doctorInquiry && (
                <div className="p-4 bg-amber-50/50 rounded-2xl flex gap-3 border border-amber-100/50">
                  <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-600 block mb-1">의사 선생님께 꼭 여쭤볼 질문</span>
                    <p className="text-sm text-amber-900 leading-relaxed font-medium">{reservation.doctorInquiry}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 환자 사전 건강 정보 표시 영역 */}
          {(reservation.bloodType || reservation.underlyingDisease || reservation.medication || reservation.preparedDocuments) && (
            <div className="p-5 bg-pink-50/50 rounded-2xl flex flex-col gap-3 border border-pink-100 mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-5 h-5 text-pink-500 shrink-0" />
                <span className="text-sm font-bold text-pink-600">환자 사전 건강 정보</span>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-sm">
                {reservation.bloodType && <div><span className="block text-xs text-pink-400 mb-1 font-semibold">혈액형</span><span className="font-bold text-slate-700">{reservation.bloodType}</span></div>}
                {reservation.underlyingDisease && <div><span className="block text-xs text-pink-400 mb-1 font-semibold">기저 질환</span><span className="font-bold text-slate-700">{reservation.underlyingDisease}</span></div>}
                {reservation.medication && <div><span className="block text-xs text-pink-400 mb-1 font-semibold">현재 복용 약</span><span className="font-bold text-slate-700">{reservation.medication}</span></div>}
                {reservation.preparedDocuments && <div><span className="block text-xs text-pink-400 mb-1 font-semibold">지참 준비 서류</span><span className="font-bold text-slate-700">{reservation.preparedDocuments}</span></div>}
              </div>
            </div>
          )}
        </motion.section>

        {/* 2. 매니저 정보 카드 */}
        {reservation.status !== '취소됨' && (
          <motion.section variants={itemVariants}>
            <h3 className="text-sm font-bold text-slate-500 mb-3 ml-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 동행 매니저 정보
            </h3>
            {reservation.manager ? (
              <Link href={`/manager/profile/${reservation.manager.id}`} className="block group">
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group-hover:border-emerald-200 group-hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl shrink-0 border border-emerald-100">
                      {reservation.manager.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">
                        {reservation.manager.name} <span className="font-medium text-sm text-slate-500">매니저</span>
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{reservation.manager.license}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-amber-500 font-bold flex items-center">⭐ {reservation.manager.rating}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ) : (
              <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-sm font-bold text-slate-400 text-center py-2">아직 매니저가 배정되지 않았습니다.</p>
              </div>
            )}
          </motion.section>
        )}

        {/* 3. 결제 정보 카드 */}
        <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-400" /> 결제 정보
          </h3>
          <div className="space-y-4 text-sm px-1">
            <div className="flex justify-between text-slate-500">
              <span>기본 동행 요금 (2시간)</span>
              <span className="font-medium text-slate-700">{reservation.payment.baseFee.toLocaleString()}원</span>
            </div>
            {reservation.payment.extraFee > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>추가 요금 / 할증</span>
                <span className="font-medium text-slate-700">{reservation.payment.extraFee.toLocaleString()}원</span>
              </div>
            )}
            <div className="border-t border-dashed border-slate-200 pt-4 mt-2 flex justify-between items-center">
              <span className="font-extrabold text-slate-800">총 결제 금액</span>
              <span className="text-2xl font-extrabold text-indigo-600">
                {reservation.payment.totalFee.toLocaleString()}원
              </span>
            </div>
          </div>
        </motion.section>

        {/* 4. 취소 안내 & 액션 버튼 영역 */}
        <motion.div variants={itemVariants} className="pt-2 space-y-4">
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
          <div className="flex gap-3">
            {reservation.status === '결제 대기' && (
              <button onClick={handlePayment} className="flex-1 bg-indigo-600 text-white font-bold py-4.5 rounded-[20px] shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all active:scale-[0.98]">
                결제 진행하기
              </button>
            )}
            {reservation.status === '매칭 대기' ? (
              <>
                <button onClick={() => router.push(`/reservation/edit/${reservation.id}`)}
                  className="flex-1 bg-white border-2 border-indigo-100 text-indigo-600 font-bold py-4 rounded-[20px] hover:bg-indigo-50 transition-all active:scale-[0.98]"
                >
                  예약 수정
                </button>
                <button onClick={handleCancel}
                  className="flex-1 bg-white border-2 border-slate-100 text-slate-600 font-bold py-4 rounded-[20px] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <XCircle className="w-5 h-5" /> 예약 취소
                </button>
              </>
            ) : (
              reservation.status !== '결제 대기' && (
                <div className="w-full bg-slate-100/50 text-slate-400 text-sm font-semibold py-4.5 rounded-[20px] text-center border border-slate-100">
                  현재 상태에서는 예약 수정 및 취소가 불가합니다
                </div>
              )
            )}
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}