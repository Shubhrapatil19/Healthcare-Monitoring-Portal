import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Edit2,
  Heart,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  Stethoscope,
  User,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import api from "../../api/axiosInstance";

import "./UserProfiles.css";

const RELATIONS = [
  "FATHER",
  "MOTHER",
  "BROTHER",
  "SISTER",
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "FRIEND",
  "OTHER",
];

const DISEASES = [
  "ARTHRITIS",
  "HEART_DISEASE",
  "HYPERTENSION",
  "KIDNEY_DISEASE",
  "ASTHMA",
  "THYROID",
  "CANCER",
  "DIABETES",
  "ALZHEIMERS",
  "OTHER",
];

const readLocalJSON = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const formatLabel = (value) => {
  if (!value) return "Not specified";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getProfileValue = (profileData, registeredUser, keys) => {
  for (const key of keys) {
    const value = profileData?.[key] || registeredUser?.[key];
    if (value) return value;
  }

  return "";
};

const normalizeGender = (value) => {
  if (!value) return "";
  return String(value).trim().toUpperCase();
};

const isProfileComplete = (profile) =>
  Boolean(
    profile?.fullName &&
      profile?.email &&
      profile?.mobile &&
      profile?.age &&
      profile?.gender &&
      profile?.diseaseCondition &&
      profile?.contact1Relation &&
      profile?.contact1Phone &&
      profile?.contact2Relation &&
      profile?.contact2Phone
  );

const normalizeProfile = (data = {}) => {
  const normalized = {
    ...data,
    gender: normalizeGender(data.gender),
    diseaseCondition:
      data.diseaseCondition || data.disease || data.diseases?.[0] || "",
    contact1Relation:
      data.contact1Relation || data.familyContacts?.[0]?.relation || "",
    contact1Phone:
      data.contact1Phone || data.familyContacts?.[0]?.phoneNumber || "",
    contact2Relation:
      data.contact2Relation || data.familyContacts?.[1]?.relation || "",
    contact2Phone:
      data.contact2Phone || data.familyContacts?.[1]?.phoneNumber || "",
  };

  normalized.completed =
    Number(normalized.completionPercentage) >= 100 || isProfileComplete(normalized);

  return normalized;
};

const UserProfiles = () => {
  const [profileData, setProfileData] = useState(null);
  const [registeredUser, setRegisteredUser] = useState(() =>
    readLocalJSON("registeredUser", {})
  );
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [editFormData, setEditFormData] = useState({
    age: "",
    gender: "",
    disease: "",
    relation1: "",
    contact1: "",
    relation2: "",
    contact2: "",
  });

  const displayName =
    profileData?.fullName || registeredUser?.fullName || "User";
  const displayEmail =
    profileData?.email || registeredUser?.email || "Not specified";
  const displayMobile =
    getProfileValue(profileData, registeredUser, [
      "mobile",
      "phoneNumber",
      "contactNumber",
    ]) || "Not specified";
  const displayAge = profileData?.age || "Not specified";
  const displayGender = formatLabel(profileData?.gender);
  const displayDisease = formatLabel(profileData?.diseaseCondition);

  const completionItems = useMemo(
    () => [
      Boolean(displayName && displayName !== "User"),
      Boolean(displayEmail && displayEmail !== "Not specified"),
      Boolean(displayMobile && displayMobile !== "Not specified"),
      Boolean(profileData?.age),
      Boolean(profileData?.gender),
      Boolean(profileData?.diseaseCondition),
      Boolean(profileData?.contact1Phone),
      Boolean(profileData?.contact2Phone),
    ],
    [displayEmail, displayMobile, displayName, profileData]
  );

  const calculatedCompletionPercent = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100
  );
  const completionPercent = Number.isFinite(Number(profileData?.completionPercentage))
    ? Number(profileData?.completionPercentage)
    : calculatedCompletionPercent;

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await api.get("/api/profile");

        if (!active) return;

        const data = normalizeProfile(response?.data || {});
        setProfileData(data);
        localStorage.setItem("profileData", JSON.stringify(data));
        localStorage.setItem("profileCompleted", data.completed ? "true" : "false");

        setRegisteredUser((previousUser) => {
          const basicUserData = {
            fullName: data.fullName || previousUser.fullName || "",
            email: data.email || previousUser.email || "",
            mobile: data.mobile || previousUser.mobile || "",
          };

          localStorage.setItem(
            "registeredUser",
            JSON.stringify(basicUserData)
          );

          return basicUserData;
        });
      } catch (error) {
        console.error("Profile load error:", error);
        setSaveError("Unable to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const getInitials = () =>
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getEditableValue = (field) => editFormData[field] || "";

  const resetEditForm = () => {
    setEditFormData({
      age: profileData?.age ?? "",
      gender: profileData?.gender ?? "",
      disease: profileData?.diseaseCondition ?? "",
      relation1: profileData?.contact1Relation ?? "",
      contact1: profileData?.contact1Phone ?? "",
      relation2: profileData?.contact2Relation ?? "",
      contact2: profileData?.contact2Phone ?? "",
    });
  };

  const handleEditClick = () => {
    setSaveError("");
    setSaveSuccess("");
    setErrors({});
    resetEditForm();
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[6-9]\d{9}$/;
    const age = Number(editFormData.age);

    if (!editFormData.age) {
      newErrors.age = "Age is required";
    } else if (Number.isNaN(age) || age <= 0 || age > 120) {
      newErrors.age = "Enter a valid age";
    }

    if (!editFormData.gender) {
      newErrors.gender = "Please select gender";
    }

    if (!editFormData.disease) {
      newErrors.disease = "Disease / condition is required";
    }

    if (!editFormData.relation1) {
      newErrors.relation1 = "Please select relation";
    }

    if (!editFormData.contact1) {
      newErrors.contact1 = "Contact number is required";
    } else if (!phoneRegex.test(editFormData.contact1)) {
      newErrors.contact1 = "Enter a valid 10-digit mobile number";
    }

    if (!editFormData.relation2) {
      newErrors.relation2 = "Please select relation";
    }

    if (!editFormData.contact2) {
      newErrors.contact2 = "Contact number is required";
    } else if (!phoneRegex.test(editFormData.contact2)) {
      newErrors.contact2 = "Enter a valid 10-digit mobile number";
    }

    if (
      editFormData.contact1 &&
      editFormData.contact2 &&
      editFormData.contact1 === editFormData.contact2
    ) {
      newErrors.contact2 = "Contact numbers cannot be the same";
    }

    if (
      editFormData.relation1 &&
      editFormData.relation2 &&
      editFormData.relation1 === editFormData.relation2
    ) {
      newErrors.relation2 = "Relations cannot be the same";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    const payload = {
      fullName: displayName !== "User" ? displayName : profileData?.fullName || "",
      mobile:
        displayMobile !== "Not specified"
          ? displayMobile
          : profileData?.mobile || registeredUser?.mobile || "",
      age: Number(editFormData.age),
      gender: normalizeGender(editFormData.gender),
      diseaseCondition: editFormData.disease,
      contact1Relation: editFormData.relation1,
      contact1Phone: editFormData.contact1,
      contact2Relation: editFormData.relation2,
      contact2Phone: editFormData.contact2,
    };

    try {
      const response = await api.put("/api/profile", payload);
      const responseData = normalizeProfile(response?.data || {});

      const nextProfile = normalizeProfile({
        ...profileData,
        ...payload,
        ...responseData,
        fullName:
          responseData.fullName || profileData?.fullName || registeredUser?.fullName || "",
        email:
          responseData.email || profileData?.email || registeredUser?.email || "",
        mobile:
          responseData.mobile || payload.mobile || profileData?.mobile || registeredUser?.mobile || "",
      });

      setProfileData(nextProfile);
      localStorage.setItem("profileData", JSON.stringify(nextProfile));
      localStorage.setItem("profileCompleted", nextProfile.completed ? "true" : "false");
      setIsEditing(false);
      setSaveSuccess("Profile updated successfully!");

      setTimeout(() => {
        setSaveSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Profile save error:", error);
      setSaveError(error.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    resetEditForm();
    setErrors({});
    setSaveError("");
    setSaveSuccess("");
    setIsEditing(false);
  };

  const renderStaticInfo = (label, value, icon, className = "") => (
    <div className={`up-info-item ${className}`.trim()}>
      <div className="up-icon">{icon}</div>
      <div className="up-info-content">
        <label>{label}</label>
        <p className="up-value">{value || "Not specified"}</p>
      </div>
    </div>
  );

  const renderEditableField = (
    label,
    value,
    icon,
    editField,
    editType = "text",
    options = [],
    className = ""
  ) => (
    <div className={`up-info-item ${className}`.trim()}>
      <div className="up-icon">{icon}</div>
      <div className="up-info-content">
        <label>{label}</label>

        {isEditing ? (
          editType === "select" ? (
            <select
              value={getEditableValue(editField)}
              onChange={(event) =>
                handleInputChange(editField, event.target.value)
              }
              className={`up-input-field ${
                errors[editField] ? "up-input-error" : ""
              }`}
            >
              <option value="">Select {label}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={editType}
              value={getEditableValue(editField)}
              onChange={(event) => {
                const nextValue = editField.includes("contact")
                  ? event.target.value.replace(/\D/g, "")
                  : event.target.value;
                handleInputChange(editField, nextValue);
              }}
              className={`up-input-field ${
                errors[editField] ? "up-input-error" : ""
              }`}
              placeholder={`Enter ${label.toLowerCase()}`}
              maxLength={editField.includes("contact") ? 10 : undefined}
              min={editField === "age" ? 1 : undefined}
              max={editField === "age" ? 120 : undefined}
            />
          )
        ) : (
          <p className="up-value">{value || "Not specified"}</p>
        )}

        {errors[editField] && (
          <span className="up-error">{errors[editField]}</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="up-container">
        <div className="up-loading">
          <Loader2 size={32} className="spin" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="up-container">
      <div className="up-profile-shell">
        <div className="up-topbar">
          <h1 className="up-page-title">My Profile</h1>

          {!isEditing ? (
            <button className="up-edit-btn" onClick={handleEditClick}>
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="up-edit-actions">
              <button
                className="up-save-btn"
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>

              <button
                className="up-cancel-btn"
                onClick={handleCancelClick}
                disabled={isSaving}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <section className="up-profile-header">
          <div className="up-avatar-section">
            <div className="up-avatar">
              <span className="up-avatar-text">{getInitials()}</span>
            </div>
          </div>

          <div className="up-profile-header-info">
            <p className="up-profile-name">{displayName}</p>
            <div className="up-profile-meta">
              <span>
                <Mail size={14} />
                {displayEmail}
              </span>
              <span>
                <Phone size={14} />
                {displayMobile}
              </span>
            </div>
          </div>

          <div className="up-profile-status">
            <div className="up-profile-badge">
              <Shield size={14} />
              <span>{completionPercent >= 100 ? "Completed" : "Incomplete"}</span>
            </div>
            <div className="up-progress-track">
              <span style={{ width: `${completionPercent}%` }} />
            </div>
            <p>{completionPercent}% complete</p>
          </div>
        </section>

        {saveError && (
          <div className="up-message up-message-error">
            <AlertCircle size={18} />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="up-message up-message-success">
            <CheckCircle size={18} />
            <span>{saveSuccess}</span>
          </div>
        )}

        <div className="up-content-grid">
          <section className="up-section up-section-personal">
            <div className="up-section-header">
              <div className="up-section-header-left">
                <UserCircle size={20} />
                <h2>Personal Information</h2>
              </div>
            </div>

            <div className="up-info-grid up-info-grid-personal">
              {renderStaticInfo("Full Name", displayName, <User size={20} />)}
              {renderStaticInfo("Email Address", displayEmail, <Mail size={20} />)}
              {renderStaticInfo("Mobile Number", displayMobile, <Phone size={20} />)}
              {renderEditableField(
                "Age",
                displayAge,
                <Calendar size={20} />,
                "age",
                "number"
              )}
              {renderEditableField(
                "Gender",
                displayGender,
                <Users size={20} />,
                "gender",
                "select",
                ["MALE", "FEMALE", "OTHER"]
              )}
            </div>
          </section>

          <section className="up-section up-section-medical">
            <div className="up-section-header">
              <div className="up-section-header-left">
                <Heart size={20} />
                <h2>Medical Condition</h2>
              </div>
            </div>

            <div className="up-info-grid up-info-grid--full">
              {renderEditableField(
                "Disease / Condition",
                displayDisease,
                <Stethoscope size={20} />,
                "disease",
                "select",
                DISEASES
              )}
            </div>
          </section>

          <section className="up-section up-section-contacts">
            <div className="up-section-header">
              <div className="up-section-header-left">
                <Phone size={20} />
                <h2>Emergency Contacts</h2>
              </div>
            </div>

            <div className="up-contacts-grid">
              <div className="up-contact-card">
                <div className="up-contact-card-header">
                  <span className="up-contact-badge">Contact 1</span>
                </div>
                <div className="up-contact-card-body">
                  {renderEditableField(
                    "Relation",
                    formatLabel(profileData?.contact1Relation),
                    <Users size={18} />,
                    "relation1",
                    "select",
                    RELATIONS
                  )}
                  {renderEditableField(
                    "Phone Number",
                    profileData?.contact1Phone,
                    <Phone size={18} />,
                    "contact1",
                    "tel"
                  )}
                </div>
              </div>

              <div className="up-contact-card">
                <div className="up-contact-card-header">
                  <span className="up-contact-badge">Contact 2</span>
                </div>
                <div className="up-contact-card-body">
                  {renderEditableField(
                    "Relation",
                    formatLabel(profileData?.contact2Relation),
                    <Users size={18} />,
                    "relation2",
                    "select",
                    RELATIONS
                  )}
                  {renderEditableField(
                    "Phone Number",
                    profileData?.contact2Phone,
                    <Phone size={18} />,
                    "contact2",
                    "tel"
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserProfiles;

