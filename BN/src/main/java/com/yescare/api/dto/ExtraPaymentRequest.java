package com.yescare.api.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ExtraPaymentRequest {
    private String paymentKey;
    private String orderId;
    private Integer amount;
}