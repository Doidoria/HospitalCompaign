package com.yescare.api.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@Profile("prod") // 배포 환경에서만 작동
public class S3FileStorageService implements FileStorageService {
    @Override
    public String uploadFile(MultipartFile file) {
        // TODO: 나중에 AWS S3 연결 후 버킷에 업로드하는 로직 작성
        return "https://yescare-bucket.s3.ap-northeast-2.amazonaws.com/" + file.getOriginalFilename();
    }
}
