package com.yescare.api.controller;

import com.yescare.api.domain.Member;
import com.yescare.api.dto.ApiResponse;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.service.EducationService;
import com.yescare.api.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // 최고 관리자 전용
public class AdminController {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final MemberService memberService;
    private final EducationService educationService;

    // 2. 기존 PIN API 주소 유지를 위해 하위 경로에 /pin/status 명시
    @GetMapping("/pin/status")
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

    // 3. 하위 경로에 /pin/setup 명시
    @PostMapping("/pin/setup")
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

    // 4. 하위 경로에 /pin/verify 명시
    @PostMapping("/pin/verify")
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

    // 어드민 대시보드 및 회원 탭용 회원 통계 데이터 조회
    @GetMapping("/members/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMemberStats() {
        // 비즈니스 로직에서 데이터 수집
        Map<String, Long> stats = memberService.getMemberStatistics();

        // 6. 중요: 프론트엔드가 데이터 분해(Destructuring)를 안전하게 처리하도록
        // 프로젝트 공통 규격인 ApiResponse.success()로 래핑하여 리턴합니다.
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // 교육 신청 대기 건수 조회 API
    @GetMapping("/educations/pending-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getPendingEducationCount() {
        long count = educationService.getPendingCount();

        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 교육 신청 전체 목록 조회 API
    @GetMapping("/educations")
    public ResponseEntity<ApiResponse<java.util.List<Map<String, Object>>>> getAllEducations() {
        java.util.List<Map<String, Object>> result = educationService.getAllEducations().stream().map(app -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", app.getId());
            // 연관된 Member 객체에서 이름과 연락처를 뽑아서 프론트 규격에 맞춤
            map.put("applicantName", app.getMember().getName());
            map.put("applicantEmail", app.getMember().getEmail());
            map.put("applicantPhone", app.getMember().getPhoneNumber());
            map.put("courseType", app.getCourseType());
            map.put("status", app.getStatus());
            map.put("appliedAt", app.getAppliedAt());
            return map;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // 교육 신청 승인/거절 상태 변경 API
    @PatchMapping("/educations/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateEducationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        String rejectionReason = request.get("rejectionReason");
        educationService.updateStatus(id, status, rejectionReason);

        return ResponseEntity.ok(ApiResponse.success("교육 신청 상태가 변경되었습니다."));
    }
}