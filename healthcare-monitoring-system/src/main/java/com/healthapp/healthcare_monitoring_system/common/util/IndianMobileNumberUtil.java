package com.healthapp.healthcare_monitoring_system.common.util;

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

        String cleanedMobile = mobile.trim();

        return INDIAN_MOBILE_PATTERN
                .matcher(cleanedMobile)
                .matches();
    }

    public static String normalize(String mobile) {

        if (mobile == null) {
            return null;
        }

        String cleanedMobile = mobile.trim();

        if (cleanedMobile.startsWith("+91")) {
            cleanedMobile = cleanedMobile.substring(3).trim();
        }

        if (cleanedMobile.startsWith("91")
                && cleanedMobile.length() == 12) {
            cleanedMobile = cleanedMobile.substring(2);
        }

        cleanedMobile = cleanedMobile.replaceAll("[^0-9]", "");

        if (!isValid(cleanedMobile)) {
            throw new IllegalArgumentException(
                    "Invalid Indian mobile number. Please enter a valid 10-digit mobile number."
            );
        }

        return cleanedMobile;
    }
}