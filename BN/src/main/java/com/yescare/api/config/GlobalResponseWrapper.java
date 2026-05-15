package com.yescare.api.config;

import com.yescare.api.dto.ApiResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@RestControllerAdvice(basePackages = "com.example.yescare.controller") // 컨트롤러가 있는 패키지명으로 변경
public class GlobalResponseWrapper implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        // 1. 이미 ApiResponse인 경우 제외
        if (returnType.getParameterType().equals(ApiResponse.class)) return false;

        // 2. Swagger / OpenAPI 관련 경로 제외 (추가해 두면 좋습니다)
        String className = returnType.getDeclaringClass().getName();
        if (className.contains("springdoc") || className.contains("swagger")) return false;

        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType,
                                  MediaType selectedContentType, Class selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {

        // 1. 이미 ApiResponse 형태면 그냥 통과
        if (body instanceof ApiResponse) {
            return body;
        }

        // 2. 문자열(String)을 반환할 때는 ClassCastException 방지를 위해 원본 반환 또는 수동 처리
        if (body instanceof String) {
            // String 타입은 여기서 감싸면 Spring 내부의 StringHttpMessageConverter와 충돌할 수 있으므로
            // 컨트롤러에서 직접 ApiResponse.success()로 감싸는 것을 권장합니다.
            return body;
        }

        // 3. 그 외 모든 데이터(List, DTO 등)를 ApiResponse.success() 껍데기로 자동 포장!
        return ApiResponse.success(body);
    }
}
