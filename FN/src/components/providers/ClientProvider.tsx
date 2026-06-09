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
  
  const pathname = usePathname();
  const router = useRouter();

  // Hydration Error 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 라우트(경로) 변경 시 점검 상태 체크
  useEffect(() => {
    if (!mounted) return; // 마운트 전에는 실행하지 않음

    // 어드민 페이지나 이미 점검 안내 페이지라면 무한 루프 방지를 위해 패스
    if (pathname.startsWith('/admin') || pathname === '/maintenance') {
      setIsMaintenance(false);
      return;
    }

    const verifySystemStatus = async () => {
      try {
        const res = await systemApi.getCheckStatus();
        if (res.data.maintenance) {
          setIsMaintenance(true);
          router.replace('/maintenance'); // 점검 중이면 강제 이동
        } else {
          setIsMaintenance(false);
        }
      } catch (err) {
        setIsMaintenance(false);
      }
    };

    verifySystemStatus();
  }, [pathname, router, mounted]);

  if (!mounted) {
    return null; 
  }

  // 점검 중일 때는 원래 화면(children)이 렌더링되지 않도록 빈 화면 반환 (리다이렉트가 끝날 때까지 덮어둠)
  if (isMaintenance) {
    return <div className="min-h-screen bg-slate-50" />; 
  }

  return (
    <>{children}</>
  );
}