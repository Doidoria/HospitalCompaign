package com.yescare.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {
    private Long reservationId;
    private String department;
    private String doctorOpinion;
    private String prescription;
    private String medicationType;
    private String medicationTime;
    private Integer medicationDays;
    private String managerComment;
    private String nextSchedule;
    private String patientCondition;
    private Boolean noNextSchedule;
}