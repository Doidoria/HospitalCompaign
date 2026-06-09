package com.yescare.api.controller;

import com.yescare.api.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemStatusController {

    // 실무에서는 DB나 Redis에 저장하는 것이 원칙이나, 현재 구조에서 즉시 테스트 가능하도록 thread-safe한 메모리 변수로 선언합니다.
    // 서버 재시작 시 초기화되는 것을 막으려면 추후 별도의 SystemConfig 엔티티/레포지토리를 연동하세요.
    private static final AtomicBoolean isMaintenanceMode = new AtomicBoolean(false);

    /**
     * 누구나 접근 가능한 점검 상태 조회 API
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> getSystemStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("maintenance", isMaintenanceMode.get())));
    }

    /**
     * 어드민 전용 점검 모드 토글 API
     */
    @PostMapping("/admin/maintenance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> toggleMaintenanceMode(@RequestBody Map<String, Boolean> request) {
        boolean targetStatus = request.getOrDefault("maintenance", false);
        isMaintenanceMode.set(targetStatus);

        String message = targetStatus ? "시스템 점검 모드가 활성화되었습니다." : "시스템 점검 모드가 해제되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(message));
    }
}