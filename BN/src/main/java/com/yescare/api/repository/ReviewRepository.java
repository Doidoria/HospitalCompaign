package com.yescare.api.repository;

import com.yescare.api.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByReservationId(Long reservationId);

    // 해당 매니저(예약에 배정된 매니저)가 받은 모든 리뷰 조회
    List<Review> findByReservation_ManagerId(Long managerId);
}