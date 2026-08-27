package com.healthapp.healthcare_monitoring_system.sms.util;

import java.util.regex.Pattern;

public final class IndianMobileNumberUtil {

    private static final Pattern INDIAN_MOBILE_PATTERN =
            Pattern.compile("^[6-9][0-9]{9}$");

    private IndianMobileNumberUtil() {
    }

    public static boolean isValid(String mobile) {

        if (mobile == null) {
            return false;
        }

        String normalizedMobile = mobile.trim();

        return INDIAN_MOBILE_PATTERN
                .matcher(normalizedMobile)
                .matches();
    }

    public static String normalize(String mobile) {

        if (mobile == null) {
            return null;
        }

        String normalizedMobile = mobile.trim()
                .replaceAll("[\\s-]", "");

        if (!isValid(normalizedMobile)) {
            throw new IllegalArgumentException(
                    "Please provide a valid Indian 10 digit mobile number."
            );
        }

        return normalizedMobile;
    }

    public static String toInternationalFormat(String mobile) {
        return "91" + normalize(mobile);
    }
}