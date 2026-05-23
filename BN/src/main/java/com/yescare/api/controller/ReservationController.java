package com.yescare.api.controller;

import com.yescare.api.dto.*;
import com.yescare.api.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<String> makeReservation(@RequestAttribute("userEmail") String email, @RequestBody ReservationRequest request) {
        Long reservationId = reservationService.createReservation(email, request);
        return ResponseEntity.ok("예약이 성공적으로 접수되었습니다.");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // 관리자만 전체 예약 목록 조회 가능
    public ResponseEntity<Page<ReservationResponse>> getAllReservations(
            @PageableDefault(size = 10, sort = "reservationTime", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reservationService.getAllReservations(pageable));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')") // 관리자만 임의로 상태 변경 가능
    public ResponseEntity<String> updateStatus(@PathVariable Long id, @RequestBody ReservationStatusRequest request) {
        reservationService.updateReservationStatus(id, request.getStatus());
        return ResponseEntity.ok("예약 상태가 성공적으로 변경되었습니다.");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')") // 본인 취소 또는 관리자 직권 취소
    public ResponseEntity<String> cancelReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.ok("예약 번호 " + id + "번이 성공적으로 취소(삭제)되었습니다.");
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> assignManagerByAdmin(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String managerEmail = request.get("managerEmail");
        if (managerEmail == null || managerEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("매니저 이메일이 누락되었습니다.");
        }
        reservationService.assignManagerByAdmin(id, managerEmail);
        return ResponseEntity.ok("매니저 배정이 완료되었습니다.");
    }

    // 관리자 전용 매니저 배정 취소 API
    @PatchMapping("/{id}/cancel-assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> cancelManagerAssignByAdmin(@PathVariable Long id) {
        reservationService.cancelManagerAssignByAdmin(id);
        return ResponseEntity.ok("매니저 배정이 취소되고 대기 상태로 변경되었습니다.");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')") // 일반 유저만 본인 예약 수정 가능
    public ResponseEntity<String> editReservation(@PathVariable Long id, @RequestBody ReservationRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(403).body("로그인이 필요합니다.");
        reservationService.editReservation(id, principal.getName(), request);
        return ResponseEntity.ok("예약이 성공적으로 수정되었습니다.");
    }

    @GetMapping("/me")
    public ResponseEntity<List<ReservationResponse>> getMyReservations(
            // 문지기(JwtFilter)가 검사 후 넘겨준 이메일 메모를 꺼내옵니다.
            @RequestAttribute("userEmail") String email) {

        // 내 이메일을 서비스로 넘겨서 내 예약 목록만 받아옵니다.
        List<ReservationResponse> myReservations = reservationService.getMyReservations(email);

        return ResponseEntity.ok(myReservations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationDetail(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.getReservationDetail(id));
    }

    // 매니저 대시보드 - 신규 동행 요청 (WAITING) 목록
    @GetMapping("/waiting")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<ReservationResponse>> getWaitingReservations() {
        return ResponseEntity.ok(reservationService.getWaitingReservations());
    }

    // 매니저 대시보드 - 나의 배정 일정
    @GetMapping("/manager/me")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<ReservationResponse>> getManagerSchedules(Principal principal) {
        if (principal == null) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(reservationService.getManagerSchedules(principal.getName()));
    }

    // 매니저 대리 예약 신청 API
    @PostMapping("/{id}/proxy")
    public ResponseEntity<?> createProxyReservation(@PathVariable Long id, @RequestBody Map<String, String> request) {
        reservationService.createProxyReservation(id, request);
        return ResponseEntity.ok(Map.of("message", "대리 예약이 완료되었습니다."));
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<String> addReview(@PathVariable Long id, @RequestBody ReviewRequest request) {
        reservationService.addReview(id, request.getRating(), request.getComment());
        return ResponseEntity.ok("리뷰가 성공적으로 등록되었습니다.");
    }

    // 어드민용 예약 통합 검색 API (환자명, 병원명 등으로 검색)
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ReservationResponse>> searchReservations(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "reservationTime", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(reservationService.searchReservations(keyword, status, pageable));
    }

    // 어드민용 전체 리뷰 조회 API
    @GetMapping("/reviews/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ReviewResponse>> getAllReviews(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(reservationService.getAllReviews(pageable));
    }

    // 어드민용 리뷰 삭제(숨김) API
    @DeleteMapping("/reviews/{reviewId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteReview(@PathVariable Long reviewId) {

        reservationService.deleteReview(reviewId);
        return ResponseEntity.ok("리뷰가 성공적으로 삭제 처리되었습니다.");
    }

    // 예약 건에 대해 배정 가능한 매니저 목록만 조회 API
    @GetMapping("/{id}/available-managers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAvailableManagers(@PathVariable Long id) {
        List<Map<String, Object>> availableManagers = reservationService.getAvailableManagersForReservation(id);
        return ResponseEntity.ok(availableManagers);
    }

    // 관리자가 사용자 예약 일정 및 장소 수정 API
    @PutMapping("/{id}/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateReservation(
            @PathVariable Long id,
            @RequestBody AdminReservationUpdateRequest request) {

        reservationService.updateReservationByAdmin(id, request);
        return ResponseEntity.ok().build();
    }
}