package com.yescare.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 🌟 "/uploads/**" 주소로 요청이 오면, C드라이브의 해당 폴더에서 파일을 찾아줍니다.
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}