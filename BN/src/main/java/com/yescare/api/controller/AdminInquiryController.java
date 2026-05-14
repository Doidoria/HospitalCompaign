package com.yescare.api.controller;

import com.yescare.api.dto.AdminInquiryResponse;
import com.yescare.api.dto.InquiryAnswerRequest;
import com.yescare.api.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inquiries")
@RequiredArgsConstructor
// 💡 컨트롤러 전체에 관리자/매니저 권한 설정 (프로젝트의 Role 정책에 맞게 조절하세요)
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminInquiryController {

    private final InquiryService inquiryService;

    // 1. 전체 문의 내역 조회 (페이징)
    @GetMapping
    public ResponseEntity<Page<AdminInquiryResponse>> getAllInquiries(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10) Pageable pageable) { // 프론트에서 10개씩 가져가도록 설정

        Page<AdminInquiryResponse> response = inquiryService.getAllInquiriesForAdmin(status, pageable);
        return ResponseEntity.ok(response);
    }

    // 2. 문의 답변 등록
    @PatchMapping("/{id}/answer")
    public ResponseEntity<Void> answerInquiry(
            @PathVariable Long id,
            @RequestBody InquiryAnswerRequest request) {

        inquiryService.answerInquiry(id, request.getAnswer());
        return ResponseEntity.ok().build(); // 성공 시 200 OK 반환
    }
}