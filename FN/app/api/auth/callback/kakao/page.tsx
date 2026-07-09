// app/api/auth/callback/kakao/page.tsx
'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/src/api/index'; 
import { YesAlert } from '@/src/utils/alert'; // 기존에 선언된 alert 공통 모듈 호출

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  const isCalledRef = useRef(false);

  // 공통 토큰 저장 및 로그인 완료 처리 함수
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('accessToken', token);
    document.cookie = `accessToken=${token}; path=/; max-age=86400; Secure; SameSite=Strict`;
    console.log("✅ 카카오 로그인/연동 통합 성공! 토큰 저장 완료");
    router.push('/mypage');
  };

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
            handleLoginSuccess(token);
          } else {
            console.error("❌ 토큰 추출 실패. payload 구조:", payload);
            throw new Error("유효한 토큰을 발급받지 못했습니다.");
          }
        })
        .catch(async (err) => {
          console.error("카카오 로그인 에러 제어:", err);
          
          const errorResponse = err.response?.data;
          const status = err.response?.status;
          
          // 백엔드 응답에 code 필드가 없으므로, HTTP 상태코드 409 또는 tempToken 유무로 판단
          if (status === 409 || errorResponse?.tempToken) {
            
            // 실제 백엔드 JSON 키값과 완벽히 매칭
            const tempToken = errorResponse?.tempToken;
            const existingEmail = errorResponse?.email;

            if (!tempToken) {
              YesAlert.fire({ icon: 'error', title: '인증 오류', text: '연동 토큰이 누락되었습니다.' }).then(() => {
                router.push('/login');
              });
              return;
            }

            // 사용자에게 정중히 연동 여부를 묻는 팝업 오픈
            YesAlert.fire({
              icon: 'warning',
              title: '기존 가입 계정 발견',
              html: `입력하신 휴대폰 번호로 이미 가입된 일반 계정이 존재합니다.<br/>
                     카카오 로그인 정보(<b>${existingEmail || '카카오 계정'}</b>)를 우선하여 
                     하나의 계정으로 <strong>통합 연동</strong>하시겠습니까?<br/><br/>
                     <span style="color:#ef4444; font-size:13px; font-weight: 500;">
                       ※ 기존의 병원 동행 예약 내역 및 이용 기록은 안전하게 유지됩니다.
                     </span>`,
              showCancelButton: true,
              confirmButtonText: '네, 연동하고 로그인하기',
              cancelButtonText: '아니요, 취소',
              confirmButtonColor: '#FEE500', 
              cancelButtonColor: '#94A3B8'
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  // 사용자가 동의 시 최종 연동 승인 API 가동 (확인된 tempToken 사용)
                  const linkRes: any = await authApi.confirmKakaoLink(tempToken);
                  const activePayload = linkRes.data ? linkRes.data : linkRes;
                  const finalToken = activePayload?.token || activePayload?.accessToken;
                  
                  if (finalToken) {
                    handleLoginSuccess(finalToken);
                  } else {
                    throw new Error("연동 토큰 누락");
                  }
                } catch (linkErr) {
                  console.error("계정 연동 실패:", linkErr);
                  YesAlert.fire({ icon: 'error', title: '연동 처리 실패', text: '서버 오류로 연동에 실패했습니다. 다시 시도해 주세요.' })
                    .then(() => router.push('/login'));
                }
              } else {
                // '아니요' 선택 시 안전하게 로그인 화면으로 이탈
                router.push('/login');
              }
            });
          } else {
            // 연동 예외가 아닌 일반 네트워크/서버 에러 상황
            YesAlert.fire({ 
              icon: 'error', 
              title: '로그인 실패', 
              text: errorResponse?.message || '카카오 로그인 중 오류가 발생했습니다.' 
            }).then(() => {
              // 🚨 YesAlert가 비동기로 닫힌 '후'에 리다이렉트가 일어나도록 안전장치
              router.push('/login');
            });
          }
        });
    }
  }, [code, router]);

  return (
    <div className="text-lg font-semibold text-gray-600 animate-pulse">
      카카오 로그인 처리 중...
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="text-gray-500 animate-pulse">로딩 중...</div>}>
        <KakaoCallbackContent />
      </Suspense>
    </div>
  );
}