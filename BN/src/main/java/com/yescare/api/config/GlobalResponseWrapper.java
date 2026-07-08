package com.yescare.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yescare.api.dto.ApiResponse;
import com.yescare.api.exception.RequireAccountLinkException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.core.io.Resource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.util.Map;

@RestControllerAdvice(basePackages = "com.yescare.api.controller")
@RequiredArgsConstructor
public class GlobalResponseWrapper implements ResponseBodyAdvice<Object> {

    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        // 1. 이미 ApiResponse인 경우 제외
        if (returnType.getParameterType().equals(ApiResponse.class)) return false;

        // 2. Swagger / OpenAPI 관련 경로 제외
        String className = returnType.getDeclaringClass().getName();
        if (className.contains("springdoc") || className.contains("swagger")) return false;

        return true; // 그 외 모든 API에 적용
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType,
                                  MediaType selectedContentType, Class selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {

        if (body instanceof ApiResponse) return body;
        if (body instanceof Resource || body instanceof byte[]) return body;

        // 상태 코드가 아닌, ExceptionHandler가 보낸 'message' 키를 가진 Map인지 직접 확인하여 100% 통과시킴
        if (body instanceof Map && ((Map<?, ?>) body).containsKey("message")) {
            return body;
        }

        ApiResponse<Object> apiResponse = ApiResponse.success(body);

        if (body instanceof String) {
            try {
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                return objectMapper.writeValueAsString(apiResponse);
            } catch (Exception e) {
                throw new RuntimeException("JSON 직렬화 오류", e);
            }
        }

        return apiResponse;
    }

    // 잘못된 인자나 계정 미존재(IllegalArgumentException) 발생 시 400 Bad Request와 함께 정확한 에러 메시지를 프론트엔드로 전달
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
    }

    // 계정 정지 등 상태 에러(IllegalStateException) 발생 시
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleIllegalStateException(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
    }

    // 계정 연동 예외 발생 시, 409 Conflict 상태 코드와 함께 토큰/이메일을 안정적으로 전달
    @ExceptionHandler(RequireAccountLinkException.class)
    public ResponseEntity<?> handleRequireAccountLinkException(RequireAccountLinkException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT) // 409 에러
                .body(Map.of(
                        "message", e.getMessage(),
                        "tempToken", e.getTempToken(), // 프론트에서 연동 승인 시 사용할 토큰
                        "email", e.getEmail()
                ));
    }

    // DB 유니크 제약조건(이메일, 연락처 중복 등) 충돌 발생 시 409 에러와 한글 메시지 반환
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "이미 가입된 이메일이거나 사용 중인 휴대폰 번호입니다. 카카오 로그인 또는 다른 정보로 시도해 주세요."));
    }
}