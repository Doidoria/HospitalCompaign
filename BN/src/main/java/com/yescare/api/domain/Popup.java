package com.yescare.api.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Popup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // 팝업 제목

    private String imageUrl; // 팝업 이미지 주소 (또는 내용)

    private String linkUrl; // 클릭 시 이동할 링크

    @JsonProperty("isActive")
    private boolean isActive; // 노출 여부 (true: 켜짐, false: 꺼짐)

    private LocalDateTime startDate; // 노출 시작일

    private LocalDateTime endDate; // 노출 종료일
}