// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // 로그인하지 않은 유저가 접근할 수 없는 완전 보호 경로
  // /manager/dashboard, /manager/profile 등 하위 페이지 보호를 위해 startsWith 검증
  const isProtectedPath = 
    pathname.startsWith('/mypage') || 
    pathname.startsWith('/manager/dashboard') || 
    pathname.startsWith('/manager/profile') || 
    pathname.startsWith('/admin');

  // 매니저 신청 메인 페이지(/manager) 자체는 로그인 여부를 페이지 내부(Client Side)에서 
  // 로컬스토리지를 기반으로 유연하게 체크하도록 미들웨어 보호 대상에서 제외하거나 분리 관리합니다.
  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 미들웨어가 돌 구체적 매칭 경로 리스트
  matcher: [
    '/mypage/:path*', 
    '/manager/dashboard/:path*', 
    '/manager/profile/:path*', 
    '/admin/:path*'
  ],
};