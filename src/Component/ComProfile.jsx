import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";

import {
  User,
  Phone,
  Users,
  Stethoscope,
  ChevronDown,
  Calendar,
  Check,
  Search,
  X,
} from "lucide-react";
import "./ComProfile.css";

// Backend accepts these exact disease values
const NO_DISEASE_OPTION = {
  label: "No Medical Condition / None",
  value: "NO_MEDICAL_CONDITION_NONE",
};

const DISEASE_OPTIONS = [
  { label: "Diabetes", value: "DIABETES" },
  { label: "Hypertension", value: "HYPERTENSION" },
  { label: "Heart Disease", value: "HEART_DISEASE" },
  { label: "Asthma", value: "ASTHMA" },
  { label: "Arthritis", value: "ARTHRITIS" },
  { label: "Kidney Disease", value: "KIDNEY_DISEASE" },
  { label: "Thyroid", value: "THYROID" },
  { label: "Cancer", value: "CANCER" },
  { label: "Alzheimer's", value: "ALZHEIMERS" },
  { label: "Other", value: "OTHER" },
];

const MEDICAL_CONDITION_OPTIONS = [NO_DISEASE_OPTION, ...DISEASE_OPTIONS];

// Backend accepts these exact relation values (max 2 emergency contacts)
const RELATION_OPTIONS = [
  { label: "Father", value: "FATHER" },
  { label: "Mother", value: "MOTHER" },
  { label: "Brother", value: "BROTHER" },
  { label: "Sister", value: "SISTER" },
  { label: "Spouse", value: "SPOUSE" },
  { label: "Son", value: "SON" },
  { label: "Daughter", value: "DAUGHTER" },
  { label: "Friend", value: "FRIEND" },
  { label: "Other", value: "OTHER" },
];

const readLocalJSON = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeGender = (value) => {
  if (!value) return "";
  return String(value).trim().toUpperCase();
};

const getDiseaseValues = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getDiseaseLabel = (value) =>
  MEDICAL_CONDITION_OPTIONS.find((option) => option.value === value)?.label ||
  String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getRequiredProfileFields = (profile) => [
  profile?.fullName,
  profile?.mobile,
  profile?.age,
  profile?.gender,
  profile?.diseaseCondition,
  profile?.contact1Relation,
  profile?.contact1Phone,
  profile?.contact2Relation,
  profile?.contact2Phone,
];

const getProfileCompletionPercent = (profile) => {
  const requiredFields = getRequiredProfileFields(profile);
  const completedFields = requiredFields.filter(Boolean).length;
  return Math.round((completedFields / requiredFields.length) * 100);
};

const isProfileComplete = (profile) =>
  getProfileCompletionPercent(profile) >= 100;

const normalizeProfile = (data = {}) => {
  const normalized = {
    ...data,
    gender: normalizeGender(data.gender),
    diseaseCondition: data.diseaseCondition || data.disease || data.diseases?.[0] || "",
    contact1Relation: data.contact1Relation || data.familyContacts?.[0]?.relation || "",
    contact1Phone: data.contact1Phone || data.familyContacts?.[0]?.phoneNumber || "",
    contact2Relation: data.contact2Relation || data.familyContacts?.[1]?.relation || "",
    contact2Phone: data.contact2Phone || data.familyContacts?.[1]?.phoneNumber || "",
  };

  normalized.completionPercentage = getProfileCompletionPercent(normalized);
  normalized.completed = isProfileComplete(normalized);

  return normalized;
};

const ComProfile = ({ onComplete }) => {
  const diseaseDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    disease: "",
    diseaseOther: "",

    relation1: "",
    contact1: "",

    relation2: "",
    contact2: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isDiseaseOpen, setIsDiseaseOpen] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState("");

  const selectedDiseaseValues = useMemo(
    () => getDiseaseValues(formData.disease),
    [formData.disease]
  );

  const isOtherDiseaseSelected = selectedDiseaseValues.includes("OTHER");
  const selectedDiseaseLabels = selectedDiseaseValues.map((value) =>
    value === "OTHER" && formData.diseaseOther.trim()
      ? formData.diseaseOther.trim()
      : getDiseaseLabel(value)
  );

  const filteredDiseaseOptions = MEDICAL_CONDITION_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(diseaseSearch.trim().toLowerCase())
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!diseaseDropdownRef.current?.contains(event.target)) {
        setIsDiseaseOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // --------------------------
  // Handle Input Change
  // --------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only allow digits for contact fields
    const processedValue = name === "contact1" || name === "contact2"
      ? value.replace(/\D/g, "")
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const updateDiseaseSelection = (nextValues, diseaseOther = formData.diseaseOther) => {
    setFormData((prev) => ({
      ...prev,
      disease: nextValues.join(","),
      diseaseOther,
    }));

    setErrors((prev) => ({
      ...prev,
      disease: "",
      diseaseOther: "",
    }));
  };

  const handleDiseaseOptionClick = (value) => {
    if (value === NO_DISEASE_OPTION.value) {
      updateDiseaseSelection([value], "");
      setIsDiseaseOpen(false);
      return;
    }

    if (value === "OTHER") {
      updateDiseaseSelection(["OTHER"], "");
      setIsDiseaseOpen(false);
      return;
    }

    const currentValues = selectedDiseaseValues.filter(
      (item) => item !== NO_DISEASE_OPTION.value && item !== "OTHER"
    );
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    updateDiseaseSelection(nextValues, "");
  };

  const handleDiseaseChipRemove = (value) => {
    updateDiseaseSelection(
      selectedDiseaseValues.filter((item) => item !== value),
      value === "OTHER" ? "" : formData.diseaseOther
    );
  };

  const handleOtherDiseaseChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      diseaseOther: value,
    }));

    setErrors((prev) => ({
      ...prev,
      diseaseOther: "",
    }));
  };

  // --------------------------
  // Validation
  // --------------------------

  const validate = () => {
    let newErrors = {};

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Please select gender";
    }

    // Contact 1
    if (!formData.relation1) {
      newErrors.relation1 = "Select relation";
    }

    if (!formData.contact1) {
      newErrors.contact1 = "Contact number is required";
    } else if (!phoneRegex.test(formData.contact1)) {
      newErrors.contact1 = "Enter a valid 10-digit number starting with 6/7/8/9";
    }

    // Contact 2
    if (!formData.relation2) {
      newErrors.relation2 = "Select relation";
    }

    if (!formData.contact2) {
      newErrors.contact2 = "Contact number is required";
    } else if (!phoneRegex.test(formData.contact2)) {
      newErrors.contact2 = "Enter a valid 10-digit number starting with 6/7/8/9";
    }

    // Duplicate contacts
    if (
      formData.contact1 &&
      formData.contact2 &&
      formData.contact1 === formData.contact2
    ) {
      newErrors.contact2 = "Contact numbers cannot be the same";
    }

    // Duplicate relations
    if (
      formData.relation1 &&
      formData.relation2 &&
      formData.relation1 === formData.relation2
    ) {
      newErrors.relation2 = "Relations cannot be the same";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // --------------------------
  // Save Profile
  // --------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const registeredUser = readLocalJSON("registeredUser", {});
      const payload = {
        fullName: registeredUser.fullName || "",
        mobile:
          registeredUser.mobile ||
          registeredUser.phoneNumber ||
          registeredUser.contactNumber ||
          "",
        age: Number(formData.age),
        gender: normalizeGender(formData.gender),
        diseaseCondition: isOtherDiseaseSelected
          ? formData.diseaseOther.trim()
          : formData.disease,
        contact1Relation: formData.relation1,
        contact1Phone: formData.contact1,
        contact2Relation: formData.relation2,
        contact2Phone: formData.contact2,
      };

      const response = await api.put("/api/profile", payload);
      const profileToStore = normalizeProfile({
        ...payload,
        ...(response?.data || {}),
      });

      localStorage.setItem("profileCompleted", profileToStore.completed ? "true" : "false");
      localStorage.setItem("profileData", JSON.stringify(profileToStore));

      toast.success(response?.data?.message || "Profile completed successfully!", {
        duration: 3000,
      });

      if (onComplete) {
        onComplete(profileToStore);
      }
    } catch (error) {
      console.log("Profile Complete error:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.message || "Failed to save profile. Please try again.",
        { duration: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-wrapper">

      <div className="cp-overlay">

        <div className="cp-modal">

          {/* Header */}

          <div className="cp-header">

            <div className="cp-icon">
              <User size={28} />
            </div>

            <h2>Complete Your Profile</h2>

            <p>
              Please provide some basic information
              <br />
              to get started
            </p>

          </div>

          <form onSubmit={handleSubmit} className="cp-form">

            {/* Row 1: Age & Gender */}

            <div className="cp-row">

              {/* Age */}

              <div className="cp-group">

                <label>Age</label>

                <div className="cp-input">

                  <Calendar size={18} />

                  <input
                    type="number"
                    name="age"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={handleChange}
                  />

                </div>

                {errors.age && (
                  <span className="cp-error">
                    {errors.age}
                  </span>
                )}

              </div>

              {/* Gender */}

              <div className="cp-group">

                <label>Gender</label>

                <div className="cp-select">

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Gender
                    </option>

                    <option>Male</option>

                    <option>Female</option>

                    <option>Other</option>

                  </select>

                  <ChevronDown size={18} />

                </div>

                {errors.gender && (
                  <span className="cp-error">
                    {errors.gender}
                  </span>
                )}

              </div>

            </div>

            {/* Medical Condition */}

            <div className="cp-group cp-full-width">

              <label>Disease / Medical Condition</label>

              <div
                ref={diseaseDropdownRef}
                className={`cp-medical-select ${
                  isDiseaseOpen ? "is-open" : ""
                } ${errors.disease ? "has-error" : ""}`}
              >
                <button
                  type="button"
                  className="cp-medical-trigger"
                  onClick={() => setIsDiseaseOpen((current) => !current)}
                  aria-expanded={isDiseaseOpen}
                >
                  <Stethoscope size={18} />

                  <span className="cp-medical-trigger-content">
                    {selectedDiseaseLabels.length ? (
                      selectedDiseaseLabels.map((label, index) => (
                        <span
                          key={`${selectedDiseaseValues[index]}-${label}`}
                          className="cp-medical-chip"
                        >
                          {label}
                          <span
                            role="button"
                            tabIndex={0}
                            className="cp-chip-remove"
                            aria-label={`Remove ${label}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDiseaseChipRemove(selectedDiseaseValues[index]);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                handleDiseaseChipRemove(selectedDiseaseValues[index]);
                              }
                            }}
                          >
                            <X size={12} />
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="cp-medical-placeholder">
                        Select disease / condition
                      </span>
                    )}
                  </span>

                  <ChevronDown size={18} className="cp-medical-caret" />
                </button>

                {isDiseaseOpen && (
                  <div className="cp-medical-menu">
                    <div className="cp-medical-search">
                      <Search size={14} />
                      <input
                        type="text"
                        value={diseaseSearch}
                        placeholder="Search disease / condition..."
                        onChange={(event) => setDiseaseSearch(event.target.value)}
                      />
                    </div>

                    <div className="cp-medical-options">
                      {filteredDiseaseOptions.map((option) => {
                        const selected = selectedDiseaseValues.includes(option.value);

                        return (
                          <button
                            type="button"
                            key={option.value}
                            className={`cp-medical-option ${
                              selected ? "selected" : ""
                            }`}
                            onClick={() => handleDiseaseOptionClick(option.value)}
                          >
                            <span className="cp-medical-check">
                              {selected && <Check size={13} />}
                            </span>
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {errors.disease && (
                <span className="cp-error">
                  {errors.disease}
                </span>
              )}

              {isOtherDiseaseSelected && (
                <div className="cp-other-condition">
                  <label>
                    Specify Medical Condition
                  </label>
                  <input
                    type="text"
                    value={formData.diseaseOther}
                    placeholder="PCOS"
                    onChange={(event) =>
                      handleOtherDiseaseChange(event.target.value)
                    }
                  />
                  {errors.diseaseOther && (
                    <span className="cp-error">
                      {errors.diseaseOther}
                    </span>
                  )}
                </div>
              )}

            </div>

            {/* Emergency Contacts */}

            <h4 className="cp-section-title">
              Emergency Contacts
            </h4>

            {/* Row 2: Emergency Contacts */}

            <div className="cp-row">

              {/* Contact 1 */}

              <div className="cp-contact-card">

                <h5>Contact 1</h5>

                <div className="cp-select">

                  <Users size={18} />

                  <select
                    name="relation1"
                    value={formData.relation1}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Relation
                    </option>

                    {RELATION_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}

                  </select>

                </div>

                {errors.relation1 && (
                  <span className="cp-error">
                    {errors.relation1}
                  </span>
                )}

                <div className="cp-input">

                  <Phone size={18} />

                  <input
                    type="text"
                    name="contact1"
                    placeholder="Contact Number"
                    value={formData.contact1}
                    onChange={handleChange}
                    maxLength={10}
                  />

                </div>

                {errors.contact1 && (
                  <span className="cp-error">
                    {errors.contact1}
                  </span>
                )}

              </div>

              {/* Contact 2 */}

              <div className="cp-contact-card">

                <h5>Contact 2</h5>

                <div className="cp-select">

                  <Users size={18} />

                  <select
                    name="relation2"
                    value={formData.relation2}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Relation
                    </option>

                    {RELATION_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}

                  </select>

                </div>

                {errors.relation2 && (
                  <span className="cp-error">
                    {errors.relation2}
                  </span>
                )}

                <div className="cp-input">

                  <Phone size={18} />

                  <input
                    type="text"
                    name="contact2"
                    placeholder="Contact Number"
                    value={formData.contact2}
                    onChange={handleChange}
                    maxLength={10}
                  />

                </div>

                {errors.contact2 && (
                  <span className="cp-error">
                    {errors.contact2}
                  </span>
                )}

              </div>

            </div>

            {/* Save Button */}

            <button
              type="submit"
              className="cp-save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>

          </form>

          {/* Footer Note */}
          
          <div className="cp-footer-note">
            <p>Your information is secure and will be used only for emergency purposes.</p>
          </div>

        </div>

      </div>

    </div>

  );
};

export default ComProfile;
