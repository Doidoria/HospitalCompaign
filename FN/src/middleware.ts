// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 쿠키에서 토큰 확인
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // 1. 로그인 안 한 사용자가 보호된 페이지(mypage, apply, manager, admin) 접근 시
  if (!token && (pathname.startsWith('/mypage') || pathname.startsWith('/apply') || pathname.startsWith('/manager') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // (선택) JWT를 디코딩해서 Role 기반으로 튕겨내는 로직도 여기에 추가할 수 있습니다.
  
  return NextResponse.next();
}

// 미들웨어가 작동할 경로 지정
export const config = {
  matcher: ['/mypage/:path*', '/apply/:path*', '/manager/:path*', '/admin/:path*'],
};