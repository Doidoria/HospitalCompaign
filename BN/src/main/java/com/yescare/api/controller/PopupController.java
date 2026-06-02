package com.yescare.api.controller;

import com.yescare.api.domain.Popup;
import com.yescare.api.repository.PopupRepository;
import com.yescare.api.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PopupController {

    private final PopupRepository popupRepository;
    private final FileStorageService fileStorageService;

    // 1. [사용자 메인 페이지] 현재 활성화된 팝업 가져오기
    @GetMapping("/api/popups/active")
    public List<Popup> getActivePopups() {
        return popupRepository.findActivePopups(LocalDateTime.now());
    }

    // 2. [어드민 페이지] 모든 팝업 설정 조회
    @GetMapping("/api/admin/popups")
    public List<Popup> getAllPopups() {
        return popupRepository.findAll();
    }

    // 3. [어드민 페이지] 팝업 이미지 업로드 및 등록/수정 (FormData 처리)
    @PostMapping(value = "/api/admin/popups", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Popup createOrUpdatePopup(
            @RequestParam("title") String title,
            @RequestParam(value = "linkUrl", required = false) String linkUrl,
            @RequestParam(value = "isActive", defaultValue = "true") boolean isActive,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        // 핵심 수정: 매번 새로 만들지 말고, 기존에 저장된 팝업이 있다면 가져와서 엎어칩니다(Update).
        List<Popup> existingPopups = popupRepository.findAll();
        Popup popup;

        if (!existingPopups.isEmpty()) {
            popup = existingPopups.get(0); // 기존 팝업 데이터를 타겟으로 설정
        } else {
            popup = new Popup(); // 아예 처음 등록하는 거라면 새로 생성
            popup.setStartDate(LocalDateTime.now());
            popup.setEndDate(LocalDateTime.now().plusYears(1));
        }

        popup.setTitle(title);
        popup.setLinkUrl(linkUrl);
        popup.setActive(isActive);

        // 새 이미지가 들어왔을 때만 파일 업로드를 수행하고, 안 들어왔다면 기존의 이미지 파일명을 유지
        if (image != null && !image.isEmpty()) {
            String savedFileName = fileStorageService.uploadFile(image, "popups");
            popup.setImageUrl(savedFileName);
        }

        return popupRepository.save(popup);
    }

    // 4. [어드민 페이지] 사용 여부(상태) 즉시 변경
    @PatchMapping("/api/admin/popups/{id}/status")
    public Popup togglePopupStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        Popup popup = popupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 팝업을 찾을 수 없습니다."));

        if (payload.containsKey("isActive")) {
            popup.setActive(payload.get("isActive"));
        }
        return popupRepository.save(popup);
    }

    // 5. [어드민 페이지] 팝업 삭제
    @DeleteMapping("/api/admin/popups/{id}")
    public String deletePopup(@PathVariable Long id) {
        popupRepository.deleteById(id);
        return "팝업이 삭제되었습니다.";
    }
}