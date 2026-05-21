// src/components/providers/ClientProvider.tsx
'use client';

import React, { useEffect, useState } from 'react';

// 예시: 나중에 React Query나 전역 Auth Context를 쓴다면 여기서 Import 합니다.
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ClientProviderProps {
  children: React.ReactNode;
}

export default function ClientProvider({ children }: ClientProviderProps) {
  // 전역 상태 초기화 세팅을 여기서 진행합니다.
  const [mounted, setMounted] = useState(false);

  // Hydration Error 방지를 위한 마운트 처리 (선택사항)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // 완전히 브라우저에 마운트되기 전에는 렌더링을 보류하여 UI 깜빡임 방지
  }

  return (
    <>{children}</>
    /* 나중에 라이브러리를 추가하면 아래처럼 children을 감싸주면 됩니다.
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
    
          {children}
       </AuthProvider>
      </QueryClientProvider>
    */
  );
}