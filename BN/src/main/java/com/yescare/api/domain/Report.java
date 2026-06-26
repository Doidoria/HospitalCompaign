package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @Column(length = 50)
    private String department;

    @Column(columnDefinition = "TEXT")
    private String doctorOpinion;

    @Column(columnDefinition = "TEXT")
    private String prescription;

    @Column(length = 50)
    private String medicationType;

    @Column(length = 50)
    private String medicationTime;

    private Integer medicationDays; // 일수는 숫자로 저장

    @Column(columnDefinition = "TEXT")
    private String managerComment;

    private String nextSchedule;

    @ElementCollection
    @CollectionTable(name = "report_images", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "image_url")
    private List<String> imageUrls = new ArrayList<>();

    @Column(length = 20)
    private String patientCondition;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isModified = false;

    // Builder 파라미터에 복약 3종 추가
    @Builder
    public Report(Reservation reservation, String department, String doctorOpinion, String prescription,
                  String medicationType, String medicationTime, Integer medicationDays,
                  String managerComment, String nextSchedule, List<String> imageUrls, String patientCondition) {
        this.reservation = reservation;
        this.department = department;
        this.doctorOpinion = doctorOpinion;
        this.prescription = prescription;
        this.medicationType = medicationType;
        this.medicationTime = medicationTime;
        this.medicationDays = medicationDays;
        this.managerComment = managerComment;
        this.nextSchedule = nextSchedule;
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        this.patientCondition = patientCondition;
    }

    // updateReport 파라미터 및 로직에 복약 3종 추가
    public void updateReport(String department, String doctorOpinion, String prescription,
                             String medicationType, String medicationTime, Integer medicationDays,
                             String managerComment, String nextSchedule, List<String> imageUrls, String patientCondition) {
        this.department = department;
        this.doctorOpinion = doctorOpinion;
        this.prescription = prescription;
        this.medicationType = medicationType;
        this.medicationTime = medicationTime;
        this.medicationDays = medicationDays;
        this.managerComment = managerComment;
        this.nextSchedule = nextSchedule;
        this.patientCondition = patientCondition;

        this.imageUrls.clear();
        if (imageUrls != null && !imageUrls.isEmpty()) {
            this.imageUrls.addAll(imageUrls);
        }
    }

    public boolean isModified() {
        return this.isModified;
    }

    public void setModified(boolean modified) {
        this.isModified = modified;
    }
}