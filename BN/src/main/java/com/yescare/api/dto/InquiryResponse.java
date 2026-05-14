package com.yescare.api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InquiryResponse {
    private Long id;
    private String title;
    private String status; // PENDING or ANSWERED
    private LocalDateTime createdAt;
}