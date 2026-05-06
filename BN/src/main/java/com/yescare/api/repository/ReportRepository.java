package com.yescare.api.repository;

import com.yescare.api.domain.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {
    // 예약 ID로 리포트를 찾는 기능이 필요합니다. (조회용)
    Optional<Report> findByReservationId(Long reservationId);
}