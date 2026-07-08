package com.yescare.api.service;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Role;
import com.yescare.api.dto.MemberJoinRequest;
import com.yescare.api.dto.MemberResponse;
import com.yescare.api.dto.MemberUpdateRequest;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final KakaoAuthService kakaoAuthService;
    private final KakaoAlimtalkService kakaoAlimtalkService;

    @Transactional
    public Long join(MemberJoinRequest request) {
        memberRepository.findByEmail(request.getEmail())
                .ifPresent(m -> {
                    throw new IllegalStateException("이미 가입된 이메일입니다.");
                });

        // 전화번호 중복 검사 (데이터 정합성을 위해 숫자만 추출)
        String normalizedPhone = request.getPhoneNumber() != null ?
                request.getPhoneNumber().replaceAll("[^0-9]", "") : "";

        if (!normalizedPhone.isEmpty()) {
            memberRepository.findByPhoneNumber(normalizedPhone)
                    .ifPresent(m -> {
                        // 프론트엔드에서 Catch하여 사용자에게 알림을 띄워줄 메시지
                        throw new IllegalStateException("이미 해당 전화번호로 가입된 계정이 존재합니다. 기존 계정 또는 카카오 로그인을 이용해주세요.");
                    });
        }

        Member newMember = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phoneNumber(normalizedPhone) // 정규화된 번호 저장
                .provider("LOCAL")
                .zipCode(request.getZipCode())
                .address(request.getAddress())
                .detailAddress(request.getDetailAddress())
                .guardianName(request.getGuardianName())
                .guardianPhone(request.getGuardianPhone())
                .build();

        memberRepository.save(newMember);

        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH:mm");
        String joinDate = java.time.LocalDateTime.now().format(formatter);

        kakaoAlimtalkService.sendJoinComplete(
                newMember.getPhoneNumber(),
                newMember.getName(),
                joinDate,
                newMember.getEmail()
        );
        return newMember.getId();
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return memberRepository.findByEmail(email).isEmpty();
    }

    public String login(String email, String password) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!member.isActive()) {
            throw new IllegalStateException("정지된 계정입니다. 관리자에게 문의하세요.");
        }
        if (!passwordEncoder.matches(password, member.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        return jwtProvider.createToken(member.getId(), member.getEmail(), member.getRole().name());
    }

    public Member getMemberByEmail(String email) {
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보가 없습니다."));
    }

    public boolean checkEmailDuplicate(String email) {
        return memberRepository.findByEmail(email).isEmpty();
    }

    @Transactional(readOnly = true)
    public boolean verifyPassword(String email, String rawPassword) {
        Member member = getMemberByEmail(email);
        return passwordEncoder.matches(rawPassword, member.getPassword());
    }

    @Transactional
    public void updateMember(String email, MemberUpdateRequest request) {
        Member member = getMemberByEmail(email);
        member.updateInfo(
                request.getName(), request.getPhoneNumber(), request.getZipCode(),
                request.getAddress(), request.getDetailAddress(),
                request.getGuardianName(), request.getGuardianPhone()
        );
    }

    @Transactional
    public void changePassword(String email, String newPassword) {
        Member member = getMemberByEmail(email);
        member.updatePassword(passwordEncoder.encode(newPassword));
    }

    @Transactional(readOnly = true)
    public Page<MemberResponse> getAllMembers(String roleString, Pageable pageable) {
        if (roleString != null && !roleString.isEmpty()) {
            return memberRepository.findByRole(Role.valueOf(roleString), pageable).map(MemberResponse::new);
        }
        return memberRepository.findAll(pageable).map(MemberResponse::new);
    }

    @Transactional
    public void updateMemberStatus(Long memberId, boolean status) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        if (member.getRole() == Role.ADMIN) throw new IllegalStateException("관리자 계정의 상태는 변경할 수 없습니다.");

        if (status) member.activate();
        else member.suspend();
    }

    @Transactional
    public void changeMemberRole(Long memberId, String roleName) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        if (member.getRole() == Role.ADMIN) throw new IllegalStateException("관리자 권한은 변경할 수 없습니다.");

        String cleanRoleName = roleName.replace("ROLE_", "");
        member.changeRole(Role.valueOf(cleanRoleName));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getMemberStatistics() {
        return Map.of(
                "totalCount", memberRepository.count(),
                "userCount", memberRepository.countByRole(Role.USER),
                "managerCount", memberRepository.countByRole(Role.MANAGER),
                "suspendedCount", memberRepository.countByIsActiveFalse()
        );
    }

    // ✅ 프론트엔드 대시 기입 대응을 위해 연락처 정규화 처리 추가
    @Transactional(readOnly = true)
    public Map<String, String> findIdInfo(String name, String phoneNumber) {
        String normalizedPhone = phoneNumber != null ? phoneNumber.replaceAll("[^0-9]", "") : "";
        Member member = memberRepository.findByNameAndPhoneNumber(name, normalizedPhone)
                .orElseThrow(() -> new IllegalArgumentException("입력하신 정보와 일치하는 계정이 없습니다."));

        String email = member.getEmail();
        int atIndex = email.indexOf("@");
        String maskedEmail = email;

        if (atIndex > 3) {
            String prefix = email.substring(0, 3);
            maskedEmail = prefix + "****" + email.substring(atIndex);
        }

        return Map.of(
                "maskedEmail", maskedEmail,
                "provider", member.getProvider()
        );
    }

    // ✅ JPA 상위 스펙에 맞는 안전한 탈퇴 (더티 체킹만으로 깔끔하게 디태치 및 마스킹 반영)
    @Transactional
    public void withdraw(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이미 탈퇴 처리되었거나 존재하지 않는 회원입니다."));

        if ("KAKAO".equals(member.getProvider())) {
            try {
                kakaoAuthService.unlinkKakao(member.getKakaoAccessToken());
            } catch (Exception e) {
                log.error("카카오 API 연동 해제 중 에러 발생했으나 로컬 탈퇴는 계속 진행합니다: {}", e.getMessage());
            }
        }

        member.withdraw(); // 엔티티 상태 변경 및 내부 isDeleted = true 플래그 전환 완료
        log.info("예스케어 회원 소프트 탈퇴(마스킹) 완료: {}", email);
    }

    @Transactional
    public void resetPassword(String email, String phoneNumber, String newPassword) {
        String normalizedPhone = phoneNumber != null ? phoneNumber.replaceAll("[^0-9]", "") : "";
        Member member = memberRepository.findByEmailAndPhoneNumber(email, normalizedPhone)
                .orElseThrow(() -> new IllegalArgumentException("입력하신 정보와 일치하는 계정이 없습니다."));

        if ("KAKAO".equals(member.getProvider())) {
            throw new IllegalArgumentException("카카오 연동으로 가입된 계정입니다. 비밀번호 찾기 대신 카카오 로그인을 이용해주세요.");
        }

        member.updatePassword(passwordEncoder.encode(newPassword));
    }

    @Transactional(readOnly = true)
    public void checkEligibilityForPasswordReset(String email, String phoneNumber) {
        String normalizedPhone = phoneNumber != null ? phoneNumber.replaceAll("[^0-9]", "") : "";
        Member member = memberRepository.findByEmailAndPhoneNumber(email, normalizedPhone)
                .orElseThrow(() -> new IllegalArgumentException("입력하신 정보와 일치하는 계정이 없습니다."));

        if ("KAKAO".equals(member.getProvider())) {
            throw new IllegalArgumentException("카카오 연동으로 가입된 계정입니다. 비밀번호 찾기 대신 카카오 로그인을 이용해주세요.");
        }
    }
}