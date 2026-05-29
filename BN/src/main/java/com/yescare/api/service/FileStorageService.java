package com.yescare.api.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    // 기존 메서드 (폴더 지정 안 할 경우 기본 작동)
    String uploadFile(MultipartFile file);

    // 원하는 하위 폴더명(subDirectory)을 받아서 저장하는 메서드
    String uploadFile(MultipartFile file, String subDirectory);
}
