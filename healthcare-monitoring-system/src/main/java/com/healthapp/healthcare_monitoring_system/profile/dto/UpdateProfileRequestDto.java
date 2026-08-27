package com.healthapp.healthcare_monitoring_system.profile.dto;

import jakarta.validation.constraints.*;

public class UpdateProfileRequestDto {

    @NotBlank(message = "Full name is required")
    @Size(max = 150, message = "Full name must not exceed 150 characters")
    private String fullName;

    @NotBlank(message = "Mobile number is required")
    @Pattern(
            regexp = "^[6-9][0-9]{9}$",
            message = "Please provide a valid Indian 10 digit mobile number"
    )
    private String mobile;

    @Min(value = 1, message = "Age must be greater than 0")
    @Max(value = 120, message = "Age must be realistic")
    private Integer age;

    @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Gender must be MALE, FEMALE or OTHER")
    private String gender;

    @Size(max = 255, message = "Disease/condition must not exceed 255 characters")
    private String diseaseCondition;

    @Size(max = 50)
    private String contact1Relation;

    @Pattern(
            regexp = "^$|^[6-9][0-9]{9}$",
            message = "Contact 1 phone must be a valid Indian 10 digit mobile number"
    )
    private String contact1Phone;

    @Size(max = 50)
    private String contact2Relation;

    @Pattern(
            regexp = "^$|^[6-9][0-9]{9}$",
            message = "Contact 2 phone must be a valid Indian 10 digit mobile number"
    )
    private String contact2Phone;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getDiseaseCondition() { return diseaseCondition; }
    public void setDiseaseCondition(String diseaseCondition) { this.diseaseCondition = diseaseCondition; }

    public String getContact1Relation() { return contact1Relation; }
    public void setContact1Relation(String contact1Relation) { this.contact1Relation = contact1Relation; }

    public String getContact1Phone() { return contact1Phone; }
    public void setContact1Phone(String contact1Phone) { this.contact1Phone = contact1Phone; }

    public String getContact2Relation() { return contact2Relation; }
    public void setContact2Relation(String contact2Relation) { this.contact2Relation = contact2Relation; }

    public String getContact2Phone() { return contact2Phone; }
    public void setContact2Phone(String contact2Phone) { this.contact2Phone = contact2Phone; }
}