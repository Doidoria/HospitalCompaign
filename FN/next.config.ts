import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Capacitor 앱 빌드를 위한 정적 HTML 추출 (필수)
  // output: 'export',

  // 앱 내 이미지 엑스박스 방지를 위한 최적화 해제 (필수)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;