package com.yescare.api.repository;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Reservation;
import com.yescare.api.domain.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // 회원의 특정 시간대 예약이 존재하는지 확인하는 쿼리
    boolean existsByMemberAndReservationTime(Member member, LocalDateTime time);

    // 메서드 이름만 잘 지어도 스프링이 "Member 테이블까지 조인해서 email로 찾아줄게!" 하고 SQL을 자동 생성합니다.
    List<Reservation> findByMemberEmail(String email);

    // 상태값(WAITING)으로 예약 찾기
    List<Reservation> findByStatus(ReservationStatus status);

    // 매니저의 이메일로 배정된 예약 찾기
    List<Reservation> findByManagerEmail(String email);

    // 환자명 또는 병원명으로 검색 (대소문자 무관, 부분 일치)
    Page<Reservation> findByPatientNameContainingIgnoreCaseOrHospitalNameContainingIgnoreCase(
            String patientName, String hospitalName, Pageable pageable);

    @Query("SELECT r FROM Reservation r WHERE " +
            "(:status IS NULL OR r.status = :status) AND " +
            "(:keyword IS NULL OR :keyword = '' OR LOWER(r.patientName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(r.hospitalName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Reservation> searchByKeywordAndStatus(@Param("keyword") String keyword, @Param("status") ReservationStatus status, Pageable pageable);
}