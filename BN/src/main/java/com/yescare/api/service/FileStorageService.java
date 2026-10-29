package com.yescare.api.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

public interface FileStorageService {
    // 기존 메서드 (폴더 지정 안 할 경우 기본 작동)
    String uploadFile(MultipartFile file);

    // 원하는 하위 폴더명(subDirectory)을 받아서 저장하는 메서드
    String uploadFile(MultipartFile file, String subDirectory);

    /**
     * DB에 저장된 파일 주소 → 화면에 내려줄 접근 주소
     * - S3: 공개 폴더(popups/)는 그대로, 나머지는 일정 시간만 유효한 서명(Presigned) URL
     * - 로컬: 그대로 반환
     * ※ 반드시 서버에서 접근 권한 검사를 마친 뒤에 호출할 것
     */
    String toAccessUrl(String storedUrl);

    /** 파일 내용 읽기 (PDF 생성 등 서버 내부 용도) */
    byte[] readFile(String storedUrl);

    /** 서명 URL 등 쿼리스트링이 붙은 주소 → DB 저장 형태로 정규화 */
    default String toStoredUrl(String url) {
        if (url == null) return null;
        int q = url.indexOf('?');
        return q < 0 ? url : url.substring(0, q);
    }

    default List<String> toAccessUrls(List<String> storedUrls) {
        List<String> result = new ArrayList<>();
        if (storedUrls == null) return result;
        for (String url : storedUrls) {
            result.add(toAccessUrl(url));
        }
        return result;
    }
}
