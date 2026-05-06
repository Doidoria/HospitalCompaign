package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 예약에 대한 리포트인지 연결 (1:1 관계)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @Column(length = 50)
    private String department;    // 진료 과목 (예: 내과, 정형외과)

    @Column(columnDefinition = "TEXT")
    private String doctorOpinion; // 의사 소견

    @Column(columnDefinition = "TEXT")
    private String prescription;  // 처방 및 복약 안내

    @Column(columnDefinition = "TEXT")
    private String managerComment; // 매니저 동행 코멘트

    private String nextSchedule;   // 다음 내원 일정

    @Column(length = 20)
    private String patientCondition; // 당일 환자 컨디션

    @Builder
    public Report(Reservation reservation, String department, String doctorOpinion, String prescription,
                  String managerComment, String nextSchedule, String patientCondition) {
        this.reservation = reservation;
        this.department = department;
        this.doctorOpinion = doctorOpinion;
        this.prescription = prescription;
        this.managerComment = managerComment;
        this.nextSchedule = nextSchedule;
        this.patientCondition = patientCondition;
    }

    // 이미 존재하는 리포트의 내용을 덮어쓰는 메서드
    public void updateReport(String department, String doctorOpinion, String prescription,
                             String managerComment, String nextSchedule, String patientCondition) {
        this.department = department;
        this.doctorOpinion = doctorOpinion;
        this.prescription = prescription;
        this.managerComment = managerComment;
        this.nextSchedule = nextSchedule;
        this.patientCondition = patientCondition;
    }
}