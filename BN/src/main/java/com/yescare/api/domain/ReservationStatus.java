package com.yescare.api.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReservationStatus {
    PAYMENT_PENDING("결제 대기"), // 매니저 대리 신청 후 보호자 선결제 전
    WAITING("매칭 대기"),
    CONFIRMED("예약 확정"),
    IN_PROGRESS("동행 진행 중"),
    COMPLETED("이용 완료"),
    CANCELLED("예약 취소");

    private final String description;
}