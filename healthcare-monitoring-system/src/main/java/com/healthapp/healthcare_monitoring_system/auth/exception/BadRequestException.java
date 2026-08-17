package com.healthapp.healthcare_monitoring_system.auth.exception;

public class BadRequestException
        extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}