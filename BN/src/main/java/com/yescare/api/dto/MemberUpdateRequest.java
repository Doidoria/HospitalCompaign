package com.yescare.api.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberUpdateRequest {
    private String name;
    private String phoneNumber;
    private String zipCode;
    private String address;
    private String detailAddress;
    private String guardianName;
    private String guardianPhone;
}