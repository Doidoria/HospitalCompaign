// src/components/Footer.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Phone, Clock, CreditCard, Headset, Copy } from 'lucide-react';
import { Toast } from '@/src/utils/alert';
import Link from 'next/link';

export default function Footer() {
  const pathname = usePathname();

  // 관리자 페이지에서는 푸터 숨김
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleCopyAccount = async () => {
    const accountText = "05398227780904"; // 하이픈 제외 숫자만 넣고 싶다면 "0000000000000"
    try {
      await navigator.clipboard.writeText(accountText);
      Toast.fire({ 
        icon: 'success', 
        title: '계좌번호 복사 완료', 
      });
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 mt-auto text-[13px] sm:text-sm border-t border-slate-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6">
        
        {/* 1. 로고 및 약관 링크 (좌측) */}
        <div className="md:col-span-3 space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">예스케어</h2>
            <p className="text-slate-400 mt-1">안전한 병원 동행 서비스</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 font-medium">
            <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
            <Link href="/privacy" className="text-slate-100 hover:text-white transition-colors font-bold">개인정보처리방침</Link>
            <Link href="/support/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>

        {/* 2. 고객센터 및 카카오톡 상담 (중앙) */}
        <div className="md:col-span-5 space-y-4">
          <h3 className="text-white font-bold text-base border-b border-slate-700 pb-2 inline-block w-full sm:w-auto">
            고객센터
          </h3>
          
          <div className="space-y-2.5 text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-base text-slate-200">053-982-2778</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p>평일 09:30 ~ 17:30</p>
                <p className="text-slate-500 text-xs mt-0.5">점심시간 12:00~13:00 (주말 및 공휴일 휴무)</p>
              </div>
            </div>
          </div>

          {/* 카카오톡 / 채널톡 상담 버튼 */}
          <a href="http://pf.kakao.com/_yxcrbX" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-fit mt-2 px-5 py-2.5 bg-[#347dec] hover:bg-[#97c3ff] text-black font-bold rounded-xl transition-colors active:scale-95 shadow-sm">
            <Headset className="w-5 h-5" />
            채널 톡
          </a>
        </div>

        {/* 3. 계좌정보 및 사업자 정보 (우측) */}
        <div className="md:col-span-4 space-y-5">
          {/* 무통장 입금 계좌 카드 UI */}
          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-slate-200">무통장 입금 계좌</span>
            </div>
            <button onClick={handleCopyAccount}
              className="group flex items-center gap-2 text-lg font-bold text-white tracking-wide hover:text-blue-400 transition-colors active:scale-95 outline-none"
              title="계좌번호 복사하기"
            >
              하나은행 053-982277-80904
              <Copy className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </button>
            <p className="text-slate-400 mt-1">예금주 : 주식회사 웰커뮤니티</p>
            <p className="text-[11px] text-red-400 mt-2 bg-red-950/30 inline-block px-2 py-1 rounded-md">
              * 입금 시 반드시 신청자명으로 기재해 주세요.
            </p>
          </div>

          {/* 사업자 정보 */}
          <div className="text-xs text-slate-500 space-y-1.5 leading-relaxed">
            <p>이메일 : wellcommunity982@gmail.com</p>
            <p>대구광역시 동구 해동로123 1층</p>
            <p>사업자등록번호 : 265-87-00326</p>
            <p className="pt-2">© 2026 Ye'sCare. All rights reserved.</p>
          </div>
        </div>
        
      </div>
    </footer>
  );
}