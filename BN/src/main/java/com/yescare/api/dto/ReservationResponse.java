package com.yescare.api.dto;

import com.yescare.api.domain.Reservation;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Getter
public class ReservationResponse {
    private Long id;
    private String patientName;
    private String patientPhone;
    private String guardianName;
    private String guardianPhone;

    // 렌더링용 가공 데이터 (BFF)
    private String date;
    private String time;
    private String hospital;

    // 원본/상세 모달용 데이터
    private LocalDateTime reservationTime;
    private String hospitalName; // rawHospitalName 역할
    private String meetingType;
    private String meetingAddress;
    private String meetingDetailAddress;
    private String rawMeetingPoint; // 모달 수정용 원본

    private String status;
    private String requirements;
    private String managerName;
    private String category;
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
    private Boolean hasReport;
    private Integer extraChargeAmount;
    private String extraChargeReason;
    private String extraPaymentStatus;

    // 환자 사전 건강 정보
    private String bloodType;
    private String underlyingDisease;
    private String medication;
    private String preparedDocuments;

    public ReservationResponse(Reservation entity) {
        this.id = entity.getId();
        this.patientName = entity.getPatientName();
        this.patientPhone = entity.getPatientPhone();
        this.guardianName = entity.getGuardianName();
        this.guardianPhone = entity.getGuardianPhone();

        // 1. 날짜/시간 포맷팅 (프론트엔드 렌더링용)
        this.reservationTime = entity.getReservationTime();
        if (this.reservationTime != null) {
            this.date = this.reservationTime.format(DateTimeFormatter.ofPattern("yyyy. MM. dd."));
            this.time = this.reservationTime.format(DateTimeFormatter.ofPattern("a hh:mm"));
        }

        // 2. 병원명 가공 (/// 자르기)
        this.hospitalName = entity.getHospitalName();
        this.hospital = (this.hospitalName != null && this.hospitalName.contains("///"))
                ? this.hospitalName.split("///")[0].trim()
                : this.hospitalName;

        // 3. 만나는 장소
        this.meetingType = entity.getMeetingType();
        this.meetingAddress = entity.getMeetingAddress();
        this.meetingDetailAddress = entity.getMeetingDetailAddress();

        this.status = entity.getStatus().name();
        this.requirements = entity.getRequirements();
        this.category = entity.getCategory();
        this.transportation = entity.getTransportation();
        this.memo = entity.getMemo();
        this.mobility = entity.getMobility();
        this.detailedContent = entity.getDetailedContent();
        this.doctorInquiry = entity.getDoctorInquiry();
        this.patientAddress = entity.getMember() != null ? entity.getMember().getAddress() : "";
        this.hasProxy = entity.getHasProxy() != null ? entity.getHasProxy() : false;
        this.noRevisit = entity.getNoRevisit() != null ? entity.getNoRevisit() : false;
        this.revisitCount = entity.getRevisitCount();
        this.hasReport = (entity.getReport() != null); // 리포트가 DB에 존재하면 true, 없으면 false 반환
        this.extraChargeAmount = entity.getExtraChargeAmount();
        this.extraChargeReason = entity.getExtraChargeReason();
        this.extraPaymentStatus = entity.getExtraPaymentStatus();

        this.bloodType = entity.getBloodType();
        this.underlyingDisease = entity.getUnderlyingDisease();
        this.medication = entity.getMedication();
        this.preparedDocuments = entity.getPreparedDocuments();

        // 매니저 처리 로직 강화
        if (entity.getManager() != null) {
            this.managerId = entity.getManager().getId();
            this.managerName = entity.getManager().getName();
        } else if ("CONFIRMED".equals(this.status) || "COMPLETED".equals(this.status)) {
            this.managerName = "배정완료";
        } else {
            this.managerName = "-";
        }

        // 리뷰 세팅 (중복 제거 완료)
        if (entity.getReview() != null) {
            this.reviewRating = entity.getReview().getRating();
            this.reviewComment = entity.getReview().getComment();
        }
    }
}