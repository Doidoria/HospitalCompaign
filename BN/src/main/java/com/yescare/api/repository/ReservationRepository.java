package com.yescare.api.repository;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Reservation;
import com.yescare.api.domain.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // 회원의 특정 시간대 예약이 존재하는지 확인하는 쿼리
    boolean existsByMemberAndReservationTime(Member member, LocalDateTime time);

    // Member, Manager, Review를 Fetch Join(EntityGraph)으로 한 번에 조회하여 N+1 문제 해결
    @EntityGraph(attributePaths = {"member", "manager", "review"})
    List<Reservation> findByMemberEmail(String email);

    @EntityGraph(attributePaths = {"member", "manager", "review"})
    List<Reservation> findByStatus(ReservationStatus status);

    @EntityGraph(attributePaths = {"member", "manager", "review"})
    List<Reservation> findByManagerEmail(String email);

    List<Reservation> findByManagerEmailOrderByReservationTimeAsc(String email);

    @EntityGraph(attributePaths = {"member", "manager", "review"})
    Page<Reservation> findByPatientNameContainingIgnoreCaseOrHospitalNameContainingIgnoreCase(
            String patientName, String hospitalName, Pageable pageable);

    @EntityGraph(attributePaths = {"member", "manager", "review"})
    @Query("SELECT r FROM Reservation r WHERE " +
            "(:status IS NULL OR r.status = :status) AND " +
            "(:keyword IS NULL OR :keyword = '' OR LOWER(r.patientName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(r.hospitalName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Reservation> searchByKeywordAndStatus(@Param("keyword") String keyword, @Param("status") ReservationStatus status, Pageable pageable);

    // 기본 JpaRepository의 findAll을 오버라이드하여 엔티티 그래프 적용
    @Override
    @EntityGraph(attributePaths = {"member", "manager", "review"})
    Page<Reservation> findAll(Pageable pageable);

    // 특정 매니저의 '해당 날짜(startOfDay ~ endOfDay)' 확정/진행중 예약만 싹 가져오는 쿼리
    @Query("SELECT r FROM Reservation r " +
            "WHERE r.manager = :manager " +
            "AND r.reservationTime >= :startOfDay AND r.reservationTime <= :endOfDay")
    List<Reservation> findManagerDailySchedules(
            @Param("manager") Member manager,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("SELECT r FROM Reservation r " +
            "LEFT JOIN FETCH r.manager " + // 매니저 이름 출력을 위해 Fetch Join
            "WHERE r.status = 'COMPLETED' " +
            "AND r.reservationTime >= :startDate AND r.reservationTime <= :endDate " +
            "ORDER BY r.reservationTime ASC")
    List<Reservation> findCompletedReservationsByPeriod(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}