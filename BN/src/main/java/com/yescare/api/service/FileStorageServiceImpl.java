package com.yescare.api.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

//@Service
//@Profile("dev") // 개발 환경에서만 작동하도록 변경
public class FileStorageServiceImpl implements FileStorageService {

    // 최상위 기본 업로드 폴더
    private final String BASE_UPLOAD_DIR = "uploads/";

    // 1. 기존처럼 폴더 지정 없이 넘기면 기본값으로 "others" 폴더에 넣음
    @Override
    public String uploadFile(MultipartFile file) {
        return uploadFile(file, "others");
    }

    // 2. 하위 폴더 지정 저장 메서드
    @Override
    public String uploadFile(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            // 예: "uploads/" + "inquiries" + "/" -> "uploads/inquiries/"
            String targetDirPath = BASE_UPLOAD_DIR + subDirectory + "/";

            // 폴더가 없으면 지정한 하위 폴더까지 한 번에 생성 (mkdirs)
            File directory = new File(targetDirPath);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // 파일 이름 생성
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String savedFilename = UUID.randomUUID().toString() + extension;

            // 실제 파일 쓰기
            Path path = Paths.get(targetDirPath + savedFilename);
            Files.write(path, file.getBytes());

            // 프론트엔드가 사용할 수 있도록 /uploads/inquiries/파일명.png 로 리턴
            return "/" + BASE_UPLOAD_DIR + subDirectory + "/" + savedFilename;

        } catch (IOException e) {
            throw new RuntimeException("파일 업로드에 실패했습니다.", e);
        }
    }
}