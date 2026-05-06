package com.yescare.api.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class ReservationRequest {
    private String patientName;
    private String patientPhone;
    private String hospitalName;
    private LocalDateTime reservationTime;
    private String guardianName;
    private String guardianPhone;
    private String memo;
    private String requirements;
    private String detailedContent; // 상세 내용
    private String doctorInquiry;
    private String category;
    private String meetingPoint;
    private String transportation;
    private String mobility;
}