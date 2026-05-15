package com.yescare.api.service;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Role;
import com.yescare.api.dto.MemberJoinRequest;
import com.yescare.api.dto.MemberResponse;
import com.yescare.api.dto.MemberUpdateRequest;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Long join(MemberJoinRequest request) {
        memberRepository.findByEmail(request.getEmail())
                .ifPresent(m -> {
                    throw new IllegalStateException("이미 가입된 이메일입니다.");
                });

        Member newMember = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .provider("LOCAL")
                .zipCode(request.getZipCode())
                .address(request.getAddress())
                .detailAddress(request.getDetailAddress())
                .guardianName(request.getGuardianName())
                .guardianPhone(request.getGuardianPhone())
                .build();

        memberRepository.save(newMember);
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
}