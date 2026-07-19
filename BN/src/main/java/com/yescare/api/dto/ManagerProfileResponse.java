package com.yescare.api.dto;

import com.yescare.api.domain.Manager;
import com.yescare.api.domain.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerProfileResponse {
    private Long id;
    private String name;
    private String certifications;
    private String career;
    private String introduction;
    private double averageRating; // 평균 평점
    private int reviewCount;      // 리뷰 개수
    private String availableDays;
    private String availableTime;
    private String address;

    public ManagerProfileResponse(Manager manager) {
        this.id = manager.getId();
        this.name = manager.getMember().getName(); // Member 엔티티에서 이름 가져오기
        this.certifications = manager.getCertifications();
        this.career = manager.getCareer();
        this.introduction = manager.getIntroduction();
        this.averageRating = 0.0; // 당장 에러를 막기 위해 기본값 0 처리
        this.reviewCount = 0;     // 당장 에러를 막기 위해 기본값 0 처리
        this.availableDays = manager.getAvailableDays();
        this.availableTime = manager.getAvailableTime();
        this.address = manager.getMember().getAddress();
    }

    // Entity들을 받아 DTO로 변환하는 정적 메서드
    public static ManagerProfileResponse of(Member manager, String certifications, String career, String introduction,
                                            double avgRating, int reviewCount, String availableDays, String availableTime) {
        return ManagerProfileResponse.builder()
                .id(manager.getId())
                .name(manager.getName())
                .certifications(certifications)
                .career(career)
                .introduction(introduction)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .reviewCount(reviewCount)
                .availableDays(availableDays)
                .availableTime(availableTime)
                .address(manager.getAddress())
                .build();
    }
}