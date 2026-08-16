import { X } from "lucide-react";

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
        <div className="admin-add-user-header">
          <h2>Add New Patient</h2>

          <button
            type="button"
            className="admin-add-user-close"
            aria-label="Close add patient modal"
            disabled={saving}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="admin-add-user-body">
          <div className="admin-add-user-field">
            <label>
              Full Name <span>*</span>
            </label>

            <input
              type="text"
              value={form.name}
              placeholder="Enter patient name"
              onChange={(event) =>
                onChange(
                  "name",
                  event.target.value
                )
              }
            />

            {errors.name && (
              <small>{errors.name}</small>
            )}
          </div>

          <div className="admin-add-user-field">
            <label>
              Email Address <span>*</span>
            </label>

            <input
              type="email"
              value={form.email}
              placeholder="Enter email address"
              onChange={(event) =>
                onChange(
                  "email",
                  event.target.value
                )
              }
            />

            {errors.email && (
              <small>{errors.email}</small>
            )}
          </div>

          <div className="admin-add-user-field">
            <label>
              Phone Number <span>*</span>
            </label>

            <input
              type="text"
              value={form.phone}
              placeholder="Enter phone number"
              onChange={(event) =>
                onChange(
                  "phone",
                  event.target.value
                )
              }
            />

            {errors.phone && (
              <small>{errors.phone}</small>
            )}
          </div>

          <div className="admin-add-user-row">
            <div className="admin-add-user-field">
              <label>
                Date of Birth <span>*</span>
              </label>

              <input
                type="date"
                value={form.dob}
                onChange={(event) =>
                  onChange(
                    "dob",
                    event.target.value
                  )
                }
              />

              {errors.dob && (
                <small>{errors.dob}</small>
              )}
            </div>

            <div className="admin-add-user-field">
              <label>
                Age <span>*</span>
              </label>

              <input
                type="number"
                min="1"
                max="120"
                value={form.age}
                placeholder="Enter age"
                onChange={(event) =>
                  onChange(
                    "age",
                    event.target.value
                  )
                }
              />

              {errors.age && (
                <small>{errors.age}</small>
              )}
            </div>
          </div>

          <div className="admin-add-user-field">
            <label>
              Gender <span>*</span>
            </label>

            <select
              value={form.gender}
              onChange={(event) =>
                onChange(
                  "gender",
                  event.target.value
                )
              }
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {errors.gender && (
              <small>{errors.gender}</small>
            )}
          </div>

          <div className="admin-add-user-field">
            <label>
              Disease / Medical Condition
            </label>

            <textarea
              rows="3"
              value={form.disease}
              placeholder="Enter disease or medical condition"
              onChange={(event) =>
                onChange(
                  "disease",
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <div className="admin-add-user-footer">
          <button
            type="button"
            className="admin-add-user-cancel"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="admin-add-user-save"
            disabled={saving}
          >
            {saving
              ? "Adding..."
              : "Add Patient"}
          </button>
        </div>
      </form>
    </div>
  );
}
