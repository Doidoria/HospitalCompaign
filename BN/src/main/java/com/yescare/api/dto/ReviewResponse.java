package com.yescare.api.dto;

import com.yescare.api.domain.Review;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long reservationId;
    private int rating;
    private String comment;
    private String authorName;
    private LocalDateTime createdAt;

    // Review 엔티티를 받아서 DTO로 자동 변환해주는 생성자
    public ReviewResponse(Review review) {
        this.id = review.getId();
        this.reservationId = review.getReservation().getId();
        this.rating = review.getRating();
        this.comment = review.getComment();
        this.authorName = review.getReservation().getMember().getName();
        this.createdAt = review.getCreatedAt();
    }
}