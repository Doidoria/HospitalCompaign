package com.yescare.api.dto;

import com.yescare.api.domain.Report;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class ReportResponse {
    private Long id;
    private String hospitalName;
    private String patientName;
    private String date;
    private String department;
    private String doctorOpinion;
    private String prescription;
    private String medicationType;
    private String medicationTime;
    private Integer medicationDays;
    private String managerName;
    private String patientCondition;
    private String nextSchedule;
    private String managerComment;
    private boolean isModified;
    private boolean noNextSchedule;

    private List<String> imageUrls = new ArrayList<>();

    public ReportResponse(Report entity) {
        this.id = entity.getId();
        this.hospitalName = entity.getReservation().getHospitalName();
        this.patientName = entity.getReservation().getPatientName();
        this.date = entity.getReservation().getReservationTime().toString();
        this.department = entity.getDepartment();
        this.doctorOpinion = entity.getDoctorOpinion();
        this.prescription = entity.getPrescription();
        this.medicationType = entity.getMedicationType();
        this.medicationTime = entity.getMedicationTime();
        this.medicationDays = entity.getMedicationDays();

        this.managerName = entity.getReservation().getManager() != null
                ? entity.getReservation().getManager().getName()
                : "담당 매니저";
        this.patientCondition = entity.getPatientCondition();
        this.isModified = entity.isModified();
        this.nextSchedule = entity.getNextSchedule();
        this.managerComment = entity.getManagerComment();
        if (entity.getImageUrls() != null) {
            this.imageUrls = new ArrayList<>(entity.getImageUrls());
        }
    }
}