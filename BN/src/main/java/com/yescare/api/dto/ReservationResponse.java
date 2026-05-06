package com.yescare.api.dto;

import com.yescare.api.domain.Reservation;
import com.yescare.api.domain.ReservationStatus;
import com.yescare.api.domain.Review;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class ReservationResponse {
    private Long id;
    private String patientName;
    private String patientPhone;
    private String guardianName;
    private String guardianPhone;
    private String hospitalName;
    private LocalDateTime reservationTime;
    private String status;
    private String requirements;
    private String managerName;
    private String category;
    private String meetingPoint;
    private String transportation;
    private String memo;
    private String mobility;
    private String detailedContent;
    private String doctorInquiry;
    private String patientAddress;
    private Boolean hasProxy;
    private Boolean noRevisit;
    private String revisitCount;
    private Integer reviewRating;
    private String reviewComment;
    private Long managerId;

    public ReservationResponse(Reservation entity) {
        this.id = entity.getId();
        this.patientName = entity.getPatientName();
        this.patientPhone = entity.getPatientPhone();
        this.guardianName = entity.getGuardianName();
        this.guardianPhone = entity.getGuardianPhone();
        this.hospitalName = entity.getHospitalName();
        this.reservationTime = entity.getReservationTime();
        this.status = entity.getStatus().name();
        this.requirements = entity.getRequirements();
        this.managerName = entity.getManager() != null ? entity.getManager().getName() : "-";
        this.category = entity.getCategory();
        this.meetingPoint = entity.getMeetingPoint();
        this.transportation = entity.getTransportation();
        this.memo = entity.getMemo();
        this.mobility = entity.getMobility();
        this.detailedContent = entity.getDetailedContent();
        this.doctorInquiry = entity.getDoctorInquiry();
        this.patientAddress = entity.getMember().getAddress();
        this.hasProxy = entity.getHasProxy() != null ? entity.getHasProxy() : false;
        this.noRevisit = entity.getNoRevisit() != null ? entity.getNoRevisit() : false;
        this.revisitCount = entity.getRevisitCount();

        if (entity.getReview() != null) {
            this.reviewRating = entity.getReview().getRating();
            this.reviewComment = entity.getReview().getComment();
        }

        // 매니저가 배정된 경우 반드시 ID와 이름을 가져옴
        if (entity.getManager() != null) {
            this.managerId = entity.getManager().getId();
            this.managerName = entity.getManager().getName();
        }

        if (entity.getReview() != null) {
            this.reviewRating = entity.getReview().getRating();
        }
    }
}