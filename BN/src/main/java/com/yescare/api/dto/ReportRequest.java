package com.yescare.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {
    private Long reservationId;
    private String department;
    private String doctorOpinion;
    private String prescription;
    private String managerComment;
    private String nextSchedule;
    private String patientCondition;
    private Boolean noNextSchedule;
}