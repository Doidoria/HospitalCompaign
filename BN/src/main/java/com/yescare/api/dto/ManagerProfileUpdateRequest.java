package com.yescare.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ManagerProfileUpdateRequest {
    private String introduction; // 한줄 자기소개
    private String career;       // 주요 경력
    private String certifications; // 보유 자격증
    private String availableDays; // 활동 요일
    private String availableTime; // 활동 시간
}