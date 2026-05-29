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

    // 1. 기존처럼 폴더 지정 없이 넘기면 기본값으로 "others" 폴더에 넣음
    @Override
    public String uploadFile(MultipartFile file) {
        return uploadFile(file, "others");
    }

    // 2. 새롭게 추가된 하위 폴더 지정 메서드
    @Override
    public String uploadFile(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) return null;

        try {
            // 저장할 폴더 경로 설정 (하위 폴더 포함)
            String uploadDir = System.getProperty("user.dir") + "/uploads/" + subDirectory + "/";
            File folder = new File(uploadDir);
            if (!folder.exists()) {
                folder.mkdirs();
            }

            // 파일명 중복을 막기 위한 UUID 생성
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String savedFilename = UUID.randomUUID().toString() + extension;
            File destFile = new File(folder, savedFilename);

            // 실제 서버 하드디스크에 파일 저장
            file.transferTo(destFile);

            // 프론트엔드가 사용할 수 있는 상대 경로 리턴
            return "/uploads/" + subDirectory + "/" + savedFilename;

        } catch (IOException e) {
            throw new RuntimeException("파일 업로드에 실패했습니다.", e);
        }
    }
}
