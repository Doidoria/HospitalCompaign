package com.yescare.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 리눅스(EC2) 환경에서도 절대 길을 잃지 않도록 절대 경로로 변환하여 매핑합니다.
        Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든 API 엔드포인트에 대해 적용
                .allowedOrigins(
                        // 1. 로컬 개발 환경
                        "http://localhost:3000",
                        // 2. 실서버 프론트엔드 도메인 (추후 Vercel에 이 도메인을 연결)
                        "https://www.wellcommunity-yescare.co.kr",
                        "https://wellcommunity-yescare.co.kr",
                        // 3. Vercel 임시 도메인 (Vercel 배포 로그에 찍힌 정확한 주소 확인 요망)
                        "https://hospital-compaign.vercel.app",
                        // 4. 향후 Capacitor 앱 전환 시 사용할 모바일 웹뷰 출처 (미리 열어둠)
                        "http://localhost",
                        "capacitor://localhost",
                        "ionic://localhost"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*") // 모든 헤더 허용
                .allowCredentials(true) // HttpOnly 쿠키, JWT 인증 헤더 포함 허용 (매우 중요)
                .maxAge(3600); // 1시간 동안 브라우저에서 Preflight(OPTIONS) 요청 캐싱하여 성능 최적화
    }
}