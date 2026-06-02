import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import ClientProvider from "@/src/components/providers/ClientProvider";
import GlobalAlert from '@/src/components/admin/ui/GlobalAlert';

// 1. 기존 영문 폰트
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. 한글 폰트 추가 (디자인 통일성을 위함)
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"], // Noto Sans KR은 기본적으로 한글을 지원합니다.
  weight: ["400", "500", "700", "900"],
});

// 3. 모바일 & Capacitor 환경을 위한 Viewport 분리 (Next.js 14+ 기준 필수)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 앱처럼 보이게 하려면 핀치 줌 방지
  viewportFit: "cover", // iOS 노치 영역(Safe Area) 대응
  themeColor: "#ffffff", // 모바일 브라우저/안드로이드 상단 상태바 색상 지정
};

// 4. SEO 및 카카오톡 공유하기(Open Graph)를 위한 메타데이터 고도화
export const metadata: Metadata = {
  title: "예스케어 (Ye's Care) - 믿을 수 있는 병원 동행 서비스",
  description: "가족 같은 마음으로 함께합니다. 안전하고 편안한 병원 동행 서비스 예스케어.",
  keywords: ["병원동행", "병원동행서비스", "예스케어", "요양보호사", "진료동행"],
  openGraph: {
    title: "예스케어 - 병원 동행 서비스",
    description: "가족 같은 마음으로 함께합니다. 안전하고 편안한 병원 동행 서비스",
    url: "https://yescare.co.kr", // 실제 배포될 도메인으로 변경하세요
    siteName: "예스케어(Ye's Care)",
    images: [
      {
        url: "/images/og-image.jpg", // public/images 폴더에 1200x630 사이즈 썸네일 이미지 추가 권장
        width: 1200,
        height: 630,
        alt: "예스케어 서비스 썸네일",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // layout.tsx 자체는 'use client'가 없으므로 완벽한 서버 컴포넌트로 동작합니다.
    <html lang="ko" translate="no" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-gray-900 overflow-x-hidden" suppressHydrationWarning={true}>
        <ClientProvider>
          <Header />
          <main className="flex-grow">
            {children}
            <GlobalAlert />
          </main>
          <Footer />
        </ClientProvider>
      </body>
    </html>
  );
}