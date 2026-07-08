package com.yescare.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Entity
@Table(name = "members") // DB에 생성될 테이블 이름
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@org.hibernate.annotations.Where(clause = "is_deleted = false")
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
    private boolean isActive = true; // 계정 정지 여부 관리

    @Column(nullable = false)
    private boolean isDeleted = false; // 논리적 삭제(탈퇴)

    @OneToOne(mappedBy = "member", fetch = FetchType.LAZY)
    private Manager manager;

    // 카카오 전용 필드
    @Column(length = 10)
    private String gender; // male, female

    @Column(length = 8)
    private String birthDate; // YYYYMMDD 형태

    @Column(length = 255)
    private String kakaoAccessToken; // 알림톡/메시지 발송용 임시 저장 토큰

    @Column(length = 255)
    private String pinCode; // 관리자 2차 보안 PIN (Null이면 미설정 상태)

    public void setPinCode(String encodedPin) {
        this.pinCode = encodedPin;
    }

    @Builder
    public Member(String email, String password, String name, String phoneNumber, String address, String detailAddress,
                  String zipCode, String guardianName, String guardianPhone, Role role, String provider,
                  String gender, String birthDate, String kakaoAccessToken) {
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
        this.isActive = true;
        this.isDeleted = false; // 기본값 명시

        // 카카오 정보 매핑
        this.gender = gender;
        this.birthDate = birthDate;
        this.kakaoAccessToken = kakaoAccessToken;
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
        this.phoneNumber = phoneNumber != null ? phoneNumber.replaceAll("[^0-9]", "") : this.phoneNumber;
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

    // 서비스 탈퇴 비즈니스 로직 최적화 (더티체킹 반영용)
    public void withdraw() {
        this.isDeleted = true;
        this.email = "withdrawn_" + this.id + "_" + this.email;
        this.phoneNumber = "000-0000-0000";
        if (this.guardianPhone != null) this.guardianPhone = "000-0000-0000";
        this.kakaoAccessToken = null;
        this.isActive = false; // 탈퇴 시 계정 비활성화 처리 추가
    }

    // 기존 이메일 계정이 존재할 때 소셜 연동을 묶어주는 메서드
    public void linkSocialProvider(String provider, String gender, String birthDate, String kakaoAccessToken) {
        this.provider = provider; // "LOCAL" -> "KAKAO"로 소셜 전환 처리
        if (this.gender == null) this.gender = gender;
        if (this.birthDate == null) this.birthDate = birthDate;
        this.kakaoAccessToken = kakaoAccessToken;
        log.info("계정 연동 완료 (이메일: {}, 새로운 공급자: {})", this.email, provider);
    }

    // [추가] 카카오 정보 업데이트용 편의 메서드
    public void setKakaoInfo(String gender, String birthDate, String kakaoAccessToken) {
        this.gender = gender;
        this.birthDate = birthDate;
        this.kakaoAccessToken = kakaoAccessToken;
    }

    // 카카오 연동 (기존 회원)
    public void overwriteWithKakaoInfo(String kakaoEmail, String kakaoName, String kakaoAccessToken) {
        this.email = kakaoEmail;          // 이메일을 카카오 계정 메일로 완전 교체
        this.name = kakaoName;            // 이름도 카카오 이름으로 동기화
        this.provider = "KAKAO";          // 가입 출처를 KAKAO로 명시
        this.kakaoAccessToken = kakaoAccessToken; // 새로운 카카오 액세스 토큰 바인딩
    }

    // 토큰 갱신용 메서드 (기존 회원 로그인 시 사용)
    public void updateKakaoToken(String kakaoAccessToken) {
        this.kakaoAccessToken = kakaoAccessToken;
    }
}