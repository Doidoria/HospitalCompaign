package com.yescare.api.controller;

import com.yescare.api.dto.ReviewRequest;
import com.yescare.api.dto.ReviewResponse;
import com.yescare.api.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // POST /api/reviews/{reservationId} 형태로 호출
    @PostMapping("/{reservationId}")
    public ResponseEntity<ReviewResponse> createReview(
            Authentication authentication,
            @PathVariable("reservationId") Long reservationId,
            @RequestBody ReviewRequest request) {

        ReviewResponse response = reviewService.createReview(authentication.getName(), reservationId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> getAllReviews(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reviewService.getAllReviews(pageable));
    }
}