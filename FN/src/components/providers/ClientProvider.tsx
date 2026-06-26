// src/components/providers/ClientProvider.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { systemApi } from '@/src/api/index';

interface ClientProviderProps {
  children: React.ReactNode;
}

export default function ClientProvider({ children }: ClientProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(true); // 라이언트 권한 상태 추가
  
  const pathname = usePathname();
  const router = useRouter();

  // 1. Hydration Error 방지 및 최초 점검 체크 (최초 1회만 수행하여 서버 부하 원천 차단)
  useEffect(() => {
    setMounted(true);

    if (pathname.startsWith('/admin') || pathname === '/maintenance') {
      setIsMaintenance(false);
      return;
    }

    const checkInitialSystemStatus = async () => {
      try {
        const res = await systemApi.getCheckStatus();
        if (res.data.maintenance) {
          setIsMaintenance(true);
          router.replace('/maintenance');
        } else {
          setIsMaintenance(false);
        }
      } catch (err) {
        setIsMaintenance(false);
      }
    };

    checkInitialSystemStatus();
  }, [router, pathname]);

  // 2. [Capacitor 전용 하이브리드 앱 대비 권한 가드]
  // 라우트 경로가 바뀔 때마다 미들웨어 없이도 클라이언트 자체적으로 페이지 진입을 차단합니다.
  useEffect(() => {
    if (!mounted) return;

    // 보호할 경로 목록 정의
    const protectedRoutes = ['/mypage', '/apply', '/manager', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
      const token = localStorage.getItem('accessToken');
      
      if (!token || token === 'undefined' || token === 'null') {
        setIsAuthorized(false); // 접근 비허가 상태로 차단
        router.replace('/login'); // 로그인으로 강제 튕김
      } else {
        setIsAuthorized(true); // 허가
      }
    } else {
      setIsAuthorized(true); // 공개 페이지는 무조건 허가
    }
  }, [pathname, mounted, router]);

  if (!mounted) {
    return null; 
  }

  // 시스템 점검 중일 때 원래 레이아웃 가림
  if (isMaintenance) {
    return <div className="min-h-screen bg-slate-50" />; 
  }

  // 클라이언트 권한 검증 진행 중일 때(튕기기 직전) 비정상적인 UI 노출(Flickering)을 막아줌
  if (!isAuthorized) {
    return <div className="min-h-screen bg-white" />; 
  }

  return (
    <>{children}</>
  );
}