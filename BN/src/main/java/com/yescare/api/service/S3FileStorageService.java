package com.yescare.api.service;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;

@Service
@Profile("prod")
@RequiredArgsConstructor
public class S3FileStorageService implements FileStorageService {

    // 비로그인 방문자에게도 보여야 하는 공개 폴더 (버킷 정책에서도 이 폴더만 공개)
    private static final String PUBLIC_PREFIX = "popups/";
    // 서명 URL 유효 시간
    private static final Duration PRESIGNED_TTL = Duration.ofMinutes(30);

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
            amazonS3.putObject(new PutObjectRequest(bucket, s3FileName, file.getInputStream(), metadata));
        } catch (IOException e) {
            throw new RuntimeException("S3 파일 업로드에 실패했습니다.", e);
        }

        // DB에는 서명 없는 기본 주소를 저장 (화면 응답 시 toAccessUrl로 변환)
        return amazonS3.getUrl(bucket, s3FileName).toString();
    }

    @Override
    public String toAccessUrl(String storedUrl) {
        if (storedUrl == null || storedUrl.isBlank()) return storedUrl;

        String key = extractKey(storedUrl);
        if (key == null || key.startsWith(PUBLIC_PREFIX)) {
            return storedUrl; // 우리 버킷 파일이 아니거나 공개 폴더면 그대로
        }

        Date expiration = new Date(System.currentTimeMillis() + PRESIGNED_TTL.toMillis());
        return amazonS3.generatePresignedUrl(bucket, key, expiration, HttpMethod.GET).toString();
    }

    @Override
    public byte[] readFile(String storedUrl) {
        String key = extractKey(storedUrl);
        if (key == null) {
            throw new IllegalArgumentException("읽을 수 없는 파일 주소입니다.");
        }
        try (S3Object object = amazonS3.getObject(bucket, key);
             InputStream in = object.getObjectContent()) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new RuntimeException("S3 파일 읽기에 실패했습니다.", e);
        }
    }

    /** 저장된 S3 주소에서 객체 키(예: reports/uuid.jpg) 추출. 우리 버킷 주소가 아니면 null */
    private String extractKey(String url) {
        try {
            URI uri = URI.create(toStoredUrl(url));
            String host = uri.getHost();
            String path = uri.getPath(); // 디코딩된 경로 (예: /reports/uuid.jpg)
            if (host == null || path == null || path.length() <= 1) return null;

            // 가상 호스트 방식: https://{bucket}.s3.{region}.amazonaws.com/{key}
            if (host.startsWith(bucket + ".")) {
                return path.substring(1);
            }
            // 경로 방식: https://s3.{region}.amazonaws.com/{bucket}/{key}
            String bucketPrefix = "/" + bucket + "/";
            if (path.startsWith(bucketPrefix)) {
                return path.substring(bucketPrefix.length());
            }
            return null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
