package com.yescare.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberJoinRequest {
    private String email;
    private String password;
    private String name;
    private String phoneNumber;
    private String zipCode;
    private String address;
    private String detailAddress;
    private String guardianName;
    private String guardianPhone;;
}