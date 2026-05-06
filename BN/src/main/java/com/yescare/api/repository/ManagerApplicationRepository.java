package com.yescare.api.repository;

import com.yescare.api.domain.ManagerApplication;
import com.yescare.api.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ManagerApplicationRepository extends JpaRepository<ManagerApplication, Long> {
    Optional<ManagerApplication> findByMember(Member member);
    Optional<ManagerApplication> findByMember_Id(Long memberId);

    // (특정 상태의 지원서만 가져오는 돋보기 역할)
    List<ManagerApplication> findByStatus(String status);
}