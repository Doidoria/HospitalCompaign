package com.yescare.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.yescare.api.domain.Member;
import lombok.Getter;

@Getter
public class MemberResponse {
    private Long id;
    private String email;
    private String name;
    private String phoneNumber;
    private String role;
    private String provider;
    private String zipCode;
    private String address;
    private String detailAddress;
    private String guardianName;
    private String guardianPhone;
    private String availableDays;
    private String availableTime;

    @JsonProperty("isActive")
    private boolean isActive;

    public MemberResponse(Member member) {
        this.id = member.getId();
        this.email = member.getEmail();
        this.name = member.getName();
        this.phoneNumber = member.getPhoneNumber();
        this.role = member.getRole().name();
        this.provider = member.getProvider();
        this.zipCode = member.getZipCode();
        this.address = member.getAddress();
        this.detailAddress = member.getDetailAddress();
        this.guardianName = member.getGuardianName();
        this.guardianPhone = member.getGuardianPhone();
        this.isActive = member.isActive();

        // 매니저 정보가 있는 회원이면 요일/시간 세팅
        if (member.getManager() != null) {
            this.availableDays = member.getManager().getAvailableDays();
            this.availableTime = member.getManager().getAvailableTime();
        }
    }
}