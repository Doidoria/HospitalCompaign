package com.yescare.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yescare.api.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.core.io.Resource;
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

        return true; // 그 외 모든 API에 적용
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType,
                                  MediaType selectedContentType, Class selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {

        // 1. 이미 ApiResponse 형태면 그냥 통과
        if (body instanceof ApiResponse) {
            return body;
        }

        // 2. 엑셀 다운로드나 이미지 반환 등 바이너리 데이터(Resource, byte[])는 래핑하지 않음
        if (body instanceof Resource || body instanceof byte[]) {
            return body;
        }

        // 3. 공통 ApiResponse 객체 생성
        ApiResponse<Object> apiResponse = ApiResponse.success(body);

        // 4. 우아한 해결책: 컨트롤러가 String을 반환할 때만 직접 직렬화하고, 나머지는 객체 반환
        if (body instanceof String) {
            try {
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                return objectMapper.writeValueAsString(apiResponse);
            } catch (Exception e) {
                throw new RuntimeException("JSON 직렬화 오류", e);
            }
        }

        // String이 아닌 객체(DTO, Long 등)는 그대로 반환하면 스프링(Jackson)이 알아서 처리함
        return apiResponse;
    }
}