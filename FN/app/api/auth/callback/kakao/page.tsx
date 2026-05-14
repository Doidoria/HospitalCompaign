'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/src/api/auth';

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      authApi.loginWithKakao(code)
        .then((data) => {
          // 성공 시 토큰 저장 및 이동
          localStorage.setItem('accessToken', data.accessToken);
          router.push('/mypage');
        })
        .catch((err) => {
          console.error(err);
          router.push('/login');
        });
    }
  }, [code, router]);

  return <div>로그인 처리 중...</div>;
}