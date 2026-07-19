package com.yescare.api.repository;

import com.yescare.api.domain.EducationApplication;
import com.yescare.api.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EducationApplicationRepository extends JpaRepository<EducationApplication, Long> {

    // WAITING 상태인 신청 건수 집계 쿼리 메서드
    long countByStatus(String status);

    Optional<EducationApplication> findTopByMemberOrderByAppliedAtDesc(Member member);
}