package com.yescare.api.repository;

import com.yescare.api.domain.Inquiry;
import com.yescare.api.domain.InquiryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    // 유저 본인의 문의 조회용 (기존에 있다면 유지)
    List<Inquiry> findByMemberIdOrderByIdDesc(Long memberId);

    // 관리자용: 전체 문의 최신순 페이징 조회
    Page<Inquiry> findAllByOrderByIdDesc(Pageable pageable);

    // 관리자용: 상태별(PENDING/ANSWERED) 문의 최신순 페이징 조회
    Page<Inquiry> findByStatusOrderByIdDesc(InquiryStatus status, Pageable pageable);
}