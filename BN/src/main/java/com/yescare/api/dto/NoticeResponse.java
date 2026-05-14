package com.yescare.api.dto;

import com.yescare.api.domain.Notice;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NoticeResponse {
    private Long id;
    private String title;
    private String content;
    private boolean important;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt; // 수정일

    public NoticeResponse(Notice notice) {
        this.id = notice.getId();
        this.title = notice.getTitle();
        this.content = notice.getContent();
        this.important = notice.isImportant();
        this.createdAt = notice.getCreatedDate();
        this.updatedAt = notice.getModifiedDate();
    }
}