package com.yescare.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReservationStatusRequest {
    private String status; // 바꿀 상태값 (예: CONFIRMED, COMPLETED 등)
}