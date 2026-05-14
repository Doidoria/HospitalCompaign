package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notice extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private boolean important; // 중요 공지 여부

    @Builder
    public Notice(String title, String content, boolean important) {
        this.title = title;
        this.content = content;
        this.important = important;
    }

    // 수정 비즈니스 로직 (Setter 대신 사용)
    public void updateNotice(String title, String content, boolean important) {
        this.title = title;
        this.content = content;
        this.important = important;
    }
}