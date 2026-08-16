import { useState, useEffect } from "react";

import {
  User,
  Calendar,
  Mail,
  Users,
  Edit2,
  Stethoscope,
  Loader2,
  Phone,
  Save,
  X,
  Shield,
  Heart,
  AlertCircle,
  CheckCircle,
  UserCircle,
} from "lucide-react";

import {
  getProfile,
  completeProfile,
  updateProfile,
} from "../../api/MockApi";

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

const UserProfiles = () => {
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem("profileData");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [registeredUser, setRegisteredUser] = useState(() => {
    try {
      const saved = localStorage.getItem("registeredUser");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

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

  // =========================================================
  // LOAD PROFILE FROM MOCK API
  // =========================================================

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await getProfile();

        if (!active) return;

        const data = response?.data || {};

        setProfileData(data);

        localStorage.setItem(
          "profileData",
          JSON.stringify(data)
        );

        setRegisteredUser((previousUser) => {
          const basicUserData = {
            fullName:
              data.fullName ||
              previousUser.fullName ||
              "",

            email:
              data.email ||
              previousUser.email ||
              "",
          };

          localStorage.setItem(
            "registeredUser",
            JSON.stringify(basicUserData)
          );

          return basicUserData;
        });
      } catch (error) {
        console.error(
          "Profile load error:",
          error
        );

        setSaveError(
          "Unable to load profile."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // =========================================================
  // INITIALS
  // =========================================================

  const getInitials = () => {
    const name =
      profileData?.fullName ||
      registeredUser?.fullName ||
      "User";

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // =========================================================
  // EDIT
  // =========================================================

  const handleEditClick = () => {
    setSaveError("");
    setSaveSuccess("");
    setErrors({});

    setEditFormData({
      age:
        profileData?.age ??
        "",

      gender:
        profileData?.gender ??
        "",

      disease:
        profileData?.diseases?.[0] ??
        "",

      relation1:
        profileData?.familyContacts?.[0]
          ?.relation ?? "",

      contact1:
        profileData?.familyContacts?.[0]
          ?.phoneNumber ?? "",

      relation2:
        profileData?.familyContacts?.[1]
          ?.relation ?? "",

      contact2:
        profileData?.familyContacts?.[1]
          ?.phoneNumber ?? "",
    });

    setIsEditing(true);
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (
    field,
    value
  ) => {
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

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    const newErrors = {};

    const phoneRegex =
      /^[6-9]\d{9}$/;

    const age =
      Number(editFormData.age);

    if (!editFormData.age) {
      newErrors.age =
        "Age is required";
    } else if (
      Number.isNaN(age) ||
      age <= 0 ||
      age > 120
    ) {
      newErrors.age =
        "Enter a valid age";
    }

    if (!editFormData.gender) {
      newErrors.gender =
        "Please select gender";
    }

    if (!editFormData.disease) {
      newErrors.disease =
        "Disease / condition is required";
    }

    if (!editFormData.relation1) {
      newErrors.relation1 =
        "Please select relation";
    }

    if (!editFormData.contact1) {
      newErrors.contact1 =
        "Contact number is required";
    } else if (
      !phoneRegex.test(
        editFormData.contact1
      )
    ) {
      newErrors.contact1 =
        "Enter a valid 10-digit mobile number";
    }

    if (!editFormData.relation2) {
      newErrors.relation2 =
        "Please select relation";
    }

    if (!editFormData.contact2) {
      newErrors.contact2 =
        "Contact number is required";
    } else if (
      !phoneRegex.test(
        editFormData.contact2
      )
    ) {
      newErrors.contact2 =
        "Enter a valid 10-digit mobile number";
    }

    if (
      editFormData.contact1 &&
      editFormData.contact2 &&
      editFormData.contact1 ===
        editFormData.contact2
    ) {
      newErrors.contact2 =
        "Contact numbers cannot be the same";
    }

    if (
      editFormData.relation1 &&
      editFormData.relation2 &&
      editFormData.relation1 ===
        editFormData.relation2
    ) {
      newErrors.relation2 =
        "Relations cannot be the same";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveClick = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    const payload = {
      age:
        Number(
          editFormData.age
        ),

      gender:
        editFormData.gender,

      diseases: [
        editFormData.disease,
      ],

      familyContacts: [
        {
          phoneNumber:
            editFormData.contact1,

          relation:
            editFormData.relation1,
        },

        {
          phoneNumber:
            editFormData.contact2,

          relation:
            editFormData.relation2,
        },
      ],
    };

    try {
      const isFirstSave =
        !profileData?.completed;

      const response =
        isFirstSave
          ? await completeProfile(
              payload
            )
          : await updateProfile(
              payload
            );

      const responseData =
        response?.data || {};

      const nextProfile = {
        ...profileData,

        ...payload,

        ...responseData,

        fullName:
          responseData.fullName ||
          profileData?.fullName ||
          registeredUser?.fullName ||
          "",

        email:
          responseData.email ||
          profileData?.email ||
          registeredUser?.email ||
          "",

        completed: true,
      };

      setProfileData(
        nextProfile
      );

      localStorage.setItem(
        "profileData",
        JSON.stringify(
          nextProfile
        )
      );

      localStorage.setItem(
        "profileCompleted",
        "true"
      );

      setIsEditing(false);

      setSaveSuccess(
        "Profile updated successfully!"
      );

      setTimeout(() => {
        setSaveSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Profile save error:",
        error
      );

      setSaveError(
        error.response?.data
          ?.message ||
          "Failed to save profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelClick = () => {
    setEditFormData({
      age:
        profileData?.age ??
        "",

      gender:
        profileData?.gender ??
        "",

      disease:
        profileData?.diseases?.[0] ??
        "",

      relation1:
        profileData?.familyContacts?.[0]
          ?.relation ?? "",

      contact1:
        profileData?.familyContacts?.[0]
          ?.phoneNumber ?? "",

      relation2:
        profileData?.familyContacts?.[1]
          ?.relation ?? "",

      contact2:
        profileData?.familyContacts?.[1]
          ?.phoneNumber ?? "",
    });

    setErrors({});
    setSaveError("");
    setSaveSuccess("");
    setIsEditing(false);
  };

  // =========================================================
  // RENDER FIELD
  // =========================================================

  const renderField = (
    label,
    value,
    icon,
    editMode,
    editField,
    editType = "text",
    options = []
  ) => {
    return (
      <div className="up-info-item">

        <div className="up-icon">
          {icon}
        </div>

        <div className="up-info-content">

          <label>
            {label}
          </label>

          {editMode ? (
            editType === "select" ? (
              <select
                value={
                  editFormData[
                    editField
                  ] || ""
                }
                onChange={(e) =>
                  handleInputChange(
                    editField,
                    e.target.value
                  )
                }
                className={`up-input-field ${
                  errors[editField]
                    ? "up-input-error"
                    : ""
                }`}
              >
                <option value="">
                  Select {label}
                </option>

                {options.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}

              </select>
            ) : (
              <input
                type={editType}
                value={
                  editFormData[
                    editField
                  ] || ""
                }
                onChange={(e) => {
                  let value =
                    e.target.value;

                  if (
                    editField.includes(
                      "contact"
                    )
                  ) {
                    value =
                      value.replace(
                        /\D/g,
                        ""
                      );
                  }

                  handleInputChange(
                    editField,
                    value
                  );
                }}
                className={`up-input-field ${
                  errors[editField]
                    ? "up-input-error"
                    : ""
                }`}
                placeholder={`Enter ${label.toLowerCase()}`}
                maxLength={
                  editField.includes(
                    "contact"
                  )
                    ? 10
                    : undefined
                }
                min={
                  editField === "age"
                    ? 1
                    : undefined
                }
                max={
                  editField === "age"
                    ? 120
                    : undefined
                }
              />
            )
          ) : (
            <p className="up-value">
              {value ||
                "Not specified"}
            </p>
          )}

          {errors[editField] && (
            <span className="up-error">
              {errors[editField]}
            </span>
          )}

        </div>

      </div>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="up-container">
        <div className="up-loading">
          <Loader2
            size={32}
            className="spin"
          />

          <p>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="up-container">
      <h1 className="up-page-title">
        My Profile
      </h1>

      {/* ================= PROFILE HEADER ================= */}

      <div className="up-profile-header">

        <div className="up-avatar-section">

          <div className="up-avatar">
            <span className="up-avatar-text">
              {getInitials()}
            </span>
          </div>

          <p className="up-avatar-email">
            <Mail size={12} />

            {profileData?.email ||
              registeredUser?.email ||
              "Not specified"}
          </p>

        </div>

        <div className="up-profile-header-info">

          <p className="up-profile-name">
            {profileData?.fullName ||
              registeredUser?.fullName ||
              "User"}
          </p>

          <div className="up-profile-badge">

            <Shield size={12} />

            <span>
              Profile{" "}
              {profileData?.completed
                ? "Completed"
                : "Incomplete"}
            </span>

          </div>

        </div>

        {!isEditing ? (
          <button
            className="up-edit-btn"
            onClick={
              handleEditClick
            }
          >
            <Edit2 size={16} />

            <span>
              Edit Profile
            </span>
          </button>
        ) : (
          <div className="up-edit-actions">

            <button
              className="up-save-btn"
              onClick={
                handleSaveClick
              }
              disabled={
                isSaving
              }
            >
              {isSaving ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                <Save size={16} />
              )}

              <span>
                {isSaving
                  ? "Saving..."
                  : "Save"}
              </span>
            </button>

            <button
              className="up-cancel-btn"
              onClick={
                handleCancelClick
              }
              disabled={
                isSaving
              }
            >
              <X size={16} />

              <span>
                Cancel
              </span>
            </button>

          </div>
        )}

      </div>

      {/* ================= MESSAGES ================= */}

      {saveError && (
        <div className="up-message up-message-error">
          <AlertCircle size={18} />

          <span>
            {saveError}
          </span>
        </div>
      )}

      {saveSuccess && (
        <div className="up-message up-message-success">
          <CheckCircle size={18} />

          <span>
            {saveSuccess}
          </span>
        </div>
      )}

      <div className="up-content">

        {/* ================= PERSONAL INFORMATION ================= */}

        <div className="up-section">

          <div className="up-section-header">

            <div className="up-section-header-left">

              <UserCircle size={20} />

              <h2>
                Personal Information
              </h2>

            </div>

          </div>

          <div className="up-info-grid">

            <div className="up-info-item">

              <div className="up-icon">
                <User size={20} />
              </div>

              <div className="up-info-content">

                <label>
                  Full Name
                </label>

                <p className="up-value">
                  {profileData?.fullName ||
                    registeredUser?.fullName ||
                    "Not specified"}
                </p>

              </div>

            </div>

            <div className="up-info-item">

              <div className="up-icon">
                <Mail size={20} />
              </div>

              <div className="up-info-content">

                <label>
                  Email Address
                </label>

                <p className="up-value">
                  {profileData?.email ||
                    registeredUser?.email ||
                    "Not specified"}
                </p>

              </div>

            </div>

            {renderField(
              "Age",
              profileData?.age,
              <Calendar size={20} />,
              isEditing,
              "age",
              "number"
            )}

            {renderField(
              "Gender",
              profileData?.gender,
              <Users size={20} />,
              isEditing,
              "gender",
              "select",
              [
                "Male",
                "Female",
                "Other",
              ]
            )}

          </div>

        </div>

        {/* ================= MEDICAL CONDITION ================= */}

        <div className="up-section">

          <div className="up-section-header">

            <div className="up-section-header-left">

              <Heart size={20} />

              <h2>
                Medical Condition
              </h2>

            </div>

          </div>

          <div className="up-info-grid up-info-grid--full">

            {renderField(
              "Disease / Condition",
              profileData?.diseases?.[0],
              <Stethoscope size={20} />,
              isEditing,
              "disease",
              "select",
              DISEASES
            )}

          </div>

        </div>

        {/* ================= EMERGENCY CONTACTS ================= */}

        <div className="up-section">

          <div className="up-section-header">

            <div className="up-section-header-left">

              <Phone size={20} />

              <h2>
                Emergency Contacts
              </h2>

            </div>

          </div>

          <div className="up-contacts-grid">

            {/* CONTACT 1 */}

            <div className="up-contact-card">

              <div className="up-contact-card-header">

                <span className="up-contact-badge">
                  Contact 1
                </span>

              </div>

              <div className="up-contact-card-body">

                {renderField(
                  "Relation",
                  profileData
                    ?.familyContacts?.[0]
                    ?.relation,
                  <Users size={18} />,
                  isEditing,
                  "relation1",
                  "select",
                  RELATIONS
                )}

                {renderField(
                  "Phone Number",
                  profileData
                    ?.familyContacts?.[0]
                    ?.phoneNumber,
                  <Phone size={18} />,
                  isEditing,
                  "contact1",
                  "tel"
                )}

              </div>

            </div>

            {/* CONTACT 2 */}

            <div className="up-contact-card">

              <div className="up-contact-card-header">

                <span className="up-contact-badge">
                  Contact 2
                </span>

              </div>

              <div className="up-contact-card-body">

                {renderField(
                  "Relation",
                  profileData
                    ?.familyContacts?.[1]
                    ?.relation,
                  <Users size={18} />,
                  isEditing,
                  "relation2",
                  "select",
                  RELATIONS
                )}

                {renderField(
                  "Phone Number",
                  profileData
                    ?.familyContacts?.[1]
                    ?.phoneNumber,
                  <Phone size={18} />,
                  isEditing,
                  "contact2",
                  "tel"
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default UserProfiles;
