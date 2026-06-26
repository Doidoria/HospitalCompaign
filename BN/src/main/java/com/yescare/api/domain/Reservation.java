package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE reservations SET is_deleted = true WHERE id = ?")
@Where(clause = "is_deleted = false") // 기본 조회 시 삭제된 내역만 안 보이게 처리
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "boolean default false") // 삭제 여부를 관리하는 필드
    private boolean isDeleted = false;

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

    @Column(length = 50)
    private String meetingType; // 자택 or 직접지정

    @Column(length = 200)
    private String meetingAddress; // 주소

    @Column(length = 100)
    private String meetingDetailAddress; // 상세주소

    @Column(length = 50)
    private String transportation; // 이동 수단

    @Column(length = 50)
    private String mobility; // 거동 상태

    @Column(columnDefinition = "TEXT")
    private String detailedContent;

    @Column(columnDefinition = "TEXT")
    private String doctorInquiry;

    @Column(length = 20)
    private String bloodType; // 혈액형

    @Column(length = 200)
    private String underlyingDisease; // 기저질환

    @Column(length = 200)
    private String medication; // 복용 약

    @Column(length = 200)
    private String preparedDocuments; // 준비 서류

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

    @Column(nullable = true)
    private Integer extraChargeAmount; // 추가 요금 (원)

    @Column(length = 100)
    private String extraChargeReason;  // 추가 요금 발생 사유

    @OneToOne(mappedBy = "reservation")
    private Review review;

    @OneToOne(mappedBy = "reservation") // 리포트 연결
    private Report report;

    @Builder
    public Reservation(Member member, String patientName, String patientPhone, String hospitalName, LocalDateTime reservationTime,
                       String guardianName, String guardianPhone, String memo, ReservationStatus status, String requirements,
                       String detailedContent, String doctorInquiry, String category, String meetingType, String meetingAddress,
                       String meetingDetailAddress, String transportation, String mobility, String revisitCount, boolean hasProxy,
                       String bloodType, String underlyingDisease, String medication, String preparedDocuments) {
        this.member = member;
        this.patientName = patientName;
        this.patientPhone = patientPhone;
        this.hospitalName = hospitalName;
        this.reservationTime = reservationTime;
        this.guardianName = guardianName;
        this.guardianPhone = guardianPhone;
        this.category = category;
        this.meetingType = meetingType;
        this.meetingAddress = meetingAddress;
        this.meetingDetailAddress = meetingDetailAddress;
        this.transportation = transportation;
        this.mobility = mobility;
        this.memo = memo;
        this.detailedContent = detailedContent;
        this.doctorInquiry = doctorInquiry;
        this.bloodType = bloodType;
        this.underlyingDisease = underlyingDisease;
        this.medication = medication;
        this.preparedDocuments = preparedDocuments;
        this.requirements = requirements;
        this.revisitCount = revisitCount;
        this.status = status != null ? status : ReservationStatus.WAITING;
        this.hasProxy = hasProxy;
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
                              String meetingType, String meetingAddress, String meetingDetailAddress,
                              String transportation, String mobility,
                              String bloodType, String underlyingDisease, String medication, String preparedDocuments) {
        this.hospitalName = hospitalName;
        this.reservationTime = reservationTime;
        this.requirements = requirements;
        this.detailedContent = detailedContent;
        this.doctorInquiry = doctorInquiry;
        this.bloodType = bloodType;
        this.underlyingDisease = underlyingDisease;
        this.medication = medication;
        this.preparedDocuments = preparedDocuments;

        if (meetingType != null) this.meetingType = meetingType;
        if (meetingAddress != null) this.meetingAddress = meetingAddress;
        if (meetingDetailAddress != null) this.meetingDetailAddress = meetingDetailAddress;
        if (transportation != null) this.transportation = transportation;
        if (mobility != null) this.mobility = mobility;
    }

    public void setHasProxy(Boolean hasProxy) {
        this.hasProxy = hasProxy;
    }

    public void setNoRevisit(Boolean noRevisit) {
        this.noRevisit = noRevisit;
    }

    // 동행 시작 처리
    public void startAccompany() {
        if (this.status != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("예약이 확정된 상태에서만 동행을 시작할 수 있습니다.");
        }
        this.status = ReservationStatus.IN_PROGRESS;
    }

    // 동행 완료 처리 (리포트 작성 전 임시 완료 상태)
    public void completeAccompany() {
        if (this.status != ReservationStatus.IN_PROGRESS) {
            throw new IllegalStateException("동행이 진행 중인 상태에서만 완료 처리를 할 수 있습니다.");
        }
        // (주의) 완전한 COMPLETED 상태는 리포트 작성이 끝나야 넘어갑니다.
        // 프론트엔드의 화면 상태와 맞추려면 여기서 COMPLETED로 바꾸셔도 무방합니다.
        // 현재 로직에서는 바로 COMPLETED로 보내겠습니다.
        this.status = ReservationStatus.COMPLETED;
    }

    // 추가 요금 부과 처리
    public void addExtraCharge(Integer amount, String reason) {
        if (this.status != ReservationStatus.IN_PROGRESS) {
            throw new IllegalStateException("동행이 진행 중인 상태에서만 추가 요금을 등록할 수 있습니다.");
        }
        this.extraChargeAmount = amount;
        this.extraChargeReason = reason;
    }

    public void setReport(Report report) {
        this.report = report;
    }

    // 예약 취소는 삭제가 아니라 단순 상태 업데이트 메서드로 처리
    public void cancel() {
        this.status = ReservationStatus.CANCELLED;
    }

}