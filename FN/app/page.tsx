// app/page.tsx
'use client'; 

import React, { useEffect, useState } from 'react';
import { HeartPulse, CalendarCheck, UserCheck, Activity, FileText, ChevronRight, ShieldCheck, Clock, Smile, ArrowRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { reviewApi } from '@/src/api/index';
import dayjs from 'dayjs';
import EventPopup from '@/src/components/EventPopup';
import { ReviewResponse } from '@/src/types/review'; // 백엔드 ReviewResponse와 매칭되는 타입

export default function Home() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);

  useEffect(() => {
    reviewApi.getReviews(0, 3)
      .then((data: any) => {
        const reviewList = data.content || data;
        setReviews(Array.isArray(reviewList) ? reviewList.slice(0, 3) : []);
      })
      .catch(err => console.error("메인페이지 리뷰 로딩 실패:", err));
  }, []);

  const maskName = (name: string) => {
    if (!name || name.length < 2) return name;
    if (name.length === 2) return name[0] + '*';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-x-hidden relative">
      <EventPopup />
      {/* 1. 히어로 섹션 */}
      <motion.section className="bg-gradient-to-b from-blue-950 via-blue-900 to-gray-900 text-white py-16 md:py-32 px-6 text-center overflow-hidden relative z-0"
        initial="hidden" animate="visible" variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <motion.div className="inline-flex items-center gap-2 bg-white/10 text-emerald-300 px-5 py-2 rounded-full font-semibold text-sm border border-white/20 shadow-lg mx-auto backdrop-blur-md" variants={itemVariants}>
              <HeartPulse className="w-5 h-5" />
              <span>건강한 삶을 함께하는 안심 파트너, 예스케어</span>
          </motion.div>

          <motion.h2 className="text-4xl md:text-7xl font-extrabold leading-tight break-keep tracking-tight" variants={itemVariants}>
            가족의 마음으로<br />
            병원 동행을 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">완성</span>합니다
          </motion.h2>

          <motion.p className="text-blue-100/90 text-lg md:text-2xl max-w-2xl mx-auto break-keep leading-relaxed" variants={itemVariants}>
            전문 교육을 이수한 병원동행 매니저가<br className="hidden md:block" /> 집 앞부터 병원 진료, 귀가까지 안전하게 모십니다.
          </motion.p>

          <motion.div className="pt-6 md:pt-10" variants={itemVariants}>
            <Link href="/apply">
              <button className="group bg-white text-blue-950 text-lg py-4 px-8 md:text-xl md:py-5 md:px-12 font-extrabold rounded-full shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center justify-center mx-auto space-x-3">
                <span>지금 바로 동행 신청하기</span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* 2. 신뢰도 상승 포인트 섹션 */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex flex-col items-center py-4 md:py-0">
            <ShieldCheck className="w-10 h-10 text-blue-600 mb-3" />
            <h4 className="font-bold text-lg text-gray-900">철저한 신원 검증</h4>
            <p className="text-gray-500 text-sm mt-1">전문 교육 수료 및 범죄 이력 조회 완료</p>
          </div>
          <div className="flex flex-col items-center py-4 md:py-0">
            <Clock className="w-10 h-10 text-blue-600 mb-3" />
            <h4 className="font-bold text-lg text-gray-900">원하는 시간에 맞춰</h4>
            <p className="text-gray-500 text-sm mt-1">당일 예약부터 정기 방문까지 유연하게</p>
          </div>
          <div className="flex flex-col items-center py-4 md:py-0">
            <Smile className="w-10 h-10 text-blue-600 mb-3" />
            <h4 className="font-bold text-lg text-gray-900">상세한 케어 리포트</h4>
            <p className="text-gray-500 text-sm mt-1">진료 내용과 의사 소견을 보호자에게 직접 전달</p>
          </div>
        </div>
      </section>

      {/* 3. 서비스 진행 절차 */}
      <motion.section className="py-20 md:py-28 px-6 max-w-7xl mx-auto w-full relative z-0"
        initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants}>
        <div className="text-center mb-14 md:mb-20">
          <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">서비스 진행 절차</h3>
          <p className="text-lg md:text-xl text-gray-500 mt-4 max-w-xl mx-auto break-keep leading-relaxed">
            간편하게 신청하고 안심하고 이용하세요.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative">
          {/* 절차를 연결하는 점선 라인 */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-gray-200 -z-10 -translate-y-1/2"></div>
          {[
            { step: '1. 서비스 신청', desc: '원하시는 날짜와 병원을 선택해 신청합니다.', Icon: CalendarCheck },
            { step: '2. 매니저 매칭', desc: '전문 교육을 수료한 매니저가 안전하게 배정됩니다.', Icon: UserCheck },
            { step: '3. 병원 동행', desc: '이동, 접수, 진료 동석 등 모든 과정을 함께합니다.', Icon: Activity },
            { step: '4. 케어 리포트', desc: '진료 결과와 다음 예약일을 보호자에게 전송합니다.', Icon: FileText },
          ].map((item, idx) => (
            <motion.div key={idx} className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group" variants={itemVariants}>
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <item.Icon className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h4 className="font-bold text-xl mb-3 text-gray-900">{item.step}</h4>
              <p className="text-gray-500 break-keep leading-relaxed text-base">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. 서비스 이용 후기 섹션 */}
      <motion.section 
        className="py-24 bg-white relative overflow-hidden"
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.2 }} 
        variants={containerVariants}
      >
        {/* 우측 상단 은은한 배경 데코 */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="text-left">
              <motion.h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-4" variants={itemVariants}>
                이미 많은 분들이 경험하셨습니다
              </motion.h2>
              <motion.p className="text-lg text-gray-500 max-w-xl break-keep" variants={itemVariants}>
                실제 이용 고객님들이 직접 남겨주신 소중한 후기입니다.<br/> 예스케어는 항상 가족과 같은 마음으로 정성을 다해 모시겠습니다.
              </motion.p>
            </div>
            <motion.div variants={itemVariants} className="hidden md:block">
               <Link href="/review" className="flex items-center gap-2 text-blue-600 font-bold hover:underline group">
                전체 이용 후기 보기 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* 후기 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <motion.div 
                  key={review.id} 
                  className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex flex-col justify-between hover:bg-blue-50/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group"
                  variants={itemVariants}
                >
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-orange-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6 break-keep italic whitespace-pre-wrap">
                      "{review.comment}"
                    </p>
                  </div>
                  {/* 하단 사용자 정보 */}
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-200/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {review.authorName ? review.authorName[0] : '고'}
                      </div>
                      <div>
                        <span className="block font-bold text-gray-900 text-sm">{maskName(review.authorName)} 고객님</span>
                        <span className="text-[11px] text-blue-600 font-semibold">예스케어 서비스 이용</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400">{dayjs(review.createdAt).format('YYYY.MM.DD')}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-3 text-center py-16 text-gray-500 bg-gray-50 rounded-3xl border border-gray-100">
                아직 작성된 후기가 없습니다. 첫 후기의 주인공이 되어주세요!
              </div>
            )}
          </div>
          
          {/* 모바일 전용 전체보기 버튼 */}
          <motion.div className="mt-12 text-center md:hidden" variants={itemVariants}>
            <Link href="/review" className="inline-flex items-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform">
              전체 이용 후기 보기
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}