package com.yescare.api.controller;

import com.yescare.api.dto.ApiResponse;
import com.yescare.api.dto.NoticeRequest;
import com.yescare.api.dto.NoticeResponse;
import com.yescare.api.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')") // 관리자 권한 필수
public class AdminNoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ResponseEntity<Page<NoticeResponse>> getAllNoticesForAdmin(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(noticeService.getAllNotices(pageable));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Long>> createNotice(@RequestBody NoticeRequest request) {
        Long noticeId = noticeService.createNotice(request);
        return ResponseEntity.ok(ApiResponse.success(noticeId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateNotice(@PathVariable Long id, @RequestBody NoticeRequest request) {
        noticeService.updateNotice(id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok().build();
    }
}