package com.healthapp.healthcare_monitoring_system.profile.dto;

import java.util.List;

public class ProfileResponseDto {

    private Long userId;
    private String fullName;
    private String email;
    private String mobile;
    private String profilePhotoUrl;
    private Integer age;
    private String gender;
    private List<String> diseaseConditions;
    private String diseaseConditionOther;
    private String contact1Relation;
    private String contact1Phone;
    private String contact2Relation;
    private String contact2Phone;
    private int completionPercentage;

    public ProfileResponseDto() {
    }

    public ProfileResponseDto(Long userId, String fullName, String email, String mobile, String profilePhotoUrl,
                              Integer age, String gender, List<String> diseaseConditions, String diseaseConditionOther,
                              String contact1Relation,
                              String contact1Phone, String contact2Relation, String contact2Phone,
                              int completionPercentage) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.mobile = mobile;
        this.profilePhotoUrl = profilePhotoUrl;
        this.age = age;
        this.gender = gender;
        this.diseaseConditions = diseaseConditions;
        this.diseaseConditionOther = diseaseConditionOther;
        this.contact1Relation = contact1Relation;
        this.contact1Phone = contact1Phone;
        this.contact2Relation = contact2Relation;
        this.contact2Phone = contact2Phone;
        this.completionPercentage = completionPercentage;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public List<String> getDiseaseConditions() { return diseaseConditions; }
    public void setDiseaseConditions(List<String> diseaseConditions) { this.diseaseConditions = diseaseConditions; }

    public String getDiseaseConditionOther() { return diseaseConditionOther; }
    public void setDiseaseConditionOther(String diseaseConditionOther) { this.diseaseConditionOther = diseaseConditionOther; }

    public String getContact1Relation() { return contact1Relation; }
    public void setContact1Relation(String contact1Relation) { this.contact1Relation = contact1Relation; }

    public String getContact1Phone() { return contact1Phone; }
    public void setContact1Phone(String contact1Phone) { this.contact1Phone = contact1Phone; }

    public String getContact2Relation() { return contact2Relation; }
    public void setContact2Relation(String contact2Relation) { this.contact2Relation = contact2Relation; }

    public String getContact2Phone() { return contact2Phone; }
    public void setContact2Phone(String contact2Phone) { this.contact2Phone = contact2Phone; }

    public int getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(int completionPercentage) { this.completionPercentage = completionPercentage; }
}
