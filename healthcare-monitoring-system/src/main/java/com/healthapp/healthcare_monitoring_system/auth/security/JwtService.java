package com.healthapp.healthcare_monitoring_system.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Base64;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long normalExpiration;
    private final long rememberMeExpiration;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration}") long normalExpiration,
            @Value("${app.jwt.remember-me-expiration}") long rememberMeExpiration
    ) {

        this.secretKey =
                Keys.hmacShaKeyFor(
                        Base64.getDecoder().decode(secret)
                );

        this.normalExpiration = normalExpiration;
        this.rememberMeExpiration = rememberMeExpiration;
    }

    public String generateToken(
            Long userId,
            String email,
            String role,
            boolean rememberMe
    ) {

        long expiration =
                rememberMe
                        ? rememberMeExpiration
                        : normalExpiration;

        Date now = new Date();

        Date expiry =
                new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public String extractEmail(String token) {

        return extractClaims(token)
                .getSubject();
    }
    public Long extractUserId(String token) {

        return extractClaims(token)
                .get("userId", Long.class);
    }

    public boolean isTokenValid(String token) {

        try {

            Claims claims = extractClaims(token);

            return claims.getExpiration()
                    .after(new Date());

        } catch (Exception e) {

            return false;
        }
    }

    private Claims extractClaims(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}