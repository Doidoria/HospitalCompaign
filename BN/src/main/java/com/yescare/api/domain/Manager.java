package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "managers")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Manager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Member와 1:1 관계 (FK: member_id)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", unique = true)
    private Member member;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(columnDefinition = "TEXT")
    private String career;

    @Column
    private String certifications;

    @Builder
    public Manager(Member member, String introduction, String career, String certifications) {
        this.member = member;
        this.introduction = introduction;
        this.career = career;
        this.certifications = certifications;
    }

    public void updateProfile(String introduction, String career, String certifications) {
        this.introduction = introduction;
        this.career = career;
        this.certifications = certifications;
    }
}