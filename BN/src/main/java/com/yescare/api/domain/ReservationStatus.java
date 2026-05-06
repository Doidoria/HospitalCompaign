package com.yescare.api.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReservationStatus {
    WAITING("매칭 대기"),
    CONFIRMED("예약 확정"),
    COMPLETED("이용 완료"),
    CANCELLED("예약 취소");

    private final String description;
}