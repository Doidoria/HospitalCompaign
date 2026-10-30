package com.yescare.api.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PasswordChangeRequest {
    private String currentPassword; // 일반 가입 회원은 필수 (카카오 회원은 비어 있음)
    private String newPassword;
}