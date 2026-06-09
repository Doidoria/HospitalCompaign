// app/api/auth/callback/kakao/page.tsx
'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/src/api/index'; 

// 실제 로직이 담긴 내부 컴포넌트
function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  const isCalledRef = useRef(false);

  useEffect(() => {
    if (code && !isCalledRef.current) {
      isCalledRef.current = true; 

      authApi.loginWithKakao(code)
        .then((res: any) => {
          console.log("🚨 [디버깅] 카카오 응답 원본:", res);

          const payload = res.data ? res.data : res;
          
          const token = 
            payload?.accessToken || 
            payload?.token || 
            payload?.data?.accessToken || 
            payload?.data?.token || 
            (typeof payload === 'string' ? payload : null);
          
          if (token && typeof token === 'string') {
            // 토큰 저장 (웹 + 라우팅 가드 완벽 대응)
            localStorage.setItem('accessToken', token);
            document.cookie = `accessToken=${token}; path=/; max-age=86400; Secure; SameSite=Strict`;

            console.log("✅ 카카오 로그인 성공! 토큰 저장 완료");
            router.push('/mypage');
          } else {
            // 실패 시 콘솔에 payload 구조를 찍어서 구조를 파악할 수 있게 함
            console.error("❌ 토큰 추출 실패. payload 구조:", payload);
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
    <div className="text-lg font-semibold text-gray-600 animate-pulse">
      카카오 로그인 처리 중...
    </div>
  );
}

// 최상위 Export 컴포넌트: Suspense로 감싸기
export default function KakaoCallbackPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="text-gray-500 animate-pulse">로딩 중...</div>}>
        <KakaoCallbackContent />
      </Suspense>
    </div>
  );
}