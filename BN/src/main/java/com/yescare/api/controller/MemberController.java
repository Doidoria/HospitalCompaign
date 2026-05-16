package com.yescare.api.controller;

import com.yescare.api.domain.Member;
import com.yescare.api.dto.*;
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

    // ==========================================
    // [회원(Member) 관련 API] -> memberService 사용
    // ==========================================

    @PostMapping("/join")
    public ResponseEntity<String> join(@RequestBody MemberJoinRequest request) {
        memberService.join(request);
        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmail(@RequestParam("email") String email) {
        boolean isAvailable = memberService.isEmailAvailable(email);
        return ResponseEntity.ok(isAvailable);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        String token = memberService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @GetMapping("/me")
    public ResponseEntity<MemberResponse> getMe(@AuthenticationPrincipal String email) {
        Member member = memberService.getMemberByEmail(email);
        return ResponseEntity.ok(new MemberResponse(member));
    }

    @PostMapping("/verify-password")
    public ResponseEntity<Boolean> verifyPassword(@AuthenticationPrincipal String email, @RequestBody Map<String, String> request) {
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
            @ModelAttribute ManagerApplyRequest request,
            @RequestParam(value = "certificateFile", required = false) MultipartFile file,
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
    public ResponseEntity<List<ManagerAppResponse>> getPendingApplications() {
        return ResponseEntity.ok(managerService.getPendingManagerApplications());
    }

    @GetMapping("/me/manager-application")
    public ResponseEntity<Map<String, String>> getMyApplicationStatus(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(managerService.getManagerApplicationStatus(email));
    }

    @GetMapping("/managers/count")
    public ResponseEntity<Long> getActiveManagerCount() {
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
    public ResponseEntity<?> sendSms(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        smsService.sendVerificationCode(phone);
        return ResponseEntity.ok(Map.of("message", "인증번호가 발송되었습니다."));
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
            // 카카오 인가 코드를 넘겨주고 JWT 토큰을 발급받음
            String jwtToken = kakaoAuthService.loginWithKakao(request.getCode());

            // 기존 프론트엔드 코드(response.data.accessToken)가 받을 수 있도록 Map 형태로 반환
            return ResponseEntity.ok(Map.of("accessToken", jwtToken));

        } catch (Exception e) {
            log.error("카카오 로그인 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("카카오 인증에 실패했습니다.");
        }
    }
}