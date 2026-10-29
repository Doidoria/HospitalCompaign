package com.yescare.api.service;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Reservation;
import com.yescare.api.domain.Role;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * 예약 단위 접근 권한(소유자/배정 매니저/관리자) 검사 공통 컴포넌트.
 * - 권한이 없으면 AccessDeniedException → Spring Security가 403으로 응답
 * - @PreAuthorize(역할 검사)와 별개로, "이 예약의 당사자인지"를 서버에서 확인하기 위한 용도
 */
@Component
@RequiredArgsConstructor
public class ReservationAccessChecker {

    private final ReservationRepository reservationRepository;
    private final MemberRepository memberRepository;

    /** 조회: 예약한 고객 / 배정된 매니저 / 관리자 */
    public Reservation getViewable(Long reservationId, String email) {
        Reservation reservation = findReservation(reservationId);
        Member requester = findMember(email);
        if (isAdmin(requester) || isOwner(reservation, requester) || isAssignedManager(reservation, requester)) {
            return reservation;
        }
        throw new AccessDeniedException("해당 예약에 접근할 권한이 없습니다.");
    }

    /** 고객 전용 작업(리뷰, 추가요금 결제): 예약한 고객 본인만 */
    public Reservation getOwned(Long reservationId, String email) {
        Reservation reservation = findReservation(reservationId);
        Member requester = findMember(email);
        if (isOwner(reservation, requester)) {
            return reservation;
        }
        throw new AccessDeniedException("본인의 예약만 처리할 수 있습니다.");
    }

    /** 취소: 예약한 고객 본인 / 관리자 */
    public Reservation getOwnedOrAdmin(Long reservationId, String email) {
        Reservation reservation = findReservation(reservationId);
        Member requester = findMember(email);
        if (isAdmin(requester) || isOwner(reservation, requester)) {
            return reservation;
        }
        throw new AccessDeniedException("본인의 예약만 처리할 수 있습니다.");
    }

    /** 매니저 작업(리포트 작성/수정): 배정된 매니저 / 관리자 */
    public Reservation getManagedOrAdmin(Long reservationId, String email) {
        Reservation reservation = findReservation(reservationId);
        Member requester = findMember(email);
        if (isAdmin(requester) || isAssignedManager(reservation, requester)) {
            return reservation;
        }
        throw new AccessDeniedException("배정된 매니저만 처리할 수 있습니다.");
    }

    private Reservation findReservation(Long reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 예약입니다."));
    }

    private Member findMember(String email) {
        if (email == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("회원 정보를 찾을 수 없습니다."));
    }

    private boolean isAdmin(Member member) {
        return member.getRole() == Role.ADMIN;
    }

    private boolean isOwner(Reservation reservation, Member member) {
        return reservation.getMember() != null && reservation.getMember().getId().equals(member.getId());
    }

    private boolean isAssignedManager(Reservation reservation, Member member) {
        return reservation.getManager() != null && reservation.getManager().getId().equals(member.getId());
    }
}
