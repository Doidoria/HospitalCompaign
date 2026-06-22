package com.yescare.api.exception;

import lombok.Getter;

@Getter
public class RequireAccountLinkException extends RuntimeException {
    private final String tempToken;
    private final String email;

    public RequireAccountLinkException(String message, String tempToken, String email) {
        super(message);
        this.tempToken = tempToken;
        this.email = email;
    }
}