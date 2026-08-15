import { useState } from "react";
import toast from "react-hot-toast";
import { completeProfile } from "../api/MockApi";

import {
  User,
  Phone,
  Users,
  Stethoscope,
  ChevronDown,
  Calendar,
} from "lucide-react";
import "./ComProfile.css";

// Mocked backend only accepts these exact disease values
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

// Mocked backend only accepts these exact relation values (max 2 family contacts)
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

const ComProfile = ({ onComplete }) => {

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    disease: "",

    relation1: "",
    contact1: "",

    relation2: "",
    contact2: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

    if (!formData.disease) {
      newErrors.disease = "Select medical condition";
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
      // ================= MOCK: PROFILE COMPLETE (no backend) =================
      const response = await completeProfile({
        age: Number(formData.age),
        diseases: [formData.disease], // kept as an array for parity with the old shape
        familyContacts: [
          { phoneNumber: formData.contact1, relation: formData.relation1 },
          { phoneNumber: formData.contact2, relation: formData.relation2 },
        ],
      });
      // ==============================================================================

      // Save locally only after a successful save
      localStorage.setItem("profileCompleted", "true");
      // Store flat frontend structure so UserProfiles page
      // can read fields like disease, relation1, contact1, etc.
      const profileToStore = {
        age: formData.age,
        gender: formData.gender,
        disease: formData.disease,
        relation1: formData.relation1,
        contact1: formData.contact1,
        relation2: formData.relation2,
        contact2: formData.contact2,
        completed: true,
        id: response.data?.id || Date.now(),
      };
      localStorage.setItem("profileData", JSON.stringify(profileToStore));

      toast.success(response.data?.message || "Profile completed successfully!", {
        duration: 3000,
      });

      if (onComplete) {
        onComplete();
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

              <div className="cp-select">

                <Stethoscope size={18} />

                <select
                  name="disease"
                  value={formData.disease}
                  onChange={handleChange}
                >
                  <option value="">Select medical condition</option>
                  {DISEASE_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>

              </div>

              {errors.disease && (
                <span className="cp-error">
                  {errors.disease}
                </span>
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