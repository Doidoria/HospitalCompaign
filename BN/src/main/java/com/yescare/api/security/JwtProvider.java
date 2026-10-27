package com.yescare.api.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtProvider {

    private final Key key;
    private final long expirationTime;

    // 1. 설정 파일에서 비밀 도장과 유효 시간 가져오기
    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration_time}") long expirationTime) {

        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationTime = expirationTime;
    }

    // 2. 토큰 생성 기능 (로그인 시 사용)
    public String createToken(Long memberId, String email, String role) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .setSubject(email)
                .claim("memberId", memberId)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String getRole(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().get("role", String.class);
    }

    // 토큰이 유효한지(변조/만료 여부) 확인
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | io.jsonwebtoken.MalformedJwtException e) {
            log.info("❌ 잘못된 JWT 서명 또는 구조입니다: {}", e.getMessage());
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.info("❌ 만료된 JWT 토큰입니다: {}", e.getMessage());
        } catch (io.jsonwebtoken.UnsupportedJwtException e) {
            log.info("❌ 지원되지 않는 JWT 토큰입니다: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.info("❌ JWT 토큰이 비어있거나 잘못되었습니다: {}", e.getMessage());
        }
        return false;
    }

    // 토큰에서 회원 이메일 정보 꺼내기
    public String getEmail(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }
}