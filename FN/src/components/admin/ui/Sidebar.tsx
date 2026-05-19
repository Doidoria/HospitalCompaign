'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, CalendarDays, UserPlus, UserCog, Star, Megaphone, 
  MessageCircleQuestion, ImageIcon, Home 
} from 'lucide-react';

type AdminTab = 'dashboard' | 'managers' | 'members' | 'reviews' | 'inquiries' | 'notices' | 'popups';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingManagerCount: number; 
}

export default function Sidebar({ activeTab, setActiveTab, pendingManagerCount }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: CalendarDays, label: '예약 관리' },
    { id: 'managers', icon: UserPlus, label: '승인 관리', badge: pendingManagerCount },
    { id: 'members', icon: UserCog, label: '회원 관리' },
    { id: 'reviews', icon: Star, label: '리뷰 관리' },
    { id: 'notices', icon: Megaphone, label: '공지사항' },
    { id: 'inquiries', icon: MessageCircleQuestion, label: '고객센터' },
    { id: 'popups', icon: ImageIcon, label: '팝업 관리' },
  ];

  return (
    <>
      {/* 1. 모바일 전용 상단 앱바 (PC에서는 숨김) */}
      <div className="md:hidden sticky top-0 z-[90] w-full bg-slate-900 flex items-center justify-between px-5 py-3 shadow-md">
        <Link href="/" className="text-lg font-black text-white tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-blue-600 p-1 rounded-lg text-white">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          Ye'sCare <span className="text-blue-400 text-[10px] font-bold ml-0.5 px-1.5 py-0.5 bg-blue-900/50 rounded-md">Admin</span>
        </Link>
        <Link href="/" className="p-2 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition-colors shadow-sm">
          <Home className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. 하단 탭바 / PC 사이드바 */}
      <aside className="fixed bottom-0 left-0 z-[100] w-full bg-slate-900 text-slate-300 md:sticky md:top-0 md:h-screen md:w-64 md:flex md:flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl">
        
        {/* 로고 영역 (PC에서만 노출) */}
        <div className="hidden md:flex flex-col gap-1 px-6 py-8 border-b border-slate-800/80">
          <Link href="/" className="text-2xl font-black text-white tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            Ye'sCare
          </Link>
          <p className="text-slate-400 text-[11px] font-medium tracking-wide pl-10">통합 관리 시스템</p>
        </div>
        
        {/* 메뉴 리스트 */}
        <nav className="flex flex-row md:flex-col gap-1 md:gap-1.5 p-2 md:p-4 overflow-x-auto no-scrollbar md:flex-1 md:overflow-y-auto pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)} 
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 md:px-4 py-2 md:py-3.5 rounded-xl transition-all whitespace-nowrap outline-none min-w-[72px] md:min-w-0 relative
                ${activeTab === item.id 
                  ? 'text-white md:bg-blue-600 md:font-bold md:shadow-md md:shadow-blue-900/20' 
                  : 'text-slate-500 md:text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'}`}
            >
              {/* 모바일 탭 활성화 시 상단 포인트 바 */}
              {activeTab === item.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-b-md md:hidden"></div>}
              
              <div className="relative flex items-center justify-center">
                <item.icon className={`w-5 h-5 md:w-5 md:h-5 ${activeTab === item.id ? 'text-blue-500 md:text-blue-200' : ''}`} /> 
                {item.badge ? (
                  <span className={`absolute -top-1.5 -right-2.5 md:static text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-bold 
                    ${activeTab === item.id ? 'bg-blue-500 text-white md:bg-white md:text-blue-600' : 'bg-red-500 text-white md:bg-blue-500/20 md:text-blue-400'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </div>
              
              <span className={`text-[10px] md:text-sm mt-0.5 md:mt-0 ${activeTab === item.id ? 'font-extrabold text-blue-500 md:text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}