import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";

import "./UserAddMed.css";

// How many doses each frequency implies, and whether timing is required
const FREQUENCY_CONFIG = {
  "Once a day": { doses: 1, required: true },
  "Twice a day": { doses: 2, required: true },
  "Three times a day": { doses: 3, required: true },
  "As needed": { doses: 1, required: false },
  "Weekly": { doses: 1, required: true },
};

// Backend (POST /medicine/add) only supports these exact frequency values.
// "As needed" and "Weekly" are NOT supported yet — confirm with backend
// team before enabling them for real submissions.
const FREQUENCY_TO_BACKEND = {
  "Once a day": "ONCE_DAILY",
  "Twice a day": "TWICE_DAILY",
  "Three times a day": "THRICE_DAILY",
  // "As needed": not supported by backend yet
  // "Weekly": not supported by backend yet
};

// Build evenly-spaced default dose times starting from an 8 AM baseline.
// e.g. Three times a day -> 08:00, 16:00, 00:00 (8 hours apart)
const buildSuggestedTimings = (doseCount) => {
  if (doseCount <= 0) return [];
  const startHour = 8;
  const intervalHours = 24 / doseCount;
  const timings = [];
  for (let i = 0; i < doseCount; i++) {
    const hour = Math.round(startHour + i * intervalHours) % 24;
    timings.push({ time: `${String(hour).padStart(2, "0")}:00` });
  }
  return timings;
};

// The <input type="time"> value is always stored as 24-hour "HH:MM".
// These helpers derive the 12-hour display + AM/PM used by the select,
// same as the original single-field timing picker.
const to12Hour = (time24) => {
  if (!time24) return { hour12: null, minute: "00", period: "AM" };
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: String(m).padStart(2, "0"), period };
};

const buildTiming24 = (time24, period) => {
  if (!time24) return "";
  const { hour12, minute } = to12Hour(time24);
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
};

const AddMedicineModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "",
    timings: [], // [{ time: "HH:MM" }, ...] - one entry per dose
    frequency: "",
    startDate: "",
    endDate: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const handleFrequencyChange = (e) => {
    const freq = e.target.value;
    const config = FREQUENCY_CONFIG[freq];
    const doseCount = config ? config.doses : 0;

    setFormData((prev) => ({
      ...prev,
      frequency: freq,
      // Auto-suggest timings whenever the dose count changes so the user
      // always sees the right number of slots, evenly spaced.
      timings: buildSuggestedTimings(doseCount)
    }));
    setErrors((prev) => ({ ...prev, frequency: "", timing: "" }));
  };

  const handleTimingChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.timings];
      updated[index] = { ...updated[index], time: value };
      return { ...prev, timings: updated };
    });
    setErrors((prev) => ({ ...prev, timing: "" }));
  };

  // Switching the AM/PM select rebuilds that dose's 24-hour time string,
  // keeping the hour/minute the same and just flipping the half of day.
  const handleTimingPeriodChange = (index, newPeriod) => {
    setFormData((prev) => {
      const updated = [...prev.timings];
      const current = updated[index]?.time || "";
      updated[index] = { ...updated[index], time: buildTiming24(current, newPeriod) };
      return { ...prev, timings: updated };
    });
    setErrors((prev) => ({ ...prev, timing: "" }));
  };

  const validate = () => {
    let temp = {};

    if (!formData.medicineName.trim())
      temp.medicineName = "Medicine name is required";

    if (!formData.dosage.trim())
      temp.dosage = "Dosage is required";

    if (!formData.frequency)
      temp.frequency = "Select frequency";

    const config = FREQUENCY_CONFIG[formData.frequency];
    if (config && config.required) {
      const hasEmptyTiming =
        formData.timings.length === 0 ||
        formData.timings.some((t) => !t.time);
      if (hasEmptyTiming) temp.timing = "Please set a time for every dose";
    }

    if (!formData.startDate)
      temp.startDate = "Start date is required";

    // Frequencies not yet supported by backend
    if (formData.frequency && !FREQUENCY_TO_BACKEND[formData.frequency]) {
      temp.frequency = `"${formData.frequency}" is not supported by the backend yet. Please choose Once/Twice/Three times a day.`;
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // ================= API CALL: ADD MEDICINE =================
      // Endpoint: POST /medicine/add (requires JWT header - auto attached
      // by axiosInstance interceptor)
      // NOTE: Backend only takes a single "startTiming" field (HH:MM:SS).
      // We send the first dose's time as the anchor; the backend is
      // expected to derive further doses from "frequency" itself.
      const firstTime = formData.timings[0]?.time || "";
      const startTiming = firstTime ? `${firstTime}:00` : "";

      const response = await api.post("/medicine/add", {
        medicineName: formData.medicineName,
        dosage: formData.dosage,
        startTiming: startTiming,
        frequency: FREQUENCY_TO_BACKEND[formData.frequency],
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        notes: formData.notes,
      });
      // ==============================================================

      localStorage.setItem("medicineAdded", "true");

      toast.success(response.data?.message || "Medicine added successfully!", {
        duration: 3000,
      });

      onClose(formData);
    } catch (error) {
      console.log("Add Medicine API Error:", error.message);
      toast.error(
        error.response?.data?.message || "Failed to add medicine. Please try again.",
        { duration: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const doseCount = formData.timings.length;
  const intervalHours = doseCount > 1 ? Math.round(24 / doseCount) : null;

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
            <label>Frequency *</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleFrequencyChange}
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

          {doseCount > 0 && (
            <div className="form-group">
              <label>
                Dose Timing{doseCount > 1 ? "s" : ""}
                {FREQUENCY_CONFIG[formData.frequency]?.required ? " *" : ""}
                {intervalHours && (
                  <span className="interval-badge">
                    ~{intervalHours}h apart
                  </span>
                )}
              </label>

              <div className="timing-list">
                {formData.timings.map((t, idx) => {
                  const { period } = to12Hour(t.time);
                  return (
                    <div className="timing-row" key={idx}>
                      <span className="timing-row-label">
                        Dose {idx + 1}
                      </span>
                      <div className="time-picker-simple">
                        <input
                          type="time"
                          value={t.time}
                          onChange={(e) => handleTimingChange(idx, e.target.value)}
                          className="time-picker-simple-input"
                        />
                        <select
                          value={period}
                          onChange={(e) => handleTimingPeriodChange(idx, e.target.value)}
                          className="time-picker-simple-ampm"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <span className="error">{errors.timing}</span>
            </div>
          )}

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
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Saving..." : "Save Medicine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineModal;