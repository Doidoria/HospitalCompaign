package com.yescare.api.service;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Role;
import com.yescare.api.exception.RequireAccountLinkException;
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
    private final KakaoAlimtalkService kakaoAlimtalkService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.kakao.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String redirectUri;

    @Transactional
    public String loginWithKakao(String code) {
        // 1. 카카오 토큰 및 유저 기본 정보 수신
        String kakaoAccessToken = getKakaoAccessToken(code);
        Map<String, Object> userInfo = getKakaoUserInfo(kakaoAccessToken);
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");

        String email = (String) kakaoAccount.get("email");

        // 2. 카카오 이메일 인증 여부 검증
        boolean isEmailVerified = kakaoAccount.containsKey("is_email_verified") && (boolean) kakaoAccount.get("is_email_verified");
        if (!isEmailVerified) {
            throw new IllegalStateException("카카오 계정의 이메일이 인증되지 않아 로그인할 수 없습니다. 카카오톡에서 이메일 인증을 완료해주세요.");
        }

        // 3. 이름(닉네임) 추출
        String name = (String) kakaoAccount.get("name");
        if (name == null) {
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            if (profile != null) {
                name = (String) profile.get("nickname");
            }
        }

        // 4. 폰 번호 추출 및 누락/거부 대비 방어 로직 (010-0000-0000 세팅)
        String kakaoPhone = (String) kakaoAccount.get("phone_number");
        String phoneNumber = normalizePhoneNumber(kakaoPhone);

        if (phoneNumber == null || phoneNumber.isEmpty()) {
            phoneNumber = "01000000000";
        }

        // 5. 성별 및 생년월일 추출
        String gender = (String) kakaoAccount.get("gender");
        String birthyear = (String) kakaoAccount.get("birthyear");
        String birthday = (String) kakaoAccount.get("birthday");
        String birthDate = (birthyear != null && birthday != null) ? birthyear + birthday : null;

        // 6. 카카오 배송지(주소) 정보 추출 및 정제
        Map<String, Object> shippingInfo = getKakaoShippingAddress(kakaoAccessToken);
        String zipCode = null;
        String address = null;
        String detailAddress = null;

        if (shippingInfo != null && shippingInfo.containsKey("shipping_addresses")) {
            Object shippingObj = shippingInfo.get("shipping_addresses");
            if (shippingObj instanceof List) {
                List<Map<String, Object>> addresses = (List<Map<String, Object>>) shippingObj;
                if (!addresses.isEmpty()) {
                    Map<String, Object> baseAddressInfo = addresses.get(0);

                    // 기본 배송지가 설정되어 있다면 우선 매핑
                    for (Map<String, Object> addr : addresses) {
                        if (Boolean.TRUE.equals(addr.get("is_default"))) {
                            baseAddressInfo = addr;
                            break;
                        }
                    }

                    zipCode = (String) baseAddressInfo.get("zone_number");
                    address = (String) baseAddressInfo.get("base_address");
                    detailAddress = (String) baseAddressInfo.get("detail_address");
                }
            }
        }

        String finalZipCode = zipCode;
        String finalAddress = address;
        String finalDetailAddress = detailAddress;

        // 7. 핵심 비즈니스 라우팅: 기존 가입자 여부 판단
        Member member;
        Optional<Member> existingMemberOpt = memberRepository.findByEmail(email);

        // 카카오 이메일과 기존 이메일이 다르더라도, '전화번호'가 같다면 동일인으로 간주하여 연동 시도!
        if (existingMemberOpt.isEmpty() && phoneNumber != null && !phoneNumber.equals("01000000000")) {
            existingMemberOpt = memberRepository.findByPhoneNumber(phoneNumber);
            if (existingMemberOpt.isPresent()) {
                member = existingMemberOpt.get();

                if ("LOCAL".equals(member.getProvider())) {
                    // 🚨 [수정됨] 자동 연동하지 않고, 프론트엔드에 카카오 토큰과 함께 예외를 던집니다.
                    // 프론트엔드는 이 에러를 잡아서 사용자에게 "연동하시겠습니까?" 팝업을 띄웁니다.
                    throw new RequireAccountLinkException(
                            "이미 동일한 전화번호로 가입된 일반 계정이 있습니다. 카카오 계정으로 통합하시겠습니까?",
                            kakaoAccessToken,
                            email
                    );
                } else {
                    member.updateKakaoToken(kakaoAccessToken);
                }
            }
        }

        if (existingMemberOpt.isPresent()) {
            // [케이스 A] 기존 회원이 이미 존재하는 경우
            member = existingMemberOpt.get();

            if ("LOCAL".equals(member.getProvider())) {
                // 일반 회원가입 유저가 카카오 로그인을 처음 시도한 경우 연동 처리
                log.info("동일 이메일의 LOCAL 계정 발견 -> KAKAO 연동 통합 진행: {}", email);
                member.linkSocialProvider("KAKAO", gender, birthDate, kakaoAccessToken);

                // 기존 자택 주소가 비어있다면 카카오 주소로 채워줌
                if (member.getAddress() == null) {
                    member.updateInfo(member.getName(), member.getPhoneNumber(), finalZipCode, finalAddress, finalDetailAddress, member.getGuardianName(), member.getGuardianPhone());
                }
            } else {
                // 이미 카카오로 가입한 회원이라면 액세스 토큰만 최신화 (더티 체킹)
                member.updateKakaoToken(kakaoAccessToken);
            }
        } else {
            // [케이스 B] 최초 진입한 완전 신규 회원인 경우 -> 여기서 단 한 번만 저장이 일어나야 함!
            log.info("새로운 카카오 유저 가입 진행: {}", email);
            String dummyPassword = UUID.randomUUID().toString();

            Member newMember = Member.builder()
                    .email(email)
                    .password(dummyPassword)
                    .name(name != null ? name : "카카오유저")
                    .phoneNumber(phoneNumber) // 위에서 방어한 정제 번호 주입
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
                member = memberRepository.saveAndFlush(newMember);

                // 단, 필수 동의를 거부해서 들어온 더미 번호(01000000000)가 아닐 때만 발송
                if (phoneNumber != null && !phoneNumber.equals("01000000000")) {
                    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH:mm");
                    String joinDate = java.time.LocalDateTime.now().format(formatter);

                    // 이름, 가입시간, 이메일(아이디)을 꽉 채워서 알림톡 발송!
                    kakaoAlimtalkService.sendJoinComplete(phoneNumber, member.getName(), joinDate, member.getEmail());
                    log.info("🔔 카카오 신규 가입자 환영 알림톡 발송 완료: {}", phoneNumber);
                }
            } catch (DataIntegrityViolationException e) {
                log.warn("동시 가입 요청 감지 (더블클릭 방어): {}", email);
                throw new IllegalStateException("회원가입/로그인이 처리 중입니다. 잠시 후 다시 시도해주세요.");
            }
        }

        // 8. 우리 서비스 전용 JWT 토큰 발급 후 프론트엔드로 반환
        return jwtProvider.createToken(member.getId(), member.getEmail(), member.getRole().name());
    }

    @Transactional
    public String confirmAndLinkKakao(String kakaoAccessToken) {
        // 1. 프론트에서 다시 넘겨준 임시 카카오 토큰으로 카카오 유저 정보를 다시 조회
        Map<String, Object> userInfo = getKakaoUserInfo(kakaoAccessToken);
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");

        String kakaoEmail = (String) kakaoAccount.get("email");
        String kakaoPhone = normalizePhoneNumber((String) kakaoAccount.get("phone_number"));

        // 변경하려는 카카오 이메일을 이미 다른 계정이 점유하고 있는지 교차 검증
        Optional<Member> emailConflictCheck = memberRepository.findByEmail(kakaoEmail);
        if (emailConflictCheck.isPresent()) {
            throw new IllegalArgumentException("통합하려는 카카오 이메일(" + kakaoEmail + ")로 가입된 다른 계정이 이미 존재합니다. 고객센터에 문의해 주세요.");
        }

        // 2. 전화번호로 기존 LOCAL 회원 찾기
        Member member = memberRepository.findByPhoneNumber(kakaoPhone)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        // 3. 카카오 정보 우선 덮어쓰기 (기존 기록은 id로 유지됨)
        member.overwriteWithKakaoInfo(
                kakaoEmail, // 이메일을 카카오 이메일로 완전 교체
                (String) kakaoAccount.get("name"),
                kakaoAccessToken
        );

        // 4. 연동 완료 후 정상적인 로그인 토큰 발급
        return jwtProvider.createToken(member.getId(), member.getEmail(), member.getRole().name());
    }

    // 카카오 API 서버에 앱 연결 끊기(Unlink) 요청
    public void unlinkKakao(String kakaoAccessToken) {
        if (kakaoAccessToken == null || kakaoAccessToken.isEmpty()) {
            log.warn("카카오 액세스 토큰이 없어 연동 해제 API 호출을 건너뜁니다.");
            return;
        }

        String url = "https://kapi.kakao.com/v1/user/unlink";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Bearer " + kakaoAccessToken);

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("카카오 회원 연동 해제(Unlink) API 호출 성공: {}", response.getBody());
            } else {
                log.error("카카오 연동 해제 API 실패 (상태코드: {}): {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("카카오 연동 해제 통신 중 장애 발생 (토큰 만료 등): {}", e.getMessage());
        }
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