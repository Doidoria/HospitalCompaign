package com.yescare.api.service;

import com.yescare.api.domain.Member;
import com.yescare.api.domain.Reservation;
import com.yescare.api.domain.ReservationStatus;
import com.yescare.api.domain.Review;
import com.yescare.api.dto.ReviewRequest;
import com.yescare.api.dto.ReviewResponse;
import com.yescare.api.repository.MemberRepository;
import com.yescare.api.repository.ReservationRepository;
import com.yescare.api.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public ReviewResponse createReview(String email, Long reservationId, ReviewRequest request) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약 정보를 찾을 수 없습니다."));

        // 1. 본인의 예약인지 확인
        if (!reservation.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인의 예약에만 리뷰를 작성할 수 있습니다.");
        }

        // 2. 서비스가 완료된 상태인지 확인
        if (reservation.getStatus() != ReservationStatus.COMPLETED) {
            throw new IllegalArgumentException("서비스 완료 후에만 리뷰 작성이 가능합니다.");
        }

        // 3. 이미 리뷰를 작성했는지 확인 (중복 방지)
        if (reviewRepository.findByReservationId(reservationId).isPresent()) {
            throw new IllegalArgumentException("이미 해당 예약에 대한 리뷰가 존재합니다.");
        }

        // Review 객체 생성 (실제 Review.java 에 맞춤)
        Review review = Review.builder()
                .reservation(reservation)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        reviewRepository.save(review);
        return new ReviewResponse(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable)
                .map(ReviewResponse::new);
    }
}