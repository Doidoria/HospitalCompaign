package com.yescare.api.config;

import com.yescare.api.security.JwtFilter;
import com.yescare.api.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// 🌟 새롭게 추가되는 import 문들 (자동 완성 단축키를 쓰셔도 됩니다)
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtProvider jwtProvider;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .httpBasic(basic -> basic.disable())
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/members/join", "/api/members/login",
                                "/api/members/check-email", "/api/members/sms/**", "/api/members/auth/kakao",
                                "/api/notices/", "/error", "/uploads/**", "/api/members/email/send",
                                "/api/members/email/verify", "/api/system/status").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notices/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/managers/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/popups/active").permitAll()
                        .requestMatchers("/api/managers/profile").authenticated()
                        .requestMatchers("/api/members/managers/count").permitAll()
                        .requestMatchers("/api/members/apply-manager").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new JwtFilter(jwtProvider), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // 상세한 CORS 허락증 발급 규칙 정의
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 프론트엔드(리액트) 주소 허용 (포트가 3000번일 경우)
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",                 // 로컬 웹
                "https://hospital-compaign.vercel.app",  // 배포된 웹
                "https://wellcommunity-yescare.co.kr",
                "https://www.wellcommunity-yescare.co.kr",
                "http://localhost",                      // Android 앱 내부 웹뷰
                "capacitor://localhost"                  // iOS 앱 내부 웹뷰
        ));
        // 허용할 HTTP 메서드 지정 (OPTIONS는 브라우저의 사전 검사를 위해 필수)
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // 모든 헤더 허용
        configuration.setAllowedHeaders(List.of("*"));
        // 프론트엔드가 응답 헤더에 담긴 값을 읽을 수 있도록 허용 (나중에 유용합니다)
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // 모든 API 주소에 이 규칙을 적용
        return source;
    }
}