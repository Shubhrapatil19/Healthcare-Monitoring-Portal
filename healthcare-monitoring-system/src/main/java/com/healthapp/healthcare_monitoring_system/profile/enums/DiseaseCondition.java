package com.healthapp.healthcare_monitoring_system.profile.enums;
import java.util.Set;

public enum DiseaseCondition {
    NONE,
    DIABETES,
    HYPERTENSION,
    HEART_DISEASE,
    ASTHMA,
    ARTHRITIS,
    KIDNEY_DISEASE,
    THYROID_DISORDER,
    CANCER,
    ALZHEIMERS,
    OTHER;

    public static final Set<String> ALLOWED_CODES = Set.of(
            NONE.name(), DIABETES.name(), HYPERTENSION.name(), HEART_DISEASE.name(),
            ASTHMA.name(), ARTHRITIS.name(), KIDNEY_DISEASE.name(), THYROID_DISORDER.name(),
            CANCER.name(), ALZHEIMERS.name(), OTHER.name()
    );
}