package com.yescare.api.config;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Role;
import com.yescare.api.repository.MemberRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInit {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        // "admin" 이메일(아이디)이 없으면 최고 관리자 계정 자동 생성
        if (memberRepository.findByEmail("admin").isEmpty()) {
            Member admin = Member.builder()
                    .email("admin")
                    .password(passwordEncoder.encode("admin"))
                    .name("최고관리자")
                    .phoneNumber("010-0000-0000")
                    .role(Role.ADMIN) // 권한을 ADMIN으로 부여!
                    .build();
            memberRepository.save(admin);
            System.out.println("🚨 관리자(admin/admin) 계정이 자동 생성되었습니다.");
        }
    }
}