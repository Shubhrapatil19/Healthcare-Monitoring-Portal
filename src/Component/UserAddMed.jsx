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

import api from "../api/axiosInstance";

import "./UserAddMed.css";
// =========================================================
// FREQUENCY UI CONFIG
// =========================================================

const FREQUENCY_CONFIG = {
  "Once a day": {
    doses: 1,
    required: true,
  },

  "Twice a day": {
    doses: 2,
    required: true,
  },

  "Three times a day": {
    doses: 3,
    required: true,
  },

  "As needed": {
    doses: 1,
    required: true,
  },

  Weekly: {
    doses: 1,
    required: true,
  },
};

const TIME_HOUR_OPTIONS = Array.from(
  { length: 12 },
  (_, index) => String(index + 1).padStart(2, "0")
);

const TIME_MINUTE_OPTIONS = Array.from(
  { length: 60 },
  (_, index) => String(index).padStart(2, "0")
);

// =========================================================
// SWAGGER / BACKEND FREQUENCY VALUES
// =========================================================

const FREQUENCY_TO_BACKEND = {
  "Once a day": "ONCE_A_DAY",
  "Twice a day": "TWICE_A_DAY",
  "Three times a day": "THRICE_A_DAY",
  "As needed": "AS_NEEDED",
  Weekly: "WEEKLY",
};

// =========================================================
// BUILD DEFAULT TIMES
// =========================================================

const buildSuggestedTimings = (doseCount) => {
  const suggestedTimes = {
    1: ["08:00"],
    2: ["08:00", "20:00"],
    3: ["08:00", "14:00", "20:00"],
  };

  return (suggestedTimes[doseCount] || []).map(
    (time) => ({ time })
  );
};

// =========================================================
// 24 HOUR → 12 HOUR
// =========================================================

const to12Hour = (time24) => {
  if (!time24) {
    return {
      hour12: null,
      minute: "00",
      period: "AM",
    };
  }

  const [h, m] =
    time24
      .split(":")
      .map(Number);

  const period =
    h >= 12 ? "PM" : "AM";

  let hour12 = h % 12;

  if (hour12 === 0) {
    hour12 = 12;
  }

  return {
    hour12,
    minute: String(m).padStart(
      2,
      "0"
    ),
    period,
  };
};

// =========================================================
// BACKEND DATE FORMAT: YYYY-MM-DD -> DD-MM-YYYY
// =========================================================

const formatDateForBackend = (date) => {
  if (!date) return "";

  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
};

// =========================================================
// BACKEND TIME FORMAT: HH:mm -> hh:mm AM/PM
// =========================================================

const formatTimeForBackend = (time24) => {
  if (!time24) return "";

  const { hour12, minute, period } = to12Hour(time24);

  return `${String(hour12).padStart(2, "0")}:${minute} ${period}`;
};

// =========================================================
// BUILD 24 HOUR TIME
// =========================================================

const buildTiming24 = (
  time24,
  period
) => {
  if (!time24) {
    return "";
  }

  const {
    hour12,
    minute,
  } = to12Hour(time24);

  let hour =
    hour12 % 12;

  if (period === "PM") {
    hour += 12;
  }

  return `${String(hour).padStart(
    2,
    "0"
  )}:${minute}`;
};

// =========================================================
// COMPONENT
// =========================================================

const AddMedicineModal = ({
  onClose,
}) => {
  // =======================================================
  // FORM STATE
  // =======================================================

  const [
    formData,
    setFormData,
  ] = useState({
    medicineName: "",
    dosage: "",
    timings: [],
    frequency: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    frequencyDropdownOpen,
    setFrequencyDropdownOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  // =======================================================
  // DERIVED VALUES
  // =======================================================

  const doseCount =
    formData.timings.length;

  const intervalHours =
    doseCount > 1
      ? Math.round(
          24 / doseCount
        )
      : null;

  // =======================================================
  // INPUT CHANGE
  // =======================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =======================================================
  // FREQUENCY
  // =======================================================

  const handleFrequencySelect = (
    frequency
  ) => {
    const doseCountForFrequency =
      FREQUENCY_CONFIG[
        frequency
      ]?.doses || 0;

    setFormData((prev) => ({
      ...prev,

      frequency,

      timings:
        buildSuggestedTimings(
          doseCountForFrequency
        ),
    }));

    setFrequencyDropdownOpen(
      false
    );

    setErrors((prev) => ({
      ...prev,
      frequency: "",
      timing: "",
    }));
  };

  // =======================================================
  // TIME
  // =======================================================

  const handleTimingChange = (
    index,
    value
  ) => {
    setFormData((prev) => {
      const updated = [
        ...prev.timings,
      ];

      updated[index] = {
        ...updated[index],
        time: value,
      };

      return {
        ...prev,
        timings: updated,
      };
    });

    setErrors((prev) => ({
      ...prev,
      timing: "",
    }));
  };

  const handleTimingPeriodChange = (
    index,
    newPeriod
  ) => {
    setFormData((prev) => {
      const updated = [
        ...prev.timings,
      ];

      const current =
        updated[index]?.time || "";

      updated[index] = {
        ...updated[index],

        time: buildTiming24(
          current,
          newPeriod
        ),
      };

      return {
        ...prev,
        timings: updated,
      };
    });

    setErrors((prev) => ({
      ...prev,
      timing: "",
    }));
  };

  // =======================================================
  // VALIDATION
  // =======================================================

  const validate = () => {
    const nextErrors = {};

    if (
      !formData.medicineName.trim()
    ) {
      nextErrors.medicineName =
        "Medicine name is required";
    }

    if (
      !formData.dosage.trim()
    ) {
      nextErrors.dosage =
        "Dosage is required";
    }

    if (
      !formData.frequency
    ) {
      nextErrors.frequency =
        "Select frequency";
    }

    if (
      formData.frequency &&
      !FREQUENCY_TO_BACKEND[
        formData.frequency
      ]
    ) {
      nextErrors.frequency =
        "Selected frequency is not supported by backend";
    }

    const config =
      FREQUENCY_CONFIG[
        formData.frequency
      ];

    if (config?.required) {
      const hasEmptyTiming =
        formData.timings.length ===
          0 ||
        formData.timings.some(
          (timing) =>
            !timing.time
        );

      if (hasEmptyTiming) {
        nextErrors.timing =
          "Please set a time for every dose";
      }
    }

    if (
      !formData.startDate
    ) {
      nextErrors.startDate =
        "Start date is required";
    }

    if (
      !formData.endDate
    ) {
      nextErrors.endDate =
        "End date is required";
    }

    if (
      formData.endDate &&
      formData.startDate &&
      formData.endDate <
        formData.startDate
    ) {
      nextErrors.endDate =
        "End date cannot be before start date";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  // =======================================================
  // ADD MEDICINE - REAL API
  //
  // POST /api/medicines
  // =======================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      setLoading(true);

      try {
        // ================================================
        // SWAGGER FIELD: doseTimes
        // ================================================

        const doseTimes =
          formData.timings
            .map((item) =>
              formatTimeForBackend(
                item.time
              )
            )
            .filter(Boolean);

        // ================================================
        // SWAGGER REQUEST BODY
        // ================================================

        const payload = {
          medicineName:
            formData.medicineName.trim(),

          dosage:
            formData.dosage.trim(),

          frequency:
            FREQUENCY_TO_BACKEND[
              formData.frequency
            ],

          doseTimes,

          startDate:
            formatDateForBackend(
              formData.startDate
            ),

          endDate:
            formatDateForBackend(
              formData.endDate
            ),

          notes:
            formData.notes.trim(),
        };

        console.log(
          "ADD MEDICINE PAYLOAD:",
          JSON.stringify(
            payload,
            null,
            2
          )
        );

        // ================================================
        // REAL API CALL
        // ================================================

        const response =
          await api.post(
            "/api/medicines",
            payload
          );

        console.log(
          "ADD MEDICINE RESPONSE:",
          response.data
        );

        localStorage.setItem(
          "medicineAdded",
          "true"
        );

        toast.success(
          response?.data?.message ||
            "Medicine added successfully!",
          {
            duration: 3000,
          }
        );

        // Parent page ko returned medicine
        // pass kar sakte hain
        if (
          typeof onClose ===
          "function"
        ) {
          onClose(
            response?.data ||
              payload
          );
        }
      } catch (error) {
        console.error(
          "ADD MEDICINE API ERROR:",
          {
            status:
              error?.response
                ?.status,

            response:
              error?.response
                ?.data,

            url:
              error?.config
                ?.url,

            sentData:
              error?.config
                ?.data,

            message:
              error?.message,
          }
        );

        const message =
          error?.response
            ?.data
            ?.message ||
          error?.response
            ?.data
            ?.error ||
          error?.message ||
          "Failed to add medicine. Please try again.";

        toast.error(
          message,
          {
            duration: 4000,
          }
        );
      } finally {
        setLoading(false);
      }
    };

  // =======================================================
  // UI
  // =======================================================

  return (
    <div
      className="add-med-overlay"
      onMouseDown={onClose}
    >
      <div
        className="add-med-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="add-med-header">
          <div className="add-med-title-wrap">

            <div className="add-med-title-icon">
              <Pill size={22} />
            </div>

            <div>
              <h2>
                Add New Medicine
              </h2>

              <p>
                Create medicine schedule
                and reminder timings
              </p>
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

        {/* FORM */}

        <form
          className="add-med-form"
          onSubmit={handleSubmit}
        >
          {/* =============================================
              MEDICINE DETAILS
          ============================================= */}

          <div className="add-med-section">

            <div className="add-med-section-title">
              <Pill size={18} />

              <span>
                Medicine Details
              </span>
            </div>

            <div className="add-med-grid">

              <div className="add-med-field">
                <label>
                  Medicine Name *
                </label>

                <input
                  type="text"
                  name="medicineName"
                  placeholder="e.g., Metformin"
                  value={
                    formData.medicineName
                  }
                  onChange={
                    handleChange
                  }
                />

                <span className="add-med-error">
                  {
                    errors.medicineName
                  }
                </span>
              </div>

              <div className="add-med-field">
                <label>
                  Dosage *
                </label>

                <input
                  type="text"
                  name="dosage"
                  placeholder="e.g., 500 mg"
                  value={
                    formData.dosage
                  }
                  onChange={
                    handleChange
                  }
                />

                <span className="add-med-error">
                  {
                    errors.dosage
                  }
                </span>
              </div>

            </div>
          </div>

          {/* =============================================
              SCHEDULE
          ============================================= */}

          <div className="add-med-section">

            <div className="add-med-section-title">
              <Repeat size={18} />

              <span>
                Schedule
              </span>
            </div>

            <div className="add-med-grid">

              {/* FREQUENCY */}

              <div className="add-med-field">
                <label>
                  Frequency *
                </label>

                <div
                  className={`add-med-select-wrap ${
                    frequencyDropdownOpen
                      ? "is-open"
                      : ""
                  } ${
                    errors.frequency
                      ? "add-med-select-error"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="add-med-select-trigger"
                    onClick={() =>
                      setFrequencyDropdownOpen(
                        (open) =>
                          !open
                      )
                    }
                  >
                    <span>
                      {formData.frequency ||
                        "Select frequency"}
                    </span>

                    <ChevronDown
                      size={18}
                    />
                  </button>

                  {frequencyDropdownOpen && (
                    <div className="add-med-select-menu">

                      {Object.keys(
                        FREQUENCY_CONFIG
                      ).map(
                        (
                          frequency
                        ) => {
                          const selected =
                            formData.frequency ===
                            frequency;

                          const config =
                            FREQUENCY_CONFIG[
                              frequency
                            ];

                          return (
                            <button
                              type="button"
                              key={
                                frequency
                              }
                              className={`add-med-select-option ${
                                selected
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleFrequencySelect(
                                  frequency
                                )
                              }
                            >
                              <span>
                                {
                                  frequency
                                }
                              </span>

                              <em>
                                {
                                  config.doses
                                }{" "}
                                dose
                                {config.doses >
                                1
                                  ? "s"
                                  : ""}
                              </em>
                            </button>
                          );
                        }
                      )}

                    </div>
                  )}
                </div>

                <span className="add-med-error">
                  {
                    errors.frequency
                  }
                </span>
              </div>

              {/* DATE RANGE */}

              <div className="add-med-field add-med-date-range">

                <label>
                  Date Range
                </label>

                <div className="add-med-date-grid">

                  <div>
                    <input
                      type="date"
                      name="startDate"
                      value={
                        formData.startDate
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <small>
                      Start *
                    </small>
                  </div>

                  <div>
                    <input
                      type="date"
                      name="endDate"
                      value={
                        formData.endDate
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <small>
                      End
                    </small>
                  </div>

                </div>

                <span className="add-med-error">
                  {
                    errors.startDate
                  }

                  {errors.endDate &&
                    ` ${errors.endDate}`}
                </span>
              </div>

            </div>

            {/* ===========================================
                DOSE TIMES
            =========================================== */}

            {doseCount > 0 && (
              <div className="add-med-timing-panel">

                <div className="add-med-timing-heading">

                  <div>
                    <Clock3
                      size={18}
                    />

                    <span>
                      Dose Timing
                      {doseCount > 1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  {intervalHours && (
                    <em>
                      ~
                      {
                        intervalHours
                      }
                      h apart
                    </em>
                  )}

                </div>

                <div className="add-med-timing-list">

                  {formData.timings.map(
                    (
                      timing,
                      index
                    ) => {
                      const {
                        hour12,
                        minute,
                        period,
                      } = to12Hour(
                        timing.time
                      );

                      const displayHour = String(hour12 || 12).padStart(2, "0");

                      return (
                        <div
                          className="add-med-timing-row"
                          key={
                            index
                          }
                        >
                          <span>
                            Dose{" "}
                            {index +
                              1}
                          </span>

                          <div className="add-med-time-control add-med-time-control--twelve-hour">
                            <select
                              value={displayHour}
                              onChange={(e) =>
                                handleTimingChange(
                                  index,
                                  buildTiming24(
                                    `${e.target.value}:${minute}`,
                                    period
                                  )
                                )
                              }
                              aria-label={`Dose ${index + 1} hour`}
                            >
                              {TIME_HOUR_OPTIONS.map((hour) => (
                                <option key={hour} value={hour}>
                                  {hour}
                                </option>
                              ))}
                            </select>

                            <select
                              value={minute}
                              onChange={(e) =>
                                handleTimingChange(
                                  index,
                                  buildTiming24(
                                    `${displayHour}:${e.target.value}`,
                                    period
                                  )
                                )
                              }
                              aria-label={`Dose ${index + 1} minute`}
                            >
                              {TIME_MINUTE_OPTIONS.map((minuteOption) => (
                                <option key={minuteOption} value={minuteOption}>
                                  {minuteOption}
                                </option>
                              ))}
                            </select>

                            <select
                              value={period}
                              onChange={(e) =>
                                handleTimingPeriodChange(
                                  index,
                                  e.target.value
                                )
                              }
                              aria-label={`Dose ${index + 1} AM or PM`}
                            >
                              <option value="AM">
                                AM
                              </option>

                              <option value="PM">
                                PM
                              </option>
                            </select>
                          </div>
                        </div>
                      );
                    }
                  )}

                </div>

                <span className="add-med-error">
                  {
                    errors.timing
                  }
                </span>

              </div>
            )}
          </div>

          {/* =============================================
              NOTES
          ============================================= */}

          <div className="add-med-section">

            <div className="add-med-section-title">
              <FileText
                size={18}
              />

              <span>
                Notes
              </span>
            </div>

            <div className="add-med-field">

              <textarea
                name="notes"
                placeholder="Add instructions, meal timing, or doctor notes"
                value={
                  formData.notes
                }
                onChange={
                  handleChange
                }
                rows="3"
              />

            </div>
          </div>

          {/* =============================================
              ACTIONS
          ============================================= */}

          <div className="add-med-actions">

            <button
              type="button"
              className="add-med-btn add-med-btn-secondary"
              onClick={
                onClose
              }
              disabled={
                loading
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="add-med-btn add-med-btn-primary"
              disabled={
                loading
              }
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                <Save
                  size={16}
                />
              )}

              <span>
                {loading
                  ? "Saving..."
                  : "Save Medicine"}
              </span>
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineModal;









