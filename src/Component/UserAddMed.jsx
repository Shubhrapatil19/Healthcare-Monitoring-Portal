import { useState } from "react";

import "./UserAddMed.css";

const AddMedicineModal = ({ onClose }) => {
const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "",
    timing: "",
    timingPeriod: "AM",
    frequency: "",
    startDate: "",
    endDate: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  };

const buildTiming24 = (time24, period) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let h = parseInt(hours, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minutes}`;
  };

  const handleTimingChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    // Rebuild the 24-hour timing string from time + period
    if (updated.timing && field === "timingPeriod") {
      updated.timing = buildTiming24(updated.timing, value);
    }
    setFormData(updated);
    setErrors((prev) => ({ ...prev, timing: "" }));
  };

  const validate = () => {
    let temp = {};

    if (!formData.medicineName.trim())
      temp.medicineName = "Medicine name is required";

    if (!formData.dosage.trim())
      temp.dosage = "Dosage is required";

    if (!formData.timing)
      temp.timing = "Timing is required";

    if (!formData.frequency)
      temp.frequency = "Select frequency";

    if (!formData.startDate)
      temp.startDate = "Start date is required";

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      console.log("Medicine Data:", formData);
      localStorage.setItem("medicineAdded", "true");
      onClose(formData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Add New Medicine</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Medicine Name *</label>
            <input
              type="text"
              name="medicineName"
              placeholder="Enter medicine name"
              value={formData.medicineName}
              onChange={handleChange}
            />
            <span className="error">{errors.medicineName}</span>
          </div>

          <div className="form-group">
            <label>Dosage *</label>
            <input
              type="text"
              name="dosage"
              placeholder="Enter dosage (e.g., 500 mg)"
              value={formData.dosage}
              onChange={handleChange}
            />
            <span className="error">{errors.dosage}</span>
          </div>

<div className="form-group">
            <label>Timing *</label>
            <div className="time-picker-simple">
              <input
                type="time"
                name="timing"
                value={formData.timing}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, timing: val }));
                  setErrors((prev) => ({ ...prev, timing: "" }));
                }}
                className="time-picker-simple-input"
              />
              <select
                name="timingPeriod"
                value={formData.timingPeriod}
                onChange={(e) => handleTimingChange("timingPeriod", e.target.value)}
                className="time-picker-simple-ampm"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <span className="error">{errors.timing}</span>
          </div>

          <div className="form-group">
            <label>Frequency *</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
            >
              <option value="">Select frequency</option>
              <option>Once a day</option>
              <option>Twice a day</option>
              <option>Three times a day</option>
              <option>As needed</option>
              <option>Weekly</option>
            </select>
            <span className="error">{errors.frequency}</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
              <span className="error">{errors.startDate}</span>
            </div>

            <div className="form-group">
              <label>End Date (Optional)</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              name="notes"
              placeholder="Enter notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Medicine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineModal;