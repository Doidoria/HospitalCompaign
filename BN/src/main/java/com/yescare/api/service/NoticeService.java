package com.yescare.api.service;

import com.yescare.api.domain.Notice;
import com.yescare.api.dto.NoticeRequest;
import com.yescare.api.dto.NoticeResponse;
import com.yescare.api.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;

    // 공지사항 전체 조회 (일반 유저, 관리자 공용)
    public Page<NoticeResponse> getAllNotices(Pageable pageable) {
        return noticeRepository.findAllByOrderByImportantDescCreatedDateDesc(pageable)
                .map(NoticeResponse::new);
    }

    // 공지사항 상세 조회
    public NoticeResponse getNoticeDetail(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공지사항입니다."));
        return new NoticeResponse(notice);
    }

    // 공지사항 작성
    @Transactional
    public Long createNotice(NoticeRequest request) {
        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .important(request.isImportant())
                .build();
        return noticeRepository.save(notice).getId();
    }

    // 공지사항 수정
    @Transactional
    public void updateNotice(Long id, NoticeRequest request) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공지사항입니다."));
        // 더티 체킹으로 자동 UPDATE
        notice.updateNotice(request.getTitle(), request.getContent(), request.isImportant());
    }

    // 공지사항 삭제
    @Transactional
    public void deleteNotice(Long id) {
        noticeRepository.deleteById(id);
    }
}