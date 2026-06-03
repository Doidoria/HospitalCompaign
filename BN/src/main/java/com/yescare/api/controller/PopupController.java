package com.yescare.api.controller;

import com.yescare.api.domain.Popup;
import com.yescare.api.repository.PopupRepository;
import com.yescare.api.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> createOrUpdatePopup(
            @RequestParam(value = "id", required = false) Long id, // 추가: id 유무로 생성/수정 구분
            @RequestParam("title") String title,
            @RequestParam(value = "linkUrl", required = false) String linkUrl,
            @RequestParam(value = "isActive", defaultValue = "true") boolean isActive,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        Popup popup;

        if (id != null) {
            // 수정 로직
            popup = popupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("해당 팝업을 찾을 수 없습니다."));
        } else {
            // 생성 로직 (최대 3개 제한)
            long count = popupRepository.count();
            if (count >= 3) {
                return ResponseEntity.badRequest().body("팝업은 최대 3개까지만 등록 가능합니다.");
            }
            popup = new Popup();
            popup.setStartDate(LocalDateTime.now());
            popup.setEndDate(LocalDateTime.now().plusYears(1));
        }

        popup.setTitle(title);
        popup.setLinkUrl(linkUrl);
        popup.setActive(isActive);

        if (image != null && !image.isEmpty()) {
            String savedFileName = fileStorageService.uploadFile(image, "popups");
            popup.setImageUrl(savedFileName);
        }

        return ResponseEntity.ok(popupRepository.save(popup));
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