package com.yescare.api.dto;

import com.yescare.api.domain.Report;
import lombok.Getter;

@Getter
public class ReportResponse {
    private Long id;
    private String hospitalName;
    private String patientName;
    private String date;
    private String department;
    private String doctorOpinion;
    private String prescription;
    private String managerName;
    private String managerComment;
    private String nextSchedule;
    private String patientCondition;
    private boolean isModified;

    public ReportResponse(Report entity) {
        this.id = entity.getId();
        this.hospitalName = entity.getReservation().getHospitalName();
        this.patientName = entity.getReservation().getPatientName();
        this.date = entity.getReservation().getReservationTime().toString();
        this.department = entity.getDepartment();
        this.doctorOpinion = entity.getDoctorOpinion();
        this.prescription = entity.getPrescription();
        this.managerName = entity.getReservation().getManager() != null
                ? entity.getReservation().getManager().getName()
                : "담당 매니저";
        this.managerComment = entity.getManagerComment();
        this.nextSchedule = entity.getNextSchedule();
        this.patientCondition = entity.getPatientCondition();
        this.isModified = entity.isModified();
    }
}