package com.yescare.api.dto;

import com.yescare.api.domain.Member;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class MemberResponse {
    private Long id;
    private String email;
    private String name;
    private String phoneNumber;
    private String role;
    private String zipCode;
    private String address;
    private String detailAddress;
    private String guardianName;
    private String guardianPhone;

    @JsonProperty("isActive")
    private boolean isActive;

    public MemberResponse(Member member) {
        this.id = member.getId();
        this.email = member.getEmail();
        this.name = member.getName();
        this.phoneNumber = member.getPhoneNumber();
        this.role = member.getRole().name();
        this.zipCode = member.getZipCode();
        this.address = member.getAddress();
        this.detailAddress = member.getDetailAddress();
        this.guardianName = member.getGuardianName();
        this.guardianPhone = member.getGuardianPhone();
        this.isActive = member.isActive();
    }
}