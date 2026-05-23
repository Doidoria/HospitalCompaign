package com.yescare.api.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminReservationUpdateRequest {
    private String hospitalName;
    private LocalDateTime reservationTime;
    private String meetingPoint;
    private String transportation;
    private String mobility;
    private String requirements;
    private String detailedContent;
    private String doctorInquiry;
}