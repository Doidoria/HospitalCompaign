package com.yescare.api.controller;

import com.yescare.api.dto.ExtraChargeRequest;
import com.yescare.api.dto.ManagerProfileResponse;
import com.yescare.api.dto.ManagerProfileUpdateRequest;
import com.yescare.api.service.ManagerService;
import com.yescare.api.service.ReservationService;
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
    private final ReservationService reservationService;

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

    // 동행 시작
    @PatchMapping("/reservations/{id}/start")
    @PreAuthorize("hasAuthority('ROLE_MANAGER_PRO') or hasAuthority('ROLE_MANAGER_FREE') or hasAuthority('MANAGER_PRO') or hasAuthority('MANAGER_FREE')")
    public ResponseEntity<?> startAccompany(@PathVariable("id") Long id, @AuthenticationPrincipal String email) {
        reservationService.startAccompany(id, email);
        return ResponseEntity.ok(Map.of("message", "동행 서비스가 시작되었습니다."));
    }

    // 동행 완료
    @PatchMapping("/reservations/{id}/complete")
    @PreAuthorize("hasAuthority('ROLE_MANAGER_PRO') or hasAuthority('ROLE_MANAGER_FREE') or hasAuthority('MANAGER_PRO') or hasAuthority('MANAGER_FREE')")
    public ResponseEntity<?> completeAccompany(@PathVariable("id") Long id, @AuthenticationPrincipal String email) {
        reservationService.completeAccompany(id, email);
        return ResponseEntity.ok(Map.of("message", "동행 서비스가 종료되었습니다. 리포트를 작성해 주세요."));
    }

    // 추가 요금 등록
    @PostMapping("/reservations/{id}/extra-charge")
    @PreAuthorize("hasAuthority('ROLE_MANAGER_PRO') or hasAuthority('ROLE_MANAGER_FREE') or hasAuthority('MANAGER_PRO') or hasAuthority('MANAGER_FREE')")
    public ResponseEntity<?> addExtraCharge(
            @PathVariable("id") Long id,
            @RequestBody ExtraChargeRequest request,
            @AuthenticationPrincipal String email) {

        reservationService.addExtraCharge(id, email, request.getAmount(), request.getReason());
        return ResponseEntity.ok(Map.of("message", "추가 요금이 성공적으로 청구되었습니다."));
    }
}