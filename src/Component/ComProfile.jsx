import { useState } from "react";

import {
  User,
  Phone,
  Users,
  Stethoscope,
  ChevronDown,
} from "lucide-react";
import "./ComProfile.css";

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

  // --------------------------
  // Handle Input Change
  // --------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Please select gender";
    }

    if (!formData.disease.trim()) {
      newErrors.disease = "Enter medical condition";
    }

    if (!formData.relation1) {
      newErrors.relation1 = "Select relation";
    }

    if (!formData.contact1) {
      newErrors.contact1 = "Enter contact number";
    } else if (!/^[0-9]{10}$/.test(formData.contact1)) {
      newErrors.contact1 = "Enter valid number";
    }

    if (!formData.relation2) {
      newErrors.relation2 = "Select relation";
    }

    if (!formData.contact2) {
      newErrors.contact2 = "Enter contact number";
    } else if (!/^[0-9]{10}$/.test(formData.contact2)) {
      newErrors.contact2 = "Enter valid number";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // --------------------------
  // Save Profile
  // --------------------------

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    localStorage.setItem("profileCompleted", "true");

    localStorage.setItem(
      "profileData",
      JSON.stringify(formData)
    );

    if (onComplete) {
      onComplete();
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

          <form onSubmit={handleSubmit}>

            {/* Age */}

            <div className="cp-group">

              <label>Age</label>

              <input
                type="number"
                name="age"
                placeholder="Enter your age"
                value={formData.age}
                onChange={handleChange}
              />

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

            {/* Medical Condition */}

            <div className="cp-group">

              <label>Disease / Medical Condition</label>

              <div className="cp-input">

                <Stethoscope size={18} />

                <input
                  type="text"
                  name="disease"
                  placeholder="Ex. Diabetes"
                  value={formData.disease}
                  onChange={handleChange}
                />

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

                  <option>Father</option>

                  <option>Mother</option>

                  <option>Brother</option>

                  <option>Sister</option>

                  <option>Spouse</option>

                  <option>Friend</option>

                  <option>Guardian</option>

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

                  <option>Father</option>

                  <option>Mother</option>

                  <option>Brother</option>

                  <option>Sister</option>

                  <option>Spouse</option>

                  <option>Friend</option>

                  <option>Guardian</option>

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

            {/* Save Button */}

            <button
              type="submit"
              className="cp-save-btn"
            >
              Save & Continue
            </button>

          </form>

        </div>

      </div>

    </div>
  );
};

export default ComProfile;