package com.yescare.api.exception;

import com.yescare.api.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice // 프로젝트 내의 모든 컨트롤러에서 발생하는 에러를 여기서 감시합니다!
public class GlobalExceptionHandler {

    // IllegalStateException 에러가 터지면 이 메서드가 실행됩니다.
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException e) {

        // 에러 상자에 409(CONFLICT) 상태 코드와 Service에서 적어둔 에러 메시지를 담습니다.
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                e.getMessage() // "이미 가입된 이메일입니다."
        );

        // 프론트엔드에게 409 상태 코드와 함께 예쁜 JSON을 반환합니다.
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    // 로그인 실패(아이디/비번 틀림) 에러를 낚아채서 401(Unauthorized) 코드로 반환
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException e) {

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(), // 400: 잘못된 요청 (프론트에서 튕겨내지 않음)
                e.getMessage()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
}