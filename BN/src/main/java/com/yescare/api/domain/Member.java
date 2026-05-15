package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "members") // DB에 생성될 테이블 이름
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 회원 고유 번호 (PK)

    @Column(nullable = false, unique = true, length = 100)
    private String email; // 로그인 아이디로 사용할 이메일

    @Column(nullable = false)
    private String password; // 비밀번호

    @Column(nullable = false, length = 50)
    private String name; // 환자 또는 보호자 실명

    @Column(nullable = false, length = 20)
    private String phoneNumber; // 연락처 (예: 010-1234-5678)

    @Column(length = 10)
    private String zipCode; // 우편 번호

    @Column(length = 200)
    private String address; // 기본 자택 주소지

    @Column
    private String detailAddress;

    @Column
    private String guardianName; // 보호자 성명

    @Column(length = 20)
    private String guardianPhone; // 보호자 연락처

    @Column(nullable = false, length = 20)
    private String provider = "LOCAL"; // 기본값은 일반 가입(LOCAL)

    @Column(updatable = false)
    private LocalDateTime createdAt; // 가입일

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(nullable = false)
    private boolean isActive = true; // 기본값은 활성(true)

    @OneToOne(mappedBy = "member", fetch = FetchType.LAZY)
    private Manager manager;

    @Builder
    public Member(String email, String password, String name, String phoneNumber, String address, String detailAddress,
                  String zipCode, String guardianName, String guardianPhone, Role role, String provider) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.zipCode = zipCode;
        this.detailAddress = detailAddress;
        this.guardianName = guardianName;
        this.guardianPhone = guardianPhone;
        this.createdAt = LocalDateTime.now(); // 객체 생성 시 현재 시간 자동 입력
        this.role = role != null ? role : Role.USER;
        this.provider = provider != null ? provider : "LOCAL";
    }

    // 1:N 관계 설정 (회원 1 : 예약 N)
    // mappedBy = "member" : Reservation 클래스에 있는 'member' 필드와 연결된다는 뜻
    @OneToMany(mappedBy = "member")
    private List<Reservation> reservations = new ArrayList<>();

    // 매니저 승인을 위한 상태 변경 메서드
    public void approveManager() {
        this.role = Role.MANAGER;
    }

    public void updateInfo(String name, String phoneNumber, String zipCode, String address,
                           String detailAddress, String guardianName, String guardianPhone) {
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.zipCode = zipCode;
        this.address = address;
        this.detailAddress = detailAddress;
        this.guardianName = guardianName;
        this.guardianPhone = guardianPhone;
    }

    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void changeRole(Role newRole) {
        this.role = newRole;
    }

    // 계정 정지 메서드
    public void suspend() {
        this.isActive = false;
    }

    // 계정 활성화(정지 해제) 메서드
    public void activate() {
        this.isActive = true;
    }
}