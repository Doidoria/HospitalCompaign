package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete; // 🌟 추가됨
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE reservations SET status = 'CANCELLED' WHERE id = ?")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String patientName;

    @Column(length = 20)
    private String patientPhone;

    @Column(nullable = false, length = 100)
    private String hospitalName;

    @Column(nullable = false)
    private LocalDateTime reservationTime;

    @Column(length = 50)
    private String guardianName;

    @Column(length = 20)
    private String guardianPhone;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(length = 50)
    private String category; // 일반 진료 / 정밀 검사

    @Column(length = 200)
    private String meetingPoint; // 만나는 장소

    @Column(length = 50)
    private String transportation; // 이동 수단

    @Column(length = 50)
    private String mobility; // 거동 상태

    @Column(columnDefinition = "TEXT")
    private String detailedContent;

    @Column(columnDefinition = "TEXT")
    private String doctorInquiry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Member manager;

    @Column(columnDefinition = "boolean default false")
    private Boolean hasProxy = false; // 재방문 대리 신청 상태값

    @Column(columnDefinition = "boolean default false")
    private Boolean noRevisit = false; // 재방문 없음 여부

    @Column(length = 20)
    private String revisitCount; // 재방문 카운트

    @OneToOne(mappedBy = "reservation")
    private Review review;

    @Builder
    public Reservation(Member member, String patientName, String patientPhone, String hospitalName, LocalDateTime reservationTime,
                       String guardianName, String guardianPhone, String memo, ReservationStatus status, String requirements,
                       String detailedContent, String doctorInquiry, String category, String meetingPoint,
                       String transportation, String mobility, String revisitCount) {
        this.member = member;
        this.patientName = patientName;
        this.patientPhone = patientPhone;
        this.hospitalName = hospitalName;
        this.reservationTime = reservationTime;
        this.guardianName = guardianName;
        this.guardianPhone = guardianPhone;
        this.category = category;
        this.meetingPoint = meetingPoint;
        this.transportation = transportation;
        this.mobility = mobility;
        this.memo = memo;
        this.detailedContent = detailedContent;
        this.doctorInquiry = doctorInquiry;
        this.status = status;
        this.requirements = requirements;
        this.revisitCount = revisitCount;
        this.status = status != null ? status : ReservationStatus.WAITING;
    }

    public void assignManager(Member manager) {
        this.manager = manager;
        this.status = ReservationStatus.CONFIRMED;
    }

    public void updateStatus(ReservationStatus status) { // 🌟 Enum 사용
        this.status = status;
    }

    public void updateDetails(String hospitalName, LocalDateTime reservationTime, String requirements,
                              String detailedContent, String doctorInquiry,
                              String meetingPoint, String transportation, String mobility) {
        this.hospitalName = hospitalName;
        this.reservationTime = reservationTime;
        this.requirements = requirements;
        this.detailedContent = detailedContent;
        this.doctorInquiry = doctorInquiry;

        // 프론트에서 동행 기본 정보가 넘어오면 업데이트!
        if (meetingPoint != null) this.meetingPoint = meetingPoint;
        if (transportation != null) this.transportation = transportation;
        if (mobility != null) this.mobility = mobility;
    }

    public void setHasProxy(Boolean hasProxy) {
        this.hasProxy = hasProxy;
    }

    public void setNoRevisit(Boolean noRevisit) {
        this.noRevisit = noRevisit;
    }


}