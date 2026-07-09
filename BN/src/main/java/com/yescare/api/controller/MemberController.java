package com.yescare.api.controller;

import com.yescare.api.domain.Member;
import com.yescare.api.dto.*;
import com.yescare.api.exception.RequireAccountLinkException;
import com.yescare.api.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final ManagerService managerService;
    private final SmsService smsService;
    private final KakaoAuthService kakaoAuthService;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;

    // ==========================================
    // [회원(Member) 관련 API] -> memberService 사용
    // ==========================================

    @PostMapping("/join")
    public ResponseEntity<String> join(@RequestBody MemberJoinRequest request) {
        memberService.join(request);
        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam("email") String email) {
        boolean isAvailable = memberService.isEmailAvailable(email);
        return ResponseEntity.ok(isAvailable);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        String token = memberService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal String email) {
        if (email != null) {
            log.info("사용자 로그아웃 요청: {}", email);

            // 추후 Redis 등을 도입하여 토큰 블랙리스트(Blacklist)를 구현하거나,
            // DB에 저장된 Refresh Token을 삭제하는 로직을 여기에 추가하시면 됩니다.
            // 예: memberService.logout(email);
        }

        // 프론트엔드에서 쿠키를 사용할 경우를 대비해 빈 쿠키를 내려보내 초기화할 수도 있습니다.
        // 현재는 로컬스토리지를 메인으로 쓰시므로 성공 응답만 내려줍니다.
        return ResponseEntity.ok(Map.of("message", "성공적으로 로그아웃 되었습니다."));
    }

    @GetMapping("/me")
    public ResponseEntity<MemberResponse> getMe(@AuthenticationPrincipal String email) {
        Member member = memberService.getMemberByEmail(email);
        return ResponseEntity.ok(new MemberResponse(member));
    }

    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@AuthenticationPrincipal String email, @RequestBody Map<String, String> request) {
        boolean isMatch = memberService.verifyPassword(email, request.get("password"));
        return ResponseEntity.ok(isMatch);
    }

    @PutMapping("/me")
    public ResponseEntity<String> updateMe(@AuthenticationPrincipal String email, @RequestBody MemberUpdateRequest request) {
        memberService.updateMember(email, request);
        return ResponseEntity.ok("정보가 성공적으로 수정되었습니다.");
    }

    @PutMapping("/password")
    public ResponseEntity<String> changePassword(@AuthenticationPrincipal String email, @RequestBody PasswordChangeRequest request) {
        memberService.changePassword(email, request.getNewPassword());
        return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
    }

    @DeleteMapping("/me")
    public ResponseEntity<String> withdraw(@AuthenticationPrincipal String email) {
        memberService.withdraw(email);
        return ResponseEntity.ok("회원 탈퇴가 성공적으로 완료되었습니다.");
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<MemberResponse>> getAllMembers(
            @RequestParam(value = "role", required = false) String role,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(memberService.getAllMembers(role, pageable));
    }

    @PatchMapping("/{memberId}/role")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> changeMemberRole(@PathVariable("memberId") Long memberId, @RequestBody Map<String, String> request) {
        memberService.changeMemberRole(memberId, request.get("role"));
        return ResponseEntity.ok("회원 권한이 성공적으로 변경되었습니다.");
    }

    @PatchMapping("/{memberId}/status")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> updateStatus(@PathVariable("memberId") Long memberId, @RequestBody Map<String, Boolean> request) {
        boolean activate = request.get("activate");
        memberService.updateMemberStatus(memberId, activate);
        return ResponseEntity.ok(activate ? "계정 정지가 해제되었습니다." : "계정이 정지되었습니다.");
    }

    // ==========================================
    // [매니저(Manager) 관련 API] -> managerService 사용
    // ==========================================

    @PostMapping("/apply-manager")
    public ResponseEntity<String> applyManager(
            @RequestPart("request") ManagerApplyRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal String email) {

        String fileUrl = null;
        if (file != null && !file.isEmpty()) {
            fileUrl = fileStorageService.uploadFile(file);
        }
        managerService.saveManagerApplication(request, email, fileUrl);

        return ResponseEntity.ok("매니저 지원이 완료되었습니다.");
    }

    @PatchMapping("/applications/{applicationId}/reject")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> rejectApplication(
            @PathVariable("applicationId") Long applicationId,
            @RequestBody Map<String, String> requestBody) {
        managerService.rejectManagerApplication(applicationId, requestBody.get("reason"));
        return ResponseEntity.ok("지원이 반려되었습니다.");
    }

    @GetMapping("/manager-applications")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<ManagerAppResponse>> getApplications(
            @RequestParam(value = "status", defaultValue = "WAITING") String status) {
        return ResponseEntity.ok(managerService.getManagerApplicationsByStatus(status));
    }

    @GetMapping("/manager-applications/stats")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getManagerStats() {
        Map<String, Long> stats = managerService.getManagerStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/me/manager-application")
    public ResponseEntity<ApiResponse<Map<String, String>>> getMyApplicationStatus(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(ApiResponse.success(managerService.getManagerApplicationStatus(email)));
    }

    @GetMapping("/managers/count")
    public ResponseEntity<?> getActiveManagerCount() {
        return ResponseEntity.ok(managerService.getActiveManagerCount());
    }

    @PatchMapping("/{memberId}/approve")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> approveManager(@PathVariable("memberId") Long memberId) {
        String resultMsg = managerService.approveManager(memberId);
        return ResponseEntity.ok(resultMsg);
    }

    // SMS 관련 API는 기존대로 유지
    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendSms(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        smsService.sendVerificationCode(phone);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "인증번호가 발송되었습니다.")));
    }

    @PostMapping("/sms/verify")
    public ResponseEntity<?> verifySms(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        String code = request.get("code");
        boolean isVerified = smsService.verifyCode(phone, code);
        if (isVerified) {
            return ResponseEntity.ok(Map.of("message", "인증에 성공했습니다."));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "인증번호가 일치하지 않습니다."));
        }
    }

    // 카카오 로그인 콜백 엔드포인트
    @PostMapping("/auth/kakao")
    public ResponseEntity<?> kakaoLogin(@RequestBody KakaoLoginRequest request) {
        try {
            String jwtToken = kakaoAuthService.loginWithKakao(request.getCode());
            return ResponseEntity.ok(Map.of("accessToken", jwtToken));

        } catch (RequireAccountLinkException e) {
            throw e;

        } catch (Exception e) {
            log.error("카카오 로그인 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("카카오 인증에 실패했습니다.");
        }
    }

    // 카카오 연동 승인 API
    @PostMapping("/auth/kakao/confirm-link")
    public ResponseEntity<?> confirmKakaoLink(@RequestBody Map<String, String> request) {
        try {
            String tempToken = request.get("tempToken");
            // KakaoAuthService에 만든 연동 로직 호출
            String jwtToken = kakaoAuthService.confirmAndLinkKakao(tempToken);

            // 프론트엔드가 토큰을 받을 수 있도록 형태를 맞춤
            return ResponseEntity.ok(Map.of("accessToken", jwtToken));
        } catch (Exception e) {
            log.error("카카오 연동 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("계정 연동에 실패했습니다.");
        }
    }

    @PostMapping("/email/send")
    public ResponseEntity<?> sendEmailCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        // 중복 체크를 한 번 더 거치는 것이 안전합니다.
        if (!memberService.isEmailAvailable(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "이미 가입된 이메일입니다."));
        }
        emailService.sendVerificationCode(email);
        return ResponseEntity.ok(Map.of("message", "인증번호가 이메일로 발송되었습니다."));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<?> verifyEmailCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        boolean isVerified = emailService.verifyCode(email, code);

        if (isVerified) {
            return ResponseEntity.ok(Map.of("message", "이메일 인증에 성공했습니다."));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "인증번호가 일치하지 않습니다."));
        }
    }

    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String phoneNumber = request.get("phoneNumber");

            // 정상 조회 시
            Map<String, String> result = memberService.findIdInfo(name, phoneNumber);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            // 카카오 계정이거나 정보가 없을 때 400 에러와 함께 메시지 전송
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password/send-sms")
    public ResponseEntity<?> sendSmsForPasswordReset(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String phone = request.get("phone");

            // 카카오 계정인지, 회원 정보가 맞는지 사전 검증
            memberService.checkEligibilityForPasswordReset(email, phone);

            // 통과하면 SMS 발송
            smsService.sendVerificationCode(phone);
            return ResponseEntity.ok(Map.of("message", "인증번호가 발송되었습니다."));

        } catch (IllegalArgumentException e) {
            // 에러 발생 시 프론트엔드로 메시지 전달
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // 아이디/비밀번호 찾기 API
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String phone = request.get("phone");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        // 1. 휴대폰 인증번호 검증 (기존 SmsService 재사용)
        boolean isVerified = smsService.verifyCode(phone, code);
        if (!isVerified) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "인증번호가 일치하지 않습니다."));
        }

        // 2. 비밀번호 재설정
        try {
            memberService.resetPassword(email, phone, newPassword);
            return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 재설정되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}