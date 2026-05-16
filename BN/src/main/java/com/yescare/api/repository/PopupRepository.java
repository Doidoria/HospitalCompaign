package com.yescare.api.repository;

import com.yescare.api.domain.Popup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PopupRepository extends JpaRepository<Popup, Long> {

    // 사용자 메인 페이지용: 현재 시간이 시작일과 종료일 사이에 있고, 활성화(isActive=true)된 팝업만 가져오기
    @Query("SELECT p FROM Popup p WHERE p.isActive = true AND p.startDate <= :now AND p.endDate >= :now")
    List<Popup> findActivePopups(@Param("now") LocalDateTime now);
}