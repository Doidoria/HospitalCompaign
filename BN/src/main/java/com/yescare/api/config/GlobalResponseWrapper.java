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

import java.io.IOException;
import java.nio.charset.StandardCharsets;

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

        // 4. Spring의 타입별 엄격한 직렬화(Map, List, Number 등) 충돌을 원천 차단하기 위해
        // 래퍼 단에서 직접 JSON으로 변환 후 OutputStream 에 꽂아버림
        try {
            response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            String jsonString = objectMapper.writeValueAsString(apiResponse);

            response.getBody().write(jsonString.getBytes(StandardCharsets.UTF_8));
            response.getBody().flush();

            // 직접 응답을 작성했으므로 null을 반환하여 Spring의 기본 처리(Jackson)를 중단시킴
            return null;
        } catch (IOException e) {
            throw new RuntimeException("공통 응답 포맷 직렬화 중 오류가 발생했습니다.", e);
        }
    }
}