package com.yescare.api.repository;

import com.yescare.api.domain.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // 중요(important)가 true인 것 먼저, 그 다음 생성일(CreatedDate) 내림차순 정렬
    Page<Notice> findAllByOrderByImportantDescCreatedDateDesc(Pageable pageable);
}