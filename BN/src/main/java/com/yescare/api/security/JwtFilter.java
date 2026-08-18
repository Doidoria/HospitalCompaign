package com.yescare.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    // com.yescare.api.security.JwtFilter.java 내부

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        log.info("🚀 [JWT Filter] API 요청: {} {}", request.getMethod(), request.getRequestURI());

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorization = request.getHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);

            if (jwtProvider.validateToken(token)) {
                String email = jwtProvider.getEmail(token);
                String role = jwtProvider.getRole(token);
                request.setAttribute("userEmail", email);

                log.info("✅ [JWT Filter] 토큰 정상 승인 - 사용자: {}, 원본 Role: {}", email, role);

                String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                log.info("🎯 [JWT Filter] 스프링 시큐리티에 등록될 최종 권한: {}", authority);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, List.of(new SimpleGrantedAuthority(authority)));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                log.error("❌ [JWT Filter] 토큰 검증 실패 (만료 또는 위조)");
            }
        } else {
            log.warn("⚠️ [JWT Filter] 헤더에 토큰이 없거나 형식이 잘못되었습니다. Authorization: {}", authorization);
        }

        filterChain.doFilter(request, response);
    }
}