import {
  Activity,
  Calendar,
  HeartPulse,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  X,
  Stethoscope,
  FileText,
} from "lucide-react";

import "./AdminAddUser.css";

export default function AdminAddUser({
  form,
  errors,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  const handleOverlayClick = () => {
    if (!saving) {
      onClose();
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="admin-add-user-overlay"
      onClick={handleOverlayClick}
    >
      <form
        className="admin-add-user-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {/* LEFT PANEL - Branding & Info */}
        <aside className="admin-add-user-panel">
          <div className="panel-brand">
            <div className="panel-logo">
              <Stethoscope size={28} />
            </div>
            <div className="panel-brand-text">
              <span className="panel-label">Healthcare Portal</span>
              <h1 className="panel-title">Patient Registry</h1>
            </div>
          </div>

          <div className="panel-divider" />

          <div className="panel-info">
            <h3>New Patient Record</h3>
            <p>
              Complete the form to register a new patient in the system. All fields marked with * are required.
            </p>
          </div>

          <div className="panel-features">
            <div className="feature-item">
              <div className="feature-icon">
                <ShieldCheck size={18} />
              </div>
              <div className="feature-text">
                <strong>Verified Profile</strong>
                <span>Secure patient data</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Activity size={18} />
              </div>
              <div className="feature-text">
                <strong>Care Tracking</strong>
                <span>Monitor health metrics</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <HeartPulse size={18} />
              </div>
              <div className="feature-text">
                <strong>Medical Support</strong>
                <span>Condition & allergy notes</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <FileText size={18} />
              </div>
              <div className="feature-text">
                <strong>Reports Ready</strong>
                <span>Generate patient reports</span>
              </div>
            </div>
          </div>

          <div className="panel-footer">
            <div className="patient-preview">
              <div className="preview-avatar">
                {getInitials(form.name)}
              </div>
              <div className="preview-info">
                <span className="preview-name">
                  {form.name || "New Patient"}
                </span>
                <span className="preview-status">
                  {form.name ? "Ready to save" : "Awaiting details"}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL - Form */}
        <section className="admin-add-user-form-panel">
          <div className="form-header">
            <div className="form-header-left">
              <span className="form-eyebrow">Registration</span>
              <h2>Patient Information</h2>
            </div>

            <button
              type="button"
              className="form-close-btn"
              aria-label="Close add patient modal"
              disabled={saving}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="form-body">
            {/* Identity Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-icon">
                  <User size={18} />
                </div>
                <h3>Identity Details</h3>
              </div>

              <div className="form-grid">
                <div className={`form-field ${errors.name ? "has-error" : ""}`}>
                  <label htmlFor="name">
                    Full Name <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      placeholder="Enter patient's full name"
                      onChange={(event) =>
                        onChange(
                          "name",
                          event.target.value
                        )
                      }
                    />
                  </div>
                  {errors.name && (
                    <span className="error-msg">{errors.name}</span>
                  )}
                </div>

                <div className={`form-field ${errors.gender ? "has-error" : ""}`}>
                  <label htmlFor="gender">
                    Gender <span className="required">*</span>
                  </label>
                  <div className="input-wrapper select-wrapper">
                    <Users size={18} className="input-icon" />
                    <select
                      id="gender"
                      value={form.gender}
                      onChange={(event) =>
                        onChange(
                          "gender",
                          event.target.value
                        )
                      }
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {errors.gender && (
                    <span className="error-msg">{errors.gender}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-icon">
                  <Phone size={18} />
                </div>
                <h3>Contact Information</h3>
              </div>

              <div className="form-grid">
                <div className={`form-field ${errors.email ? "has-error" : ""}`}>
                  <label htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      placeholder="patient@example.com"
                      onChange={(event) =>
                        onChange(
                          "email",
                          event.target.value
                        )
                      }
                    />
                  </div>
                  {errors.email && (
                    <span className="error-msg">{errors.email}</span>
                  )}
                </div>

                <div className={`form-field ${errors.phone ? "has-error" : ""}`}>
                  <label htmlFor="phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      placeholder="+91 98765 43210"
                      onChange={(event) =>
                        onChange(
                          "phone",
                          event.target.value
                        )
                      }
                    />
                  </div>
                  {errors.phone && (
                    <span className="error-msg">{errors.phone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Health Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-icon">
                  <HeartPulse size={18} />
                </div>
                <h3>Health Snapshot</h3>
              </div>

              <div className="form-grid compact">
                <div className={`form-field ${errors.dob ? "has-error" : ""}`}>
                  <label htmlFor="dob">
                    Date of Birth <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Calendar size={18} className="input-icon" />
                    <input
                      id="dob"
                      type="date"
                      value={form.dob}
                      onChange={(event) =>
                        onChange(
                          "dob",
                          event.target.value
                        )
                      }
                    />
                  </div>
                  {errors.dob && (
                    <span className="error-msg">{errors.dob}</span>
                  )}
                </div>

                <div className={`form-field ${errors.age ? "has-error" : ""}`}>
                  <label htmlFor="age">
                    Age <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Activity size={18} className="input-icon" />
                    <input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      value={form.age}
                      placeholder="Years"
                      onChange={(event) =>
                        onChange(
                          "age",
                          event.target.value
                        )
                      }
                    />
                  </div>
                  {errors.age && (
                    <span className="error-msg">{errors.age}</span>
                  )}
                </div>
              </div>

              <div className="form-field full-width">
                <label htmlFor="disease">
                  Disease / Medical Condition
                </label>
                <div className="input-wrapper textarea-wrapper">
                  <HeartPulse size={18} className="input-icon" />
                  <textarea
                    id="disease"
                    rows="3"
                    value={form.disease}
                    placeholder="Add conditions, allergies, or care notes"
                    onChange={(event) =>
                      onChange(
                        "disease",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="btn-cancel"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-submit"
              disabled={saving}
            >
              <Save size={18} />
              {saving ? "Saving..." : "Add Patient"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
