package com.yescare.api.controller;

import com.yescare.api.dto.ManagerProfileResponse;
import com.yescare.api.dto.ManagerProfileUpdateRequest;
import com.yescare.api.service.ManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/managers")
@RequiredArgsConstructor
public class ManagerController {

    private final ManagerService managerService;

    // 1. 매니저 프로필 조회 (누구나 가능)
    @GetMapping("/{managerId}/profile")
    public ResponseEntity<ManagerProfileResponse> getManagerProfile(@PathVariable("managerId") Long managerId) {
        return ResponseEntity.ok(managerService.getManagerProfile(managerId));
    }

    // 2. 매니저 프로필 수정 (본인만 가능)
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateManagerProfile(
            @RequestBody ManagerProfileUpdateRequest request,
            @AuthenticationPrincipal String email) {

        managerService.updateManagerProfile(email, request);
        return ResponseEntity.ok(Map.of("message", "프로필이 성공적으로 업데이트되었습니다."));
    }
}