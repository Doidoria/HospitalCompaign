package com.yescare.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExtraChargeRequest {
    private Integer amount;
    private String reason;
}