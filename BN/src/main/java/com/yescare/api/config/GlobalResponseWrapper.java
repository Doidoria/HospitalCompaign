package com.yescare.api.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yescare.api.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

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

        // 공통 ApiResponse 객체 생성
        ApiResponse<Object> apiResponse = ApiResponse.success(body);

        // 2. 컨트롤러 반환 타입이 String이거나 StringHttpMessageConverter가 선택된 경우
        // Spring 내부 내부 충돌(ClassCastException)을 방지하기 위해 ObjectMapper로 직접 JSON 변환 후 반환
        if (body instanceof String || selectedConverterType.getName().contains("StringHttpMessageConverter")) {
            response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            try {
                return objectMapper.writeValueAsString(apiResponse);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("공통 응답 포맷 직렬화 중 오류가 발생했습니다.", e);
            }
        }

        // 3. 그 외 모든 데이터 객체 자동 포장
        return apiResponse;
    }
}