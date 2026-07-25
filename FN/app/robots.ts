// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',       // 관리자 페이지 차단
        '/manager/',     // 매니저 전용 대시보드 및 프로필 차단
        '/mypage/',      // 개인 마이페이지 차단
        '/reservation/', // 예약 상세 및 수정 차단
        '/report/',      // 동행 리포트 차단
        '/pay/',         // 결제 관련 페이지 차단
        '/api/',         // 카카오 콜백 등 API 내부 라우트 차단
      ],
    },
    sitemap: 'https://wellcommunity-yescare.co.kr/sitemap.xml',
  };
}