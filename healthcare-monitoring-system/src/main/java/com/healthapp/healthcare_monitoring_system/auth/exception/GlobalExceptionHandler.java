package com.healthapp.healthcare_monitoring_system.auth.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import org.springframework.security.access.AccessDeniedException;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<?> handleBadRequest(BadRequestException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<?> handleUnauthorized(UnauthorizedException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "You do not have permission to access this resource.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", 400);
        response.put("message", "Validation failed");
        response.put("errors", errors);

        return ResponseEntity.badRequest().body(response);
    }

    // NEW — catches wrong JSON, wrong date format ("2026-08-21" instead of "21-08-2026"),
    // wrong time format ("10:40" instead of "10:40 AM"), missing/malformed request body, etc.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleUnreadableBody(HttpMessageNotReadableException ex) {

        log.warn("Unreadable request body: {}", ex.getMessage());

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid request format. Please check: dates must be dd-MM-yyyy (e.g. 21-08-2026) " +
                        "and times must be hh:mm a (e.g. 10:40 AM)."
        );
    }

    // NEW — catches wrong type in a URL param, e.g. /api/doses/calendar?year=abc
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid value for '" + ex.getName() + "'. Expected type: "
                        + (ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "different type") + "."
        );
    }

    // NEW — catches missing required query param, e.g. calendar without ?year=
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<?> handleMissingParam(MissingServletRequestParameterException ex) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Missing required parameter: " + ex.getParameterName()
        );
    }

    // NEW — catches DB-level errors: unique constraint violation, not-null violation,
    // foreign key violation, etc. (this is EXACTLY what caused your earlier "dose_date" 500 error)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException ex) {

        log.error("Database constraint violation", ex);

        String rootMessage = ex.getMostSpecificCause().getMessage();
        String friendlyMessage = "This action could not be completed because it conflicts with existing data.";

        if (rootMessage != null) {
            if (rootMessage.toLowerCase().contains("unique") || rootMessage.toLowerCase().contains("duplicate")) {
                friendlyMessage = "This record already exists.";
            } else if (rootMessage.toLowerCase().contains("not-null") || rootMessage.toLowerCase().contains("null value")) {
                friendlyMessage = "A required field is missing.";
            } else if (rootMessage.toLowerCase().contains("foreign key")) {
                friendlyMessage = "This record is linked to other data and cannot be processed.";
            }
        }

        return buildResponse(HttpStatus.CONFLICT, friendlyMessage);
    }

    // Last resort — anything truly unexpected.
    // IMPORTANT: full stack trace ab hamesha console mein print hoga (log.error),
    // taaki tum ise dekh sako, lekin client ko internal details expose nahi hote (security).
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception ex) {

        log.error("Unexpected error occurred", ex);

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected server error occurred. Our team has been notified. Please try again shortly."
        );
    }

    private ResponseEntity<?> buildResponse(HttpStatus status, String message) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("message", message);

        return ResponseEntity.status(status).body(response);
    }
}