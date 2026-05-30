package com.yescare.api.dto;

import com.yescare.api.domain.ManagerApplication;
import lombok.Getter;

@Getter
public class ManagerAppResponse {
    private Long id;
    private Long memberId;
    private String name;
    private String phone;
    private String licenseName;
    private String applyDate;
    private String certificateUrl;
    private String availableDays;
    private String availableTime;
    private String rejectReason; // 반려 사유 필드

    public ManagerAppResponse(ManagerApplication entity) {
        this.id = entity.getId();
        this.memberId = entity.getMember().getId(); // 승인할 때 이 회원 번호가 필요합니다.
        this.name = entity.getMember().getName();
        this.phone = entity.getMember().getPhoneNumber();
        this.licenseName = entity.getLicenseName();
        this.applyDate = entity.getAppliedAt().toLocalDate().toString();
        this.certificateUrl = entity.getCertificateUrl();
        this.availableDays = entity.getAvailableDays();
        this.availableTime = entity.getAvailableTime();
        this.rejectReason = entity.getRejectionReason();
    }
}