package com.yescare.api.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class InquiryRequest {
    private String category;
    private String title;
    private String content;
    private boolean isPrivate;
    private String password;
    private List<MultipartFile> images; // 이미지 파일들
}
