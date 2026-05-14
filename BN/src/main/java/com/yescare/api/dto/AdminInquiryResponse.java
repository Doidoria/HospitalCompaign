package com.yescare.api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminInquiryResponse {
    private Long id;
    private String category;
    private String title;
    private String authorName;  // 작성자 이름
    private String authorEmail; // 작성자 이메일
    private String status;
    private LocalDateTime createdAt;
}