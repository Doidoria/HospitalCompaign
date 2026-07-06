package com.yescare.api.repository;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// JpaRepository<조종할 엔티티, 그 엔티티의 PK(ID) 타입>
public interface MemberRepository extends JpaRepository<Member, Long> {

    // 마법의 문장: 이메일로 회원 정보를 찾는 전용 메서드
    Optional<Member> findByEmail(String email);

    // 전체 DB 기준 통계를 위한 쿼리 메서드 선언
    long countByRole(Role role);

    long countByIsActiveFalse(); // 정지 계정 수 집계

    long countByIsActiveTrue();  // 활성 계정 수 집계

    // 전체 회원 조회 (페이징)
    Page<Member> findAll(Pageable pageable);

    // 역할(Role)별 회원 조회 (필요 시)
    Page<Member> findByRole(Role role, Pageable pageable);

    // 전화번호로 회원 찾기 (동일한 회원 방지)
    Optional<Member> findByPhoneNumber(String phoneNumber);

    // 아이디/비밀번호 찾기용 메서드
    Optional<Member> findByNameAndPhoneNumber(String name, String phoneNumber);

    Optional<Member> findByEmailAndPhoneNumber(String email, String phoneNumber);
}