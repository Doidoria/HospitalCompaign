package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "education_applications") // DB에 저장될 테이블명
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EducationApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 기존 가입된 회원 정보와 매핑 (이름, 연락처, 주소 등은 Member에서 꺼내 씀)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 자격증반, 심화반, 자격증+심화반
    @Column(nullable = false, length = 50)
    private String courseType;

    // WAITING(대기중), APPROVED(승인완료), REJECTED(거절)
    @Column(nullable = false, length = 20)
    private String status = "WAITING";

    @Column(updatable = false)
    private LocalDateTime appliedAt;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason; // 반려 사유 저장용

    // 거절 처리 시 사유를 입력하는 편의 메서드 추가
    public void reject(String reason) {
        this.status = "REJECTED";
        this.rejectionReason = reason;
    }

    @Builder
    public EducationApplication(Member member, String courseType) {
        this.member = member;
        this.courseType = courseType;
        this.status = "WAITING";
        this.appliedAt = LocalDateTime.now();
    }

    // 어드민 승인/거절 상태 변경 메서드
    public void updateStatus(String status) {
        this.status = status;
    }
}