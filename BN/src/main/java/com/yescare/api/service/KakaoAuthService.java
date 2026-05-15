package com.yescare.api.service;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Role;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoAuthService {

    private final MemberRepository memberRepository;
    private final JwtProvider jwtProvider; // 기존에 만드신 JWT 프로바이더 사용
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.kakao.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String redirectUri;

    @Transactional
    public String loginWithKakao(String code) {
        // 1. 카카오 서버로 액세스 토큰 요청
        String kakaoAccessToken = getKakaoAccessToken(code);

        // 2. 카카오 유저 정보 가져오기
        Map<String, Object> userInfo = getKakaoUserInfo(kakaoAccessToken);
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");

        // 방어 1: 카카오 고유 ID 추출 (이메일이 없을 때 사용할 식별자)
        Object idObj = userInfo.get("id");
        String kakaoId = idObj != null ? String.valueOf(idObj) : UUID.randomUUID().toString().substring(0, 8);

        // 방어 2: 이메일 안전하게 추출 및 임시 이메일 생성
        String email = null;
        if (kakaoAccount != null) {
            email = (String) kakaoAccount.get("email");
        }
        // 카카오에서 이메일을 안 줬다면, 고유 ID로 임시 이메일을 강제 생성 (예: kakao_123456789@yescare.dummy)
        if (email == null || email.isBlank()) {
            email = "kakao_" + kakaoId + "@yescare.dummy";
        }

        // 방어 3: 닉네임 안전하게 추출
        String nickname = "카카오유저_" + kakaoId;
        if (kakaoAccount != null && kakaoAccount.get("profile") != null) {
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            if (profile.get("nickname") != null) {
                nickname = (String) profile.get("nickname");
            }
        }

        // DB 조회를 위해 변수를 final 성격으로 고정
        final String finalEmail = email;
        final String finalNickname = nickname;

        // 3. 기존 회원인지 이메일로 검증 후, 없으면 신규 가입
        Member member = memberRepository.findByEmail(finalEmail).orElseGet(() -> {
            log.info("새로운 카카오 유저 가입 진행: {}", finalEmail);

            Member newMember = Member.builder()
                    .email(finalEmail) // 절대 null이 들어갈 수 없음
                    .password(UUID.randomUUID().toString())
                    .name(finalNickname)
                    .phoneNumber("010-0000-0000") // 필수값이므로 임시 부여
                    .role(Role.USER)
                    .provider("KAKAO")
                    .build();
            return memberRepository.save(newMember);
        });

        // 4. 예스케어 전용 JWT 발급
        return jwtProvider.createToken(member.getId(), member.getEmail(), member.getRole().name());
    }

    private String getKakaoAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity("https://kauth.kakao.com/oauth/token", request, Map.class);

        return (String) response.getBody().get("access_token");
    }

    private Map<String, Object> getKakaoUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<?> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange("https://kapi.kakao.com/v2/user/me", HttpMethod.GET, request, Map.class);

        return response.getBody();
    }
}