package com.yescare.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {
    private String token; // 발급된 JWT 토큰이 여기에 담깁니다.
}