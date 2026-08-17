package com.healthapp.healthcare_monitoring_system.auth.exception;

public class UnauthorizedException
        extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}