package com.yescare.api.dto;

import com.yescare.api.domain.Inquiry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InquiryResponse {

    private Long id;
    private String title;
    private String status;
    private LocalDateTime createdAt;
    private boolean isPrivate;

    // 우리가 만든 커스텀 생성자
    public InquiryResponse(Inquiry inquiry) {
        this.id = inquiry.getId();
        this.title = inquiry.getTitle();
        this.status = inquiry.getStatus().name();
        this.createdAt = inquiry.getCreatedDate();
        this.isPrivate = inquiry.isPrivate();
    }
}