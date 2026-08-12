// app/guide/page.tsx
'use client';

import { motion, Variants } from 'framer-motion';
import { 
  Check, Clock, CreditCard, Sparkles, Copy, FileBadge,
  PenTool, Users, MapPin, Car, Building2, Stethoscope, Home, X,
  AlertCircle, ArrowRight, ShieldCheck, AlertTriangle, CalendarRange, Ban
} from 'lucide-react';
import { Toast } from '@/src/utils/alert';
import Link from 'next/link';

const FAQS = [
  {
    question: '결제는 어떻게 진행되나요?',
    answer: '현재는 예약 확정을 위해 기본 서비스 요금에 대한 [무통장 입금 및 계좌이체]만 지원하고 있습니다. 보호자님들의 더욱 편리한 결제를 위해 신용카드 및 간편결제 시스템이 곧 도입될 예정이오니 많은 양해 부탁드립니다.'
  },
  {
    question: '예약을 취소하거나 변경하고 싶어요.',
    answer: '서비스 이용일 기준 24시간 전까지는 위약금 없이 100% 환불 및 변경이 가능합니다. 단, 24시간 이내 취소 시에는 선입금하신 요금의 50%가 위약금으로 발생하며, 서비스 당일 취소는 환불이 불가합니다.'
  },
  {
    question: '멀리 사는 부모님을 대신해 제가 신청해도 되나요?',
    answer: '네, 물론 가능합니다! 보호자님께서 신청 및 입금해 주시고 실제 이용하시는 부모님의 정보를 입력해 주시면 됩니다. 진료가 끝난 후에는 보호자님의 카카오톡 및 이메일로 상세한 케어 리포트를 전송해 드립니다.'
  },
  {
    question: '이용 시간이 예정보다 길어지면 어떻게 되나요?',
    answer: '안내된 기본 시간(2시간 또는 3시간)을 초과할 경우, 30분 단위로 5,500원의 추가 요금이 발생합니다. 추가 요금은 서비스가 모두 종료된 후 매니저의 안내에 따라 추가로 계좌이체 해 주시면 됩니다.'
  }
];

const STEPS = [
  { title: '동행 신청', desc: '웹/앱으로 날짜와 병원 예약', icon: PenTool, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-t-blue-500' },
  { title: '매니저 배정', desc: '상황에 맞는 전문 매니저 매칭', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-t-indigo-500' },
  { title: '자택 방문', desc: '약속된 시간에 지정 장소 도착', icon: MapPin, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-t-teal-500' },
  { title: '병원 이동', desc: '안전하고 편안하게 병원 이동', icon: Car, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-t-sky-500' },
  { title: '수속 및 대기', desc: '진료 접수 및 대기 동선 안내', icon: Building2, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-t-violet-500' },
  { title: '진료 동행', desc: '진료실 동석 및 처방 내용 기록', icon: Stethoscope, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-t-rose-500' },
  { title: '안전한 귀가', desc: '약국 방문 후 처음 장소로 귀가', icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-t-emerald-500' },
  { title: '결과 안내', desc: '특이사항 및 진료 리포트 발송', icon: FileBadge, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-t-amber-500' },
];

const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } }
};

export default function GuidePage() {

  const handleCopyAccount = async () => {
    const accountText = "05398227780904";
    try {
      await navigator.clipboard.writeText(accountText);
      Toast.fire({ icon: 'success', title: '계좌번호가 복사되었습니다.' });
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      Toast.fire({ icon: 'error', title: '복사를 지원하지 않는 브라우저입니다. 직접 메모해 주세요.' });
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-200 pb-16 break-keep bg-slate-900">
      {/* 고퀄리티 어두운 계열 메쉬 그라데이션 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[150px]"></div>
        <div className="absolute top-[30%] left-[60%] w-[35%] h-[35%] bg-teal-400/10 rounded-full blur-[120px]"></div>
      </div>
      <motion.main 
        className="relative z-10 max-w-5xl mx-auto px-5 pt-12 md:pt-20"
        initial="hidden"
        animate="visible"
        variants={STAGGER_CONTAINER}
      >
        {/* 1. 헤더 섹션 */}
        <motion.div variants={FADE_UP} className="text-center mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-blue-500/10 border border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-sm font-bold text-blue-400 tracking-tight">예스케어 이용 안내</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            가족과 같은 마음 그대로,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">투명하고 합리적인 요금</span>
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            숨겨진 비용 없이 명확하게 안내해 드립니다. <br className="hidden md:block" />
            예약 확정을 위해 기본 서비스 요금의 선입금이 필요합니다.
          </p>
        </motion.div>

        {/* 2. 요금 안내 섹션 */}
        <motion.div variants={FADE_UP} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          
          {/* 기본 요금 카드 */}
          <div className="lg:col-span-7 bg-gradient-to-br from-slate-700 to-slate-700/90 rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-extrabold text-white mb-2">기본 서비스 요금</h3>
              <p className="text-blue-200/60 text-sm mb-8">자택 출발부터 병원 진료 후 귀가까지의 모든 과정 포함</p>
              <div className="space-y-4 mb-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between bg-slate-900/60 p-5 md:p-6 rounded-3xl border border-slate-700/50 hover:border-blue-500/40 transition-colors">
                  <span className="text-lg md:text-xl font-bold text-slate-300 mb-2 sm:mb-0">2시간 이용 시</span>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl md:text-3xl font-black text-blue-400 tracking-tighter">44,000</span>
                    <span className="text-base font-medium text-slate-400 mb-1">원</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between bg-slate-900/60 p-5 md:p-6 rounded-3xl border border-slate-700/50 hover:border-blue-500/40 transition-colors">
                  <span className="text-lg md:text-xl font-bold text-slate-300 mb-2 sm:mb-0">3시간 이용 시</span>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl md:text-3xl font-black text-blue-400 tracking-tighter">66,000</span>
                    <span className="text-base font-medium text-slate-400 mb-1">원</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between bg-slate-900/60 p-5 md:p-6 rounded-3xl border border-slate-700/50 hover:border-blue-500/40 transition-colors">
                  <span className="text-lg md:text-xl font-bold text-slate-300 mb-2 sm:mb-0">4시간 이용 시</span>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl md:text-3xl font-black text-blue-400 tracking-tighter">88,000</span>
                    <span className="text-base font-medium text-slate-400 mb-1">원</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['안전한 왕복 이동 동행', '진료 및 수납 전 과정 동행', '처방 약국 방문 동행', '사전 예약 100% 선입금제'].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-slate-300 text-sm md:text-base font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 추가 요금 카드 */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-slate-700 relative overflow-hidden flex-1">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-extrabold text-white">추가 및 할증 요금</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex justify-between items-center pb-5 border-b border-slate-700/50">
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-medium">기본 시간 초과 (30분 미만)</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">추가 비용 없음</span>
                </li>
                <li className="flex justify-between items-center pb-5 border-b border-slate-700/50">
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-medium">시간 초과 (30분당)</span>
                    <span className="text-xs text-slate-400 mt-1">
                      * 30분 이상 지연 시부터 합산되어 청구됩니다.
                    </span>
                  </div>
                  <span className="text-lg font-bold text-white whitespace-nowrap">+ 11,000원</span>
                </li>
                <li className="flex justify-between items-center pb-5 border-b border-slate-700/50">
                  <span className="text-slate-300 font-medium">주말 및 공휴일 할증</span>
                  <span className="text-lg font-bold text-white">+ 5,000원</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">야간 할증 (18시 이후)</span>
                  <span className="text-lg font-bold text-white">+ 5,000원</span>
                </li>
              </ul>
              <div className="mt-8 flex items-start gap-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-400 leading-relaxed">
                  대기 시간이 길어지거나 검사 지연으로 시간을 초과할 경우 사후 정산됩니다.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. 계좌 입금 안내 */}
        <motion.div variants={FADE_UP} className="mb-24">
          <div className="bg-slate-800 border border-slate-700 rounded-[2.5rem] p-8 md:p-10 shadow-lg relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-emerald-500"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10 pl-2 md:pl-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-7 h-7 text-emerald-400" />
                  <h3 className="text-2xl font-bold text-white">결제 계좌 안내</h3>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                    카드 결제 준비 중
                  </span>
                </div>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  신속한 매니저 배정을 위해 현재 무통장 입금 및 계좌이체를 통한<br className="hidden md:block" /> 선결제 방식으로 운영되고 있습니다.
                </p>
              </div>
              <div className="w-full md:w-auto bg-slate-900 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 border border-slate-700">
                <div className="text-center sm:text-left">
                  <p className="text-slate-400 text-xs font-medium mb-1">하나은행 (예금주: 주식회사 웰커뮤니티)</p>
                  <p className="text-white text-xl md:text-xl font-mono font-bold tracking-wider">053-982277-80904</p>
                </div>
                <button onClick={handleCopyAccount}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>복사하기</span>
                </button>
              </div>
            </div>
            <p className="mt-6 pl-2 md:pl-4 text-slate-400 text-sm text-center md:text-left">
              ※ 병원 진료비, 약제비, 이동 택시비 등의 실비는 서비스 요금과 별개입니다.
            </p>
          </div>
        </motion.div>

        {/* 4. 서비스 진행 절차 */}
        <motion.div variants={FADE_UP} className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-4">한눈에 보는 서비스 진행 절차</h2>
            <p className="text-slate-400 text-lg">신청부터 귀가 후 리포트까지, 매니저가 함께합니다.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6 relative">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const showRightArrow = (idx + 1) % 4 !== 0; 
              
              return (
                <div key={idx} className="relative group">
                  <div className={`bg-slate-700 rounded-3xl p-6 shadow-lg border-t-4 border-l border-r border-b border-slate-600 ${step.border} hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 h-full`}>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-4xl font-black text-slate-600 group-hover:text-slate-500 transition-colors">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className={`p-3 rounded-2xl ${step.bg}`}>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                  {/* 연결 화살표 */}
                  {showRightArrow && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 translate-x-[50%] -translate-y-1/2 z-20 justify-center items-center pointer-events-none">
                      <ArrowRight className="w-6 h-6 text-slate-600" strokeWidth={3} />
                    </div>
                  )}
                  {idx < STEPS.length - 1 && (
                    <div className="flex lg:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 translate-y-[50%] z-20 justify-center items-center pointer-events-none">
                      <ArrowRight className="w-6 h-6 text-slate-600 rotate-90" strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 서비스 핵심 가이드 및 이용 조건 */}
        <motion.div variants={FADE_UP} className="mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 좌측: 서비스 이용 규정 (리스트 형태 개선) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-[2rem] p-8 md:p-10 shadow-xl flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">서비스 이용 규정</h3>
              </div>
              
              <div className="flex-1 space-y-8">
                {/* 이용 가능 조건 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <h4 className="font-bold text-slate-200">이용 가능 조건</h4>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                      <Check className="w-5 h-5 text-blue-400 shrink-0" />
                      <span>청년, 중장년, 어르신 등 혼자 병원 가기 힘든 분 누구나</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                      <Check className="w-5 h-5 text-blue-400 shrink-0" />
                      <span>대중교통 이용 가능 또는 스스로 휠체어 착석 가능자</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                      <Check className="w-5 h-5 text-blue-400 shrink-0" />
                      <span>대문 앞(공동현관) 서비스 시작 원칙 (자택 내부 진입 불가)</span>
                    </li>
                  </ul>
                </div>

                {/* 이용 불가 사유 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                    <h4 className="font-bold text-slate-200">이용 불가 사유</h4>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-slate-400 leading-relaxed">
                      <X className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>휠체어 스스로 착석 불가 및 화장실 단독 이용 불가 시</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-400 leading-relaxed">
                      <X className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="text-rose-300 font-medium">치료, 처치 및 주사 등 의료적 행위 대행 요구 불가</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-400 leading-relaxed">
                      <X className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>폭언, 위협 등 매니저 및 의료진에게 위해가 되는 경우</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 우측: 운영 및 예약 정책 (Key-Value 정렬로 스캐닝 강화) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-[2rem] p-8 md:p-10 shadow-xl flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-amber-500/10 rounded-xl">
                  <CalendarRange className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">운영 및 예약 정책</h3>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center py-4 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm font-medium">운영 시간</span>
                  <div className="text-right">
                    <p className="text-slate-200 text-sm font-bold">평일 08:30 ~ 22:00</p>
                    <p className="text-slate-400 text-xs mt-1">주말 09:30 ~ 18:00 (사전예약 필수)</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-4 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm font-medium">신청 시점</span>
                  <div className="text-right">
                    <p className="text-slate-200 text-sm font-bold">사전예약 : 최대 1주일 전</p>
                    <p className="text-slate-400 text-xs mt-1">당일신청 : 원칙 상 당일 신청은 현재 불가능합니다.</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm font-medium">이용 한도</span>
                  <span className="text-slate-200 text-sm font-bold">월 10회 / 연간 200시간</span>
                </div>

                <div className="flex justify-between items-center py-4">
                  <span className="text-slate-400 text-sm font-medium">당일 취소 (5시간 내)</span>
                  <span className="text-rose-400 text-sm font-bold">위약금 13,000원</span>
                </div>
              </div>

              {/* 하단 패널티 안내 박스 */}
              <div className="mt-6 p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                <h4 className="text-rose-400 text-sm font-bold flex items-center gap-2 mb-2">
                  <Ban className="w-4 h-4" /> 패널티 규정 안내
                </h4>
                <p className="text-rose-200/70 text-xs leading-relaxed break-keep">
                  노쇼 2회, 노쇼 1회 + 당일취소 2회, 또는 당일취소 3회 누적 시 <strong className="text-rose-300 font-bold">1개월간 서비스 이용이 제한</strong>됩니다.
                </p>
              </div>
            </div>

          </div>
        </motion.div>

        {/* 5. (FAQ) 페이지 유도 배너 */}
        <motion.div variants={FADE_UP} className="mb-20 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-slate-800 to-slate-800/80 border border-slate-700 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="text-center md:text-left relative z-10">
              <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">더 궁금한 점이 있으신가요?</h2>
              <p className="text-slate-400 text-sm md:text-base break-keep">
                결제 및 환불 규정, 대리 신청 방법 등 자주 묻는 질문을 확인해 보세요.
              </p>
            </div>
            <div className="relative z-10">
              <Link href="/support/faq">
                <button className="w-full sm:w-auto px-8 py-3.5 bg-slate-700 hover:bg-slate-600 text-white text-base font-bold rounded-2xl transition-all active:scale-95 whitespace-nowrap border border-slate-600 shadow-md">
                  FAQ 바로가기
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 6. 하단 CTA */}
        <motion.div variants={FADE_UP} className="text-center pb-10">
          <Link href="/apply">
            <button className="relative overflow-hidden w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 rounded-full bg-blue-600 text-white text-lg font-bold shadow-lg hover:bg-blue-500 transition-all active:scale-95">
              지금 바로 동행 신청하기
            </button>
          </Link>
          <p className="mt-4 text-sm text-slate-400">간단한 정보 입력 후 매니저가 배정됩니다.</p>
        </motion.div>
      </motion.main>
    </div>
  );
}