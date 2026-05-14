package com.yescare.api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class InquiryDetailResponse {
    private Long id;
    private String category; // 한국어 변환은 프론트에서 처리
    private String title;
    private String content;
    private String status;
    private List<String> imageUrls;
    private String answer; // 관리자 답변
    private String createdAt;
}