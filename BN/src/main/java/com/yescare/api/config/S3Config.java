package com.yescare.api.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class S3Config {

    // 로컬 환경에서 변수가 없을 경우를 대비해 뒤에 ':local-access-key' 형태로 기본값을 둡니다.
    @Value("${cloud.aws.credentials.access-key:local-access-key}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secret-key:local-secret-key}")
    private String secretKey;

    @Value("${cloud.aws.region.static:ap-northeast-2}")
    private String region;

    @Bean
    public AmazonS3 amazonS3() {
        // 로컬 환경에서 더미 키 상태일 때 S3 빌더가 예외를 뿜지 않도록 방어 로직을 두거나,
        // 로컬 개발 시 디스크 저장용 가짜 S3 빈을 띄울 수도 있습니다.
        if ("local-access-key".equals(accessKey)) {
            // 로컬 테스트용 더미 객체를 반환하거나 기본 빌더를 반환하여 컨텍스트 로딩 실패를 막음
            return AmazonS3ClientBuilder.standard()
                    .withRegion(region)
                    .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials("dummy", "dummy")))
                    .build();
        }

        BasicAWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);

        return AmazonS3ClientBuilder.standard()
                .withRegion(region)
                .withCredentials(new AWSStaticCredentialsProvider(credentials))
                .build();
    }
}