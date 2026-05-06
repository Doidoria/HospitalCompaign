package com.yescare.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequest {
    private int rating;
    private String comment;
}