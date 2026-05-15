package com.yescare.api.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@Profile("local") // 로컬 환경에서만 작동
public class LocalFileStorageService implements FileStorageService {
    @Override
    public String uploadFile(MultipartFile file) {
        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        return "http://localhost:8080/uploads/" + file.getOriginalFilename();
    }
}
