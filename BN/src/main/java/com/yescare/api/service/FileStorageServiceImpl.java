package com.yescare.api.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    // 이미지가 실제로 저장될 폴더 경로 (프로젝트 루트 경로 아래에 uploads 폴더 생성)
    private final String UPLOAD_DIR = "uploads/";

    @Override
    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            // 1. uploads 폴더가 없으면 자동으로 생성
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // 2. 파일 이름이 겹치지 않도록 UUID 암호화 (안전한 파일 확장자 추출 로직)
            String originalFilename = file.getOriginalFilename();
            String extension = ""; // 기본 확장자 (없을 경우)

            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String savedFilename = UUID.randomUUID().toString() + extension;

            // 3. 실제 하드디스크에 파일 쓰기 (저장)
            Path path = Paths.get(UPLOAD_DIR + savedFilename);
            Files.write(path, file.getBytes());

            // 4. DB에 저장할 파일 이름만 프론트에 반환
            return savedFilename;

        } catch (IOException e) {
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다.", e);
        }
    }
}