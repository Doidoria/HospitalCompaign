package com.yescare.api.controller;

import com.yescare.api.domain.Member;
import com.yescare.api.dto.*;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;
    private final MemberRepository memberRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Long> createInquiry(
            @ModelAttribute InquiryRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));

        Long inquiryId = inquiryService.saveInquiry(request, member);

        return ApiResponse.success(inquiryId);
    }

    // 프론트엔드가 호출하는 내 문의 내역 조회 API
    @GetMapping("/me")
    public ResponseEntity<List<InquiryResponse>> getMyInquiries(Authentication authentication) {
        // 1. 접속한 유저 정보 가져오기
        Member member = memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자를 찾을 수 없습니다."));

        // 2. 서비스에서 내 문의 내역 리스트 가져오기
        List<InquiryResponse> responses = inquiryService.getMyInquiries(member);

        // 3. 200 OK와 함께 리스트 반환
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InquiryDetailResponse> getInquiry(@PathVariable Long id, Authentication authentication) {
        Member member = memberRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(inquiryService.getInquiryDetail(id, member));
    }

    // 비밀글 비밀번호 검증 API
    @PostMapping("/{id}/check-password")
    public ResponseEntity<InquiryDetailResponse> checkPassword(
            @PathVariable Long id,
            @RequestBody PasswordRequest request) {

        // 서비스에서 비밀번호를 검증하고, 통과하면 상세 데이터를 받아옴
        InquiryDetailResponse response = inquiryService.checkInquiryPassword(id, request.getPassword());

        // 200 OK와 함께 비밀글 상세 내용을 프론트엔드로 즉시 반환!
        return ResponseEntity.ok(response);
    }
}