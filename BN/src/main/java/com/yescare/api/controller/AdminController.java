package com.yescare.api.controller;

import com.yescare.api.domain.Member;
import com.yescare.api.dto.ApiResponse;
import com.yescare.api.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/pin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // 최고 관리자 전용
public class AdminController {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    // 1. PIN 설정 여부 확인
    @GetMapping("/status")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Boolean>> checkPinStatus(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.error("[PIN] 인증 정보가 존재하지 않습니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("인증 자격 증명이 유효하지 않습니다."));
        }

        Member admin = memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("관리자 정보를 찾을 수 없습니다."));

        boolean isSetup = admin.getPinCode() != null && !admin.getPinCode().trim().isEmpty();
        log.info("[PIN Status] 이메일: {}, 설정여부: {}", authentication.getName(), isSetup);

        return ResponseEntity.ok(ApiResponse.success(isSetup));
    }

    // 2. PIN 초기 설정 (EntityManager 디스크 강제 동기화 추가)
    @PostMapping("/setup")
    @Transactional
    public ResponseEntity<ApiResponse<String>> setupPin(@RequestBody Map<String, String> request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("인증이 필요합니다."));
        }

        Member admin = memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("관리자 정보를 찾을 수 없습니다."));

        if (admin.getPinCode() != null && !admin.getPinCode().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("이미 PIN이 설정되어 있습니다."));
        }

        String pin = request.get("pin");
        if (pin == null || pin.length() != 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("PIN은 6자리여야 합니다."));
        }

        // 암호화 후 반영
        admin.setPinCode(passwordEncoder.encode(pin));

        // save 후 flush를 즉시 호출하여 DB 디스크와 영속성 상태를 강제로 일치시킵니다.
        memberRepository.saveAndFlush(admin);

        log.info("[PIN Setup] 관리자 {} 번호 설정 완료", authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("PIN 설정이 완료되었습니다."));
    }

    // 3. PIN 검증
    @PostMapping("/verify")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Boolean>> verifyPin(@RequestBody Map<String, String> request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("인증이 필요합니다."));
        }

        Member admin = memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("관리자 정보를 찾을 수 없습니다."));

        String rawPin = request.get("pin");

        // DB에 PIN이 설정조차 안 되어 있는 경우 예외 처리
        if (admin.getPinCode() == null || admin.getPinCode().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("설정된 PIN이 없습니다. 초기 설정을 먼저 해주세요."));
        }

        if (passwordEncoder.matches(rawPin, admin.getPinCode())) {
            log.info("[PIN Verify] 관리자 {} 인증 성공", authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(true));
        } else {
            log.warn("[PIN Verify] 관리자 {} 인증 실패 (PIN 불일치)", authentication.getName());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("PIN 번호가 일치하지 않습니다."));
        }
    }
}