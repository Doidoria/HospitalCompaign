// src/components/admin/ui/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, CalendarDays, UserPlus, 
  UserCog, Star, Megaphone, MessageCircleQuestion 
} from 'lucide-react';

type AdminTab = 'dashboard' | 'managers' | 'members' | 'reviews' | 'inquiries' | 'notices';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingManagerCount: number; // 매니저 승인 대기 건수 뱃지용
}

export default function Sidebar({ activeTab, setActiveTab, pendingManagerCount }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: CalendarDays, label: '예약 관리' },
    { id: 'managers', icon: UserPlus, label: '매니저 승인 관리', badge: pendingManagerCount },
    { id: 'members', icon: UserCog, label: '전체 회원 관리' },
    { id: 'reviews', icon: Star, label: '리뷰 모니터링' },
    { id: 'notices', icon: Megaphone, label: '공지사항 관리' },
    { id: 'inquiries', icon: MessageCircleQuestion, label: '고객센터 관리' }
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col shadow-2xl z-20 sticky top-0 md:h-screen">
      {/* 로고 영역 */}
      <div className="px-6 py-8 border-b border-slate-800/80 flex flex-col gap-1">
        <Link href="/" className="text-2xl font-black text-white tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          Ye'sCare
        </Link>
        <p className="text-slate-400 text-[11px] font-medium tracking-wide pl-10">통합 관리 시스템</p>
      </div>
      
      {/* 메뉴 리스트 */}
      <nav className="flex flex-row md:flex-col gap-1.5 p-4 overflow-x-auto no-scrollbar md:flex-1 md:overflow-y-auto">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as AdminTab)} 
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all whitespace-nowrap outline-none
              ${activeTab === item.id 
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'}`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-200' : ''}`} /> 
              {item.label}
            </div>
            {/* 승인 대기 알림 뱃지 */}
            {item.badge ? (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? 'bg-white text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
    </aside>
  );
}