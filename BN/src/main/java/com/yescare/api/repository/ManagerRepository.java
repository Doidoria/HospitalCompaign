package com.yescare.api.repository;

import com.yescare.api.domain.Manager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ManagerRepository extends JpaRepository<Manager, Long> {

    Optional<Manager> findByMemberId(Long memberId);

    // OOM 방지: Java(for문)가 아니라 DB에서 미리 요일, 활동 상태, 권한을 필터링해서 가져옴
    @Query("SELECT m FROM Manager m JOIN FETCH m.member mem " +
            "WHERE m.availableDays LIKE CONCAT('%', :dayOfWeek, '%')")
    List<Manager> findAvailableManagersByDay(@Param("dayOfWeek") String dayOfWeek);
}