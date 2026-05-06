package com.yescare.api.repository;

import com.yescare.api.domain.Manager;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ManagerRepository extends JpaRepository<Manager, Long> {
    Optional<Manager> findByMemberId(Long memberId);
}