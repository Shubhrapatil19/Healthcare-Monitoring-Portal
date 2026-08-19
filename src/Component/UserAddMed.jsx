import { useState } from "react";
import toast from "react-hot-toast";
import {
  Clock3,
  FileText,
  Loader2,
  Pill,
  Repeat,
  ChevronDown,
  Save,
  X,
} from "lucide-react";

import { addMedicine } from "../api/MockApi";

import "./UserAddMed.css";

const FREQUENCY_CONFIG = {
  "Once a day": { doses: 1, required: true },
  "Twice a day": { doses: 2, required: true },
  "Three times a day": { doses: 3, required: true },
  "As needed": { doses: 1, required: false },
  Weekly: { doses: 1, required: true },
};

const FREQUENCY_TO_BACKEND = {
  "Once a day": "ONCE_DAILY",
  "Twice a day": "TWICE_DAILY",
  "Three times a day": "THRICE_DAILY",
  "As needed": "AS_NEEDED",
  Weekly: "WEEKLY",
};

const buildSuggestedTimings = (doseCount) => {
  if (doseCount <= 0) return [];

  const startHour = 8;
  const intervalHours = 24 / doseCount;

  return Array.from({ length: doseCount }, (_, index) => {
    const hour = Math.round(startHour + index * intervalHours) % 24;
    return { time: `${String(hour).padStart(2, "0")}:00` };
  });
};

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
    timings: [],
    frequency: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [frequencyDropdownOpen, setFrequencyDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const doseCount = formData.timings.length;
  const intervalHours = doseCount > 1 ? Math.round(24 / doseCount) : null;

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

  const handleFrequencySelect = (freq) => {
    const doseCountForFrequency = FREQUENCY_CONFIG[freq]?.doses || 0;

    setFormData((prev) => ({
      ...prev,
      frequency: freq,
      timings: buildSuggestedTimings(doseCountForFrequency),
    }));

    setFrequencyDropdownOpen(false);
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

  const handleTimingPeriodChange = (index, newPeriod) => {
    setFormData((prev) => {
      const updated = [...prev.timings];
      const current = updated[index]?.time || "";
      updated[index] = {
        ...updated[index],
        time: buildTiming24(current, newPeriod),
      };
      return { ...prev, timings: updated };
    });

    setErrors((prev) => ({ ...prev, timing: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.medicineName.trim()) {
      nextErrors.medicineName = "Medicine name is required";
    }

    if (!formData.dosage.trim()) {
      nextErrors.dosage = "Dosage is required";
    }

    if (!formData.frequency) {
      nextErrors.frequency = "Select frequency";
    }

    const config = FREQUENCY_CONFIG[formData.frequency];
    if (config?.required) {
      const hasEmptyTiming =
        formData.timings.length === 0 ||
        formData.timings.some((timing) => !timing.time);

      if (hasEmptyTiming) {
        nextErrors.timing = "Please set a time for every dose";
      }
    }

    if (!formData.startDate) {
      nextErrors.startDate = "Start date is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const timings = formData.timings
        .map((item) => item.time)
        .filter(Boolean);
      const firstTime = timings[0] || "";
      const startTiming = firstTime ? `${firstTime}:00` : "";

      const response = await addMedicine({
        medicineName: formData.medicineName.trim(),
        dosage: formData.dosage.trim(),
        timings,
        startTiming,
        timing: firstTime,
        frequency: FREQUENCY_TO_BACKEND[formData.frequency],
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        notes: formData.notes.trim(),
      });

      localStorage.setItem("medicineAdded", "true");

      toast.success(response.data?.message || "Medicine added successfully!", {
        duration: 3000,
      });

      onClose(formData);
    } catch (error) {
      console.log("Add Medicine error:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.message ||
          "Failed to add medicine. Please try again.",
        { duration: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-med-overlay" onMouseDown={onClose}>
      <div className="add-med-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="add-med-header">
          <div className="add-med-title-wrap">
            <div className="add-med-title-icon">
              <Pill size={22} />
            </div>
            <div>
              <h2>Add New Medicine</h2>
              <p>Create medicine schedule and reminder timings</p>
            </div>
          </div>

          <button
            type="button"
            className="add-med-close"
            onClick={onClose}
            aria-label="Close add medicine modal"
          >
            <X size={20} />
          </button>
        </div>

        <form className="add-med-form" onSubmit={handleSubmit}>
          <div className="add-med-section">
            <div className="add-med-section-title">
              <Pill size={18} />
              <span>Medicine Details</span>
            </div>

            <div className="add-med-grid">
              <div className="add-med-field">
                <label>Medicine Name *</label>
                <input
                  type="text"
                  name="medicineName"
                  placeholder="e.g., Metformin"
                  value={formData.medicineName}
                  onChange={handleChange}
                />
                <span className="add-med-error">{errors.medicineName}</span>
              </div>

              <div className="add-med-field">
                <label>Dosage *</label>
                <input
                  type="text"
                  name="dosage"
                  placeholder="e.g., 500 mg"
                  value={formData.dosage}
                  onChange={handleChange}
                />
                <span className="add-med-error">{errors.dosage}</span>
              </div>
            </div>
          </div>

          <div className="add-med-section">
            <div className="add-med-section-title">
              <Repeat size={18} />
              <span>Schedule</span>
            </div>

            <div className="add-med-grid">
              <div className="add-med-field">
                <label>Frequency *</label>
                <div
                  className={`add-med-select-wrap ${
                    frequencyDropdownOpen ? "is-open" : ""
                  } ${errors.frequency ? "add-med-select-error" : ""}`}
                >
                  <button
                    type="button"
                    className="add-med-select-trigger"
                    onClick={() =>
                      setFrequencyDropdownOpen((open) => !open)
                    }
                  >
                    <span>{formData.frequency || "Select frequency"}</span>
                    <ChevronDown size={18} />
                  </button>

                  {frequencyDropdownOpen && (
                    <div className="add-med-select-menu">
                      {Object.keys(FREQUENCY_CONFIG).map((frequency) => {
                        const selected = formData.frequency === frequency;
                        const config = FREQUENCY_CONFIG[frequency];

                        return (
                          <button
                            type="button"
                            key={frequency}
                            className={`add-med-select-option ${
                              selected ? "selected" : ""
                            }`}
                            onClick={() => handleFrequencySelect(frequency)}
                          >
                            <span>{frequency}</span>
                            <em>
                              {config.required
                                ? `${config.doses} dose${config.doses > 1 ? "s" : ""}`
                                : "Optional"}
                            </em>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="add-med-error">{errors.frequency}</span>
              </div>

              <div className="add-med-field add-med-date-range">
                <label>Date Range</label>
                <div className="add-med-date-grid">
                  <div>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                    <small>Start *</small>
                  </div>
                  <div>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                    />
                    <small>End</small>
                  </div>
                </div>
                <span className="add-med-error">{errors.startDate}</span>
              </div>
            </div>

            {doseCount > 0 && (
              <div className="add-med-timing-panel">
                <div className="add-med-timing-heading">
                  <div>
                    <Clock3 size={18} />
                    <span>Dose Timing{doseCount > 1 ? "s" : ""}</span>
                  </div>
                  {intervalHours && <em>~{intervalHours}h apart</em>}
                </div>

                <div className="add-med-timing-list">
                  {formData.timings.map((timing, index) => {
                    const { period } = to12Hour(timing.time);

                    return (
                      <div className="add-med-timing-row" key={index}>
                        <span>Dose {index + 1}</span>
                        <div className="add-med-time-control">
                          <input
                            type="time"
                            value={timing.time}
                            onChange={(e) =>
                              handleTimingChange(index, e.target.value)
                            }
                          />
                          <select
                            value={period}
                            onChange={(e) =>
                              handleTimingPeriodChange(index, e.target.value)
                            }
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <span className="add-med-error">{errors.timing}</span>
              </div>
            )}
          </div>

          <div className="add-med-section">
            <div className="add-med-section-title">
              <FileText size={18} />
              <span>Notes</span>
            </div>

            <div className="add-med-field">
              <textarea
                name="notes"
                placeholder="Add instructions, meal timing, or doctor notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>

          <div className="add-med-actions">
            <button
              type="button"
              className="add-med-btn add-med-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-med-btn add-med-btn-primary"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              <span>{loading ? "Saving..." : "Save Medicine"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineModal;