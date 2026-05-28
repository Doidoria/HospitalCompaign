// app/api/auth/callback/kakao/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/src/api/index'; 

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  // 🚨 Strict Mode 더블 렌더링 방지용 Ref
  const isCalledRef = useRef(false);

  useEffect(() => {
    if (code && !isCalledRef.current) {
      isCalledRef.current = true; // 스위치를 켜서 두 번째 실행 방지

      authApi.loginWithKakao(code)
        .then((res: any) => {
          const token = res.data.accessToken || res.data.token || res.data;
          
          if (token && typeof token === 'string') {
            // 1. 클라이언트 사이드 보관 (기존 로직)
            localStorage.setItem('accessToken', token);

            // 2. Next.js 미들웨어(서버)가 읽을 수 있도록 쿠키에도 저장!
            document.cookie = `accessToken=${token}; path=/; max-age=86400; Secure; SameSite=Strict`;

            console.log("카카오 로그인 성공! 토큰 저장 완료");
            router.push('/mypage');
          } else {
            throw new Error("유효한 토큰을 발급받지 못했습니다.");
          }
        })
        .catch((err) => {
          console.error("카카오 로그인 에러:", err);
          alert("카카오 로그인 중 오류가 발생했습니다.");
          router.push('/login');
        });
    }
  }, [code, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
       <div className="text-lg font-semibold text-gray-600 animate-pulse">
         카카오 로그인 처리 중...
       </div>
    </div>
  );
}