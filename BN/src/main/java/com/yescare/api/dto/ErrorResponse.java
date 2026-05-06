package com.yescare.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor // 모든 필드를 포함하는 생성자를 자동으로 만들어줍니다.
public class ErrorResponse {
    private int status;      // HTTP 상태 코드 (예: 409)
    private String message;  // 프론트 화면에 띄워줄 친절한 메시지
}