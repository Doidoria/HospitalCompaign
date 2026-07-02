package com.yescare.api.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@Profile("prod")
@RequiredArgsConstructor
public class S3FileStorageService implements FileStorageService {

    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Override
    public String uploadFile(MultipartFile file) {
        return uploadFile(file, "others");
    }

    @Override
    public String uploadFile(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) return null;

        // 원본 파일명에서 확장자 추출 후 안전한 UUID 파일명 생성
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String savedFilename = UUID.randomUUID().toString() + extension;

        // S3에 저장될 최종 경로 (예: popups/1234-abcd.jpg)
        String s3FileName = subDirectory + "/" + savedFilename;

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());

        try {
            // 실제 S3로 파일 전송!
            amazonS3.putObject(new PutObjectRequest(bucket, s3FileName, file.getInputStream(), metadata));
        } catch (IOException e) {
            throw new RuntimeException("S3 파일 업로드에 실패했습니다.", e);
        }

        // 정상적으로 업로드된 후, 접근 가능한 S3 URL 반환
        return amazonS3.getUrl(bucket, s3FileName).toString();
    }
}