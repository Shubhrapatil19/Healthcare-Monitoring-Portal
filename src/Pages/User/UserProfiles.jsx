import { useState, useMemo } from "react";
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
import api from "../../api/axiosInstance";
import "./UserProfiles.css";

const UserProfiles = () => {
  const [profileData, setProfileData] = useState(() => {
    const savedProfile = localStorage.getItem("profileData");
    return savedProfile ? JSON.parse(savedProfile) : null;
  });

  const registeredUser = useMemo(() => {
    try {
      const saved = localStorage.getItem("registeredUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [editFormData, setEditFormData] = useState(() => {
    const savedProfile = localStorage.getItem("profileData");
    const parsed = savedProfile ? JSON.parse(savedProfile) : {};
    return {
      age: parsed.age || "",
      gender: parsed.gender || "",
      disease: parsed.disease || "",
      relation1: parsed.relation1 || "",
      contact1: parsed.contact1 || "",
      relation2: parsed.relation2 || "",
      contact2: parsed.contact2 || "",
    };
  });

  if (!profileData) {
    return (
      <div className="up-container">
        <div className="up-loading">
          <Loader2 size={32} className="spin" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    const name = registeredUser?.fullName || "User";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditClick = () => {
    setSaveError("");
    setSaveSuccess("");
    setEditFormData({
      age: profileData.age || "",
      gender: profileData.gender || "",
      disease: profileData.disease || "",
      relation1: profileData.relation1 || "",
      contact1: profileData.contact1 || "",
      relation2: profileData.relation2 || "",
      contact2: profileData.contact2 || "",
    });
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[6-9]\d{9}$/;

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

    if (!editFormData.disease) {
      newErrors.disease = "Disease / condition is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const isFirstSave = !profileData.completed && !profileData.id;
      const endpoint = isFirstSave ? "/profile/complete" : "/profile/update";

      // Backend (ProfileRequest DTO) expects:
      //   age: Integer
      //   diseases: List<Disease>   (array, not a single string)
      //   familyContacts: List<{ phoneNumber, relation }>  (array of objects, max 2)
      const payload = {
        age: Number(editFormData.age) || 0,
        diseases: editFormData.disease ? [editFormData.disease] : [],
        familyContacts: [
          {
            phoneNumber: editFormData.contact1 || "",
            relation: editFormData.relation1 || "",
          },
          {
            phoneNumber: editFormData.contact2 || "",
            relation: editFormData.relation2 || "",
          },
        ],
      };

      const res = isFirstSave
        ? await api.post(endpoint, payload)
        : await api.put(endpoint, payload);

      // Keep the local/UI shape flat (age, disease, relation1, contact1, ...)
      // regardless of exactly what the backend response shape looks like,
      // since the rest of this component reads profileData in the flat form.
      const nextProfile = {
        ...profileData,
        age: editFormData.age,
        gender: editFormData.gender,
        disease: editFormData.disease,
        relation1: editFormData.relation1,
        contact1: editFormData.contact1,
        relation2: editFormData.relation2,
        contact2: editFormData.contact2,
        completed: true,
        ...(res.data && typeof res.data === "object" ? res.data : {}),
      };

      localStorage.setItem("profileData", JSON.stringify(nextProfile));
      setProfileData(nextProfile);
      setIsEditing(false);
      setSaveSuccess("Profile updated successfully!");
      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    setEditFormData({
      age: profileData.age || "",
      gender: profileData.gender || "",
      disease: profileData.disease || "",
      relation1: profileData.relation1 || "",
      contact1: profileData.contact1 || "",
      relation2: profileData.relation2 || "",
      contact2: profileData.contact2 || "",
    });
    setSaveError("");
    setSaveSuccess("");
    setErrors({});
    setIsEditing(false);
  };

  const renderField = (label, value, icon, editMode, editField, editType, options) => {
    return (
      <div className="up-info-item">
        <div className="up-icon">{icon}</div>
        <div className="up-info-content">
          <label>{label}</label>
          {editMode ? (
            editType === "select" ? (
              <select
                value={editFormData[editField] || ""}
                onChange={(e) => handleInputChange(editField, e.target.value)}
                className={`up-input-field ${errors[editField] ? "up-input-error" : ""}`}
              >
                <option value="">Select {label}</option>
                {options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={editType || "text"}
                value={editFormData[editField] || ""}
                onChange={(e) =>
                  handleInputChange(
                    editField,
                    editField.includes("contact")
                      ? e.target.value.replace(/\D/g, "")
                      : e.target.value
                  )
                }
                className={`up-input-field ${errors[editField] ? "up-input-error" : ""}`}
                placeholder={`Enter ${label.toLowerCase()}`}
                maxLength={editField.includes("contact") ? 10 : undefined}
              />
            )
          ) : (
            <p className="up-value">{value || "Not specified"}</p>
          )}
          {errors[editField] && <span className="up-error">{errors[editField]}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="up-container">
      {/* Profile Header with Avatar */}
      <div className="up-profile-header">
        <div className="up-avatar-section">
          <div className="up-avatar">
            <span className="up-avatar-text">{getInitials()}</span>
          </div>
          <p className="up-avatar-email">
            <Mail size={12} />
            {registeredUser?.email || "Not specified"}
          </p>
        </div>
        <div className="up-profile-header-info">
          <p className="up-profile-name">{registeredUser?.fullName || "User"}</p>
          <div className="up-profile-badge">
            <Shield size={12} />
            <span>Profile {profileData.completed ? "Completed" : "Incomplete"}</span>
          </div>
        </div>
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

      {/* Status Messages */}
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

      <div className="up-content">
        {/* Personal Information Section */}
        <div className="up-section">
          <div className="up-section-header">
            <div className="up-section-header-left">
              <UserCircle size={20} />
              <h2>Personal Information</h2>
            </div>
          </div>

          <div className="up-info-grid">
            <div className="up-info-item">
              <div className="up-icon">
                <User size={20} />
              </div>
              <div className="up-info-content">
                <label>Full Name</label>
                <p className="up-value">{registeredUser?.fullName || "Not specified"}</p>
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <Mail size={20} />
              </div>
              <div className="up-info-content">
                <label>Email Address</label>
                <p className="up-value">{registeredUser?.email || "Not specified"}</p>
              </div>
            </div>

            {renderField(
              "Age",
              profileData.age,
              <Calendar size={20} />,
              isEditing,
              "age",
              "number"
            )}

            {renderField(
              "Gender",
              profileData.gender,
              <Users size={20} />,
              isEditing,
              "gender",
              "select",
              ["Male", "Female", "Other"]
            )}
          </div>
        </div>

        {/* Medical Condition Section */}
        <div className="up-section">
          <div className="up-section-header">
            <div className="up-section-header-left">
              <Heart size={20} />
              <h2>Medical Condition</h2>
            </div>
          </div>

          <div className="up-info-grid up-info-grid--full">
            {renderField(
              "Disease / Condition",
              profileData.disease,
              <Stethoscope size={20} />,
              isEditing,
              "disease",
              "select",
              [
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
              ]
            )}
          </div>
        </div>

        {/* Emergency Contacts Section */}
        <div className="up-section">
          <div className="up-section-header">
            <div className="up-section-header-left">
              <Phone size={20} />
              <h2>Emergency Contacts</h2>
            </div>
          </div>

          <div className="up-contacts-grid">
            {/* Contact 1 */}
            <div className="up-contact-card">
              <div className="up-contact-card-header">
                <span className="up-contact-badge">Contact 1</span>
              </div>
              <div className="up-contact-card-body">
                {renderField(
                  "Relation",
                  profileData.relation1,
                  <Users size={18} />,
                  isEditing,
                  "relation1",
                  "select",
                  ["FATHER", "MOTHER", "BROTHER", "SISTER", "SPOUSE", "SON", "DAUGHTER", "FRIEND", "Guardian"]
                )}
                {renderField(
                  "Phone Number",
                  profileData.contact1,
                  <Phone size={18} />,
                  isEditing,
                  "contact1",
                  "tel"
                )}
              </div>
            </div>

            {/* Contact 2 */}
            <div className="up-contact-card">
              <div className="up-contact-card-header">
                <span className="up-contact-badge">Contact 2</span>
              </div>
              <div className="up-contact-card-body">
                {renderField(
                  "Relation",
                  profileData.relation2,
                  <Users size={18} />,
                  isEditing,
                  "relation2",
                  "select",
                  ["FATHER", "MOTHER", "BROTHER", "SISTER", "SPOUSE", "SON", "DAUGHTER", "FRIEND", "Guardian"]
                )}
                {renderField(
                  "Phone Number",
                  profileData.contact2,
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