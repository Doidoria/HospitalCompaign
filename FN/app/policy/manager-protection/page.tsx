// app/policy/manager-protection/page.tsx
'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ShieldAlert, HeartHandshake, Ban, Stethoscope, ShoppingBag, MessageSquareX, ArrowLeft, Info, Umbrella, PhoneOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ManagerProtectionPolicy() {
  const router = useRouter();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const policies = [
    {
      icon: <Stethoscope className="w-7 h-7 text-rose-500" />,
      title: "의료 행위 및 처방구입 요구 불가",
      desc: "매니저는 전문 의료인이 아닙니다. 주사 투여, 약물 처방 결정, 드레싱 등 의료법상 의료인만 할 수 있는 전문적인 행위는 절대 대행할 수 없습니다.",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-100",
      iconBg: "bg-rose-100/50"
    },
    {
      icon: <Ban className="w-7 h-7 text-orange-500" />,
      title: "무리한 신체적 부축 및 간병 불가",
      desc: "환자분의 체중을 온전히 지탱해야 하는 무리한 부축, 휠체어에서 침대로의 무리한 이동 등 매니저와 환자 모두에게 낙상 위험이 있는 행동은 제한됩니다.",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
      iconBg: "bg-orange-100/50"
    },
    {
      icon: <ShoppingBag className="w-7 h-7 text-blue-500" />,
      title: "병원 동행 외 사적 심부름 불가",
      desc: "장보기, 집안일, 관공서 업무 대행, 병원 진료와 무관한 사적인 심부름 등 본래의 동행 목적을 벗어난 업무는 정중히 거절될 수 있습니다.",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      iconBg: "bg-blue-100/50"
    },
    {
      icon: <MessageSquareX className="w-7 h-7 text-purple-500" />,
      title: "폭언, 욕설 및 성희롱 절대 금지",
      desc: "매니저를 향한 반말, 욕설, 인격 모독, 성희롱적 발언 및 무리한 신체 접촉은 관련 법령에 따라 조치되며, 즉시 서비스가 강제 종료됩니다.",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      iconBg: "bg-purple-100/50"
    },
    {
      icon: <Umbrella className="w-7 h-7 text-teal-500" />,
      title: "동행 중 돌발 사고 발생 시 보상 및 대처",
      desc: "예스케어의 모든 매니저는 전문 배상책임보험에 가입되어 있습니다. 동행 중 낙상 등 예상치 못한 사고 발생 시, 지자체(서울시 등) 안전 가이드라인에 준하는 즉각적인 응급조치 및 보험사를 통한 투명한 보상 절차가 진행됩니다.",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-100",
      iconBg: "bg-teal-100/50"
    },
    {
      icon: <PhoneOff className="w-7 h-7 text-indigo-500" />,
      title: "개인 연락처 요구 및 사적 거래 금지",
      desc: "매니저의 개인 연락처를 요구하거나, 플랫폼을 거치지 않은 직접 결제 및 사적인 우회 예약은 엄격히 금지됩니다. 이는 매니저의 사생활을 보호하고 안전한 서비스 품질 보증을 위해 반드시 지켜주셔야 합니다.",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      iconBg: "bg-indigo-100/50"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-24 selection:bg-emerald-100 selection:text-emerald-900">
      {/* 상단 헤더 영역 */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-14 pb-24 px-6 relative overflow-hidden shadow-md">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-20 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-emerald-400 drop-shadow-md" />
              <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-extrabold rounded-full border border-emerald-500/30 tracking-wide">
                안전 이용 규정
              </span>
            </div>
            {/* 공식 문서 느낌을 주는 시행일 표시 */}
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium bg-slate-800/50 w-fit px-3 py-1 rounded-md border border-slate-700/50">
              <Info className="w-3.5 h-3.5" /> 시행일: 2024. 06. 01
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight mb-4 text-white">
            예스케어 매니저 보호 및 <br className="hidden sm:block" /> 안전한 서비스 이용 안내
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-medium break-keep">
            예스케어 매니저님들은 누군가의 소중한 가족이자, 따뜻한 마음으로 동행하는 전문 파트너입니다. 안전하고 올바른 동행 문화를 위해 아래 수칙을 반드시 지켜주세요.
          </p>
        </div>
      </div>

      {/* 규정 리스트 영역 (2단 Grid 레이아웃) */}
      <main className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {policies.map((policy, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className={`group p-6 sm:p-8 rounded-[28px] bg-white border ${policy.borderColor} shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden`}
            >
              {/* 호버 시 우측 상단에 살짝 나타나는 색상 포인트 */}
              <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 ${policy.bgColor}`}></div>

              <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center mb-5 border border-white/50 shadow-sm transition-transform duration-300 group-hover:scale-110 ${policy.iconBg}`}>
                {policy.icon}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-3 tracking-tight group-hover:text-slate-900 transition-colors">
                  {policy.title}
                </h3>
                <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed font-medium break-keep">
                  {policy.desc}
                </p>
              </div>
            </motion.div>
          ))}

          {/* 하단 강조 안내 (Grid를 모두 덮는 Full Width) */}
          <motion.div 
            variants={itemVariants} 
            className="md:col-span-2 mt-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 sm:p-8 rounded-[28px] border border-emerald-100/80 shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left relative overflow-hidden"
          >
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-1/4 translate-y-1/4">
              <ShieldAlert className="w-48 h-48" />
            </div>

            <div className="p-4 bg-white rounded-full shrink-0 shadow-[0_4px_20px_rgb(16,185,129,0.15)] z-10">
              <HeartHandshake className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="z-10 flex-1">
              <h4 className="text-lg font-extrabold text-emerald-900 mb-2">상호 존중하는 따뜻한 동행</h4>
              <p className="text-[14px] sm:text-[15px] text-emerald-800/80 leading-relaxed font-bold break-keep">
                위 규정을 지속적으로 위반하여 매니저의 안전과 업무 수행에 심각한 지장을 초래할 경우, 
                <span className="text-emerald-700 bg-emerald-100/50 px-1.5 py-0.5 rounded mx-1">예고 없이 예약이 취소</span>되거나 
                추후 서비스 이용이 영구적으로 제한될 수 있습니다.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}