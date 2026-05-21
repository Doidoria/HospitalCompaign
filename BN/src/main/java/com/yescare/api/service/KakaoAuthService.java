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

        // 방어 로직 1: 이메일 처리
        // kakaoAccount 자체가 null일 수 있는 극단적인 엣지 케이스까지 방어합니다.
        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        if (email == null || email.isBlank()) {
            // (Long)으로 강제 변환 시 에러가 날 수 있으므로 Object로 안전하게 꺼내서 String으로 만듭니다.
            Object idObj = userInfo.get("id");
            String uniqueId = idObj != null ? String.valueOf(idObj) : UUID.randomUUID().toString().substring(0, 8);
            email = "kakao_" + uniqueId + "@yescare.com";
        }

        // 방어 로직 2: 닉네임(이름) 처리
        Map<String, Object> profile = kakaoAccount != null ? (Map<String, Object>) kakaoAccount.get("profile") : null;
        String name = profile != null && profile.get("nickname") != null ? (String) profile.get("nickname") : "카카오유저";

        // DB 조회를 위해 변수를 final 성격으로 고정
        final String finalEmail = email;

        // 3. 기존 회원인지 이메일로 검증 후, 없으면 신규 가입
        Member member = memberRepository.findByEmail(finalEmail)
                .orElseGet(() -> {
                    Member newMember = Member.builder()
                            .email(finalEmail)
                            .password(UUID.randomUUID().toString()) // 임시 비밀번호 부여
                            .name(name)
                            .phoneNumber("010-0000-0000") // 카카오에서 번호를 못 받을 경우 임시 부여
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