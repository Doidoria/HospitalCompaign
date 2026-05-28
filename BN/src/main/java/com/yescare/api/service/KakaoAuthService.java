package com.yescare.api.service;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Role;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoAuthService {

    private final MemberRepository memberRepository;
    private final JwtProvider jwtProvider;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.kakao.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String redirectUri;

    @Transactional
    public String loginWithKakao(String code) {
        String kakaoAccessToken = getKakaoAccessToken(code);
        Map<String, Object> userInfo = getKakaoUserInfo(kakaoAccessToken);
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
        String email = (String) kakaoAccount.get("email");

        // 카카오 이메일 인증 여부 확인
        boolean isEmailVerified = kakaoAccount.containsKey("is_email_verified") && (boolean) kakaoAccount.get("is_email_verified");
        if (!isEmailVerified) {
            throw new IllegalStateException("카카오 계정의 이메일이 인증되지 않아 로그인할 수 없습니다. 카카오톡에서 이메일 인증을 완료해주세요.");
        }

        String name = (String) kakaoAccount.get("name");
        String rawPhoneNumber = (String) kakaoAccount.get("phone_number");
        String formattedPhone = normalizePhoneNumber(rawPhoneNumber);

        String gender = (String) kakaoAccount.get("gender");
        String birthyear = (String) kakaoAccount.get("birthyear");
        String birthday = (String) kakaoAccount.get("birthday");
        String birthDate = (birthyear != null && birthday != null) ? birthyear + birthday : null;

        Map<String, Object> shippingInfo = getKakaoShippingAddress(kakaoAccessToken);

        String zipCode = null;
        String address = null;
        String detailAddress = null;

        // 카카오는 shipping_address(단수)가 아니라 shipping_addresses(복수 배열)로 내려줍니다.
        if (shippingInfo.containsKey("shipping_addresses")) {
            Object shippingObj = shippingInfo.get("shipping_addresses");
            if (shippingObj instanceof List) {
                List<Map<String, Object>> addresses = (List<Map<String, Object>>) shippingObj;
                if (!addresses.isEmpty()) {
                    // 우선 첫 번째 주소를 기본값으로 세팅
                    Map<String, Object> baseAddressInfo = addresses.get(0);

                    // 사용자가 설정한 '기본 배송지'가 있다면 그걸로 덮어씌움
                    for (Map<String, Object> addr : addresses) {
                        if (Boolean.TRUE.equals(addr.get("is_default"))) {
                            baseAddressInfo = addr;
                            break;
                        }
                    }

                    zipCode = (String) baseAddressInfo.get("zone_number"); // 우편번호
                    address = (String) baseAddressInfo.get("base_address"); // 기본주소
                    detailAddress = (String) baseAddressInfo.get("detail_address"); // 상세주소
                }
            }
        }

        String finalZipCode = zipCode;
        String finalAddress = address;
        String finalDetailAddress = detailAddress;

        Member member;
        Optional<Member> existingMemberOpt = memberRepository.findByEmail(email);

        if (existingMemberOpt.isPresent()) {
            // 1. 기존 회원이 있는 경우
            member = existingMemberOpt.get();

            if ("LOCAL".equals(member.getProvider())) {
                log.info("동일 이메일의 LOCAL 계정 발견 -> KAKAO 연동 통합 진행: {}", email);
                member.linkSocialProvider("KAKAO", gender, birthDate, kakaoAccessToken);

                if (member.getAddress() == null) {
                    member.updateInfo(member.getName(), member.getPhoneNumber(), finalZipCode, finalAddress, finalDetailAddress, member.getGuardianName(), member.getGuardianPhone());
                }
            } else {
                // 이미 KAKAO 연동 회원이라면 토큰만 갱신 (Dirty Checking 작동)
                member.updateKakaoToken(kakaoAccessToken);
            }
        } else {
            // 2. 완전 신규 회원인 경우
            log.info("새로운 카카오 유저 가입 진행: {}", email);
            String dummyPassword = UUID.randomUUID().toString();

            Member newMember = Member.builder()
                    .email(email)
                    .password(dummyPassword)
                    .name(name != null ? name : "카카오유저")
                    .phoneNumber(formattedPhone != null ? formattedPhone : "")
                    .zipCode(finalZipCode)
                    .address(finalAddress)
                    .detailAddress(finalDetailAddress)
                    .provider("KAKAO")
                    .role(Role.USER)
                    .gender(gender)
                    .birthDate(birthDate)
                    .kakaoAccessToken(kakaoAccessToken)
                    .build();

            try {
                // 신규 저장 시에만 예외를 잡고, 즉시 던져버립니다 (트랜잭션 망가짐 방지)
                member = memberRepository.saveAndFlush(newMember);
            } catch (DataIntegrityViolationException e) {
                log.warn("동시 가입 요청 감지 (더블클릭 방어): {}", email);
                throw new IllegalStateException("회원가입/로그인이 처리 중입니다. 잠시 후 다시 시도해주세요.");
            }
        }

        return jwtProvider.createToken(member.getId(), member.getEmail(), member.getRole().name());
    }

    // 카카오 배송지 전용 API 호출 메서드
    private Map<String, Object> getKakaoShippingAddress(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<?> request = new HttpEntity<>(headers);
        try {
            // 주의: v2가 아니라 v1 입니다!
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://kapi.kakao.com/v1/user/shipping_address",
                    HttpMethod.GET,
                    request,
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.warn("배송지 정보를 가져오는데 실패했거나 권한이 없습니다.", e);
            return Collections.emptyMap();
        }
    }

    private String normalizePhoneNumber(String kakaoPhone) {
        if (kakaoPhone == null || kakaoPhone.isEmpty()) return null;
        return kakaoPhone.replace("+82 ", "0").replace("-", "").replaceAll("[^0-9]", "");
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