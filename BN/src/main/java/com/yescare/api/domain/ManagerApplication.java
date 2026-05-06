package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ManagerApplication {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member; // 지원한 회원

    private String licenseName;    // 보유 자격증
    private String experience;     // 경력 사항

    @Column(columnDefinition = "TEXT")
    private String motivation;     // 지원 동기

    private String certificateUrl;

    private String availableDays;  // "월,수,금"
    private String availableTime;

    private LocalDateTime appliedAt;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(length = 20)
    private String status = "WAITING";

    @Builder
    public ManagerApplication(Member member, String licenseName, String experience, String motivation,
                              String certificateUrl,String availableDays, String availableTime) {
        this.member = member;
        this.licenseName = licenseName;
        this.experience = experience;
        this.motivation = motivation;
        this.certificateUrl = certificateUrl;
        this.availableDays = availableDays;
        this.availableTime = availableTime;
        this.appliedAt = LocalDateTime.now();
        this.status = "WAITING";
    }

    // 반려 처리
    public void reject(String reason) {
        this.status = "REJECTED";
        this.rejectionReason = reason;
    }

    // 승인 처리
    public void approve() {
        this.status = "APPROVED";
    }

    // 재신청 시 기존 내용을 새 내용으로 덮어쓰고 다시 대기 상태로 변경
    public void updateApplication(String licenseName, String experience, String motivation, String certificateUrl, String availableDays, String availableTime) {
        this.licenseName = licenseName;
        this.experience = experience;
        this.motivation = motivation;
        if (certificateUrl != null) {
            this.certificateUrl = certificateUrl; // 새 파일이 있을 때만 덮어씀
        }
        this.availableDays = availableDays;
        this.availableTime = availableTime;
        this.status = "WAITING"; // 다시 대기 상태로
        this.rejectionReason = null; // 이전 반려 사유 초기화
        this.appliedAt = LocalDateTime.now(); // 신청일 갱신
    }
}