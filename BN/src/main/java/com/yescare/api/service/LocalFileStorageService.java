package com.yescare.api.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
@Profile("local") // 로컬 환경에서만 작동
public class LocalFileStorageService implements FileStorageService {

    @Override
    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        try {
            // 1. 저장할 폴더 경로 설정 및 생성 (디렉토리가 없으면 만듦)
            String uploadDir = System.getProperty("user.dir") + "/uploads/";
            File folder = new File(uploadDir);
            if (!folder.exists()) {
                folder.mkdirs();
            }

            // 2. 파일명 중복을 막기 위한 UUID 생성 (안전한 파일 확장자 추출 로직)
            String originalFilename = file.getOriginalFilename();
            String extension = ""; // 기본 확장자 (없을 경우)

            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String savedFilename = UUID.randomUUID().toString() + extension;

            File destFile = new File(folder, savedFilename);

            // 3. 실제 서버 하드디스크에 파일 저장
            file.transferTo(destFile);

            // 4. DB에 저장될 가상 경로 반환
            return "/uploads/" + savedFilename;

        } catch (IOException e) {
            throw new RuntimeException("파일 저장에 실패했습니다.", e);
        }
    }
}
