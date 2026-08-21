import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axiosInstance";

import {
  AlertCircle,
  Boxes,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Loader2,
  PackagePlus,
  Save,
  X,
} from "lucide-react";

import "./AddStock.css";

const AddStockModal = ({ onClose }) => {
  // =========================================================
  // FORM STATE
  // =========================================================

  const [formData, setFormData] = useState({
    medicineId: "",
    medicineName: "",
    currentStock: "",
    minimumStock: "",
    expiryDate: "",
  });

  // =========================================================
  // MEDICINES
  // =========================================================

  const [medicines, setMedicines] = useState([]);

  const [loadingMedicines, setLoadingMedicines] =
    useState(true);

  const [medicineDropdownOpen, setMedicineDropdownOpen] =
    useState(false);

  // =========================================================
  // FORM
  // =========================================================

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // =========================================================
  // LOAD MEDICINES
  //
  // GET /api/medicines
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadMedicines = async () => {
      try {
        const response = await api.get(
          "/api/medicines"
        );

        let medicineList = [];

        if (Array.isArray(response.data)) {
          medicineList = response.data;
        } else if (
          Array.isArray(response.data?.medicines)
        ) {
          medicineList =
            response.data.medicines;
        } else if (
          Array.isArray(response.data?.data)
        ) {
          medicineList =
            response.data.data;
        }

        if (!cancelled) {
          setMedicines(medicineList);
        }
      } catch (error) {
        console.error(
          "Medicine load error:",
          error?.response?.data ||
            error.message
        );

        if (!cancelled) {
          setMedicines([]);

          toast.error(
            error?.response?.data?.message ||
              "Unable to load medicines."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMedicines(false);
        }
      }
    };

    loadMedicines();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {
    if (!loading) {
      onClose?.();
    }
  };

  // =========================================================
  // SELECT MEDICINE
  // =========================================================

  const handleMedicineSelect = (
    medicine
  ) => {
    const id =
      medicine.id ??
      medicine._id ??
      medicine.medicineId;

    const name =
      medicine.medicineName ??
      medicine.name ??
      "";

    setFormData((prev) => ({
      ...prev,
      medicineId: id,
      medicineName: name,
    }));

    setMedicineDropdownOpen(false);

    setErrors((prev) => ({
      ...prev,
      medicineName: "",
    }));
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } =
      e.target;

    if (
      (name === "currentStock" ||
        name === "minimumStock") &&
      (value.includes("-") ||
        Number(value) < 0)
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validate = () => {
    const nextErrors = {};

    if (!formData.medicineId) {
      nextErrors.medicineName =
        "Please select a medicine";
    }

    if (
      formData.currentStock === ""
    ) {
      nextErrors.currentStock =
        "Current stock is required";
    } else if (
      Number(formData.currentStock) <
      0
    ) {
      nextErrors.currentStock =
        "Current stock cannot be negative";
    }

    if (
      formData.minimumStock === ""
    ) {
      nextErrors.minimumStock =
        "Minimum stock is required";
    } else if (
      Number(formData.minimumStock) <
      0
    ) {
      nextErrors.minimumStock =
        "Minimum stock cannot be negative";
    }

    if (!formData.expiryDate) {
      nextErrors.expiryDate =
        "Expiry date is required";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  // =========================================================
  // ADD STOCK
  //
  // POST /api/inventory
  //
  // NOTE:
  // medicineId payload is based on current API structure.
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        medicineId: Number(
          formData.medicineId
        ),

        currentStock: Number(
          formData.currentStock
        ),

        minimumStock: Number(
          formData.minimumStock
        ),

        expiryDate:
          formData.expiryDate,
      };

      console.log(
        "ADD STOCK PAYLOAD:",
        payload
      );

      const response = await api.post(
        "/api/inventory",
        payload
      );

      console.log(
        "ADD STOCK RESPONSE:",
        response.data
      );

      toast.success(
        response?.data?.message ||
          "Stock added successfully!",
        {
          duration: 3000,
        }
      );

      const savedItem =
        response?.data?.stockItem ||
        response?.data?.data ||
        response?.data ||
        {
          ...payload,
          medicineName:
            formData.medicineName,
        };

      onClose?.(savedItem);
    } catch (error) {
      console.error(
        "Add stock error:",
        error?.response?.data ||
          error?.message
      );

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to add stock. Please try again.",
        {
          duration: 4000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="stock-modal-overlay"
      onMouseDown={handleClose}
    >
      <div
        className="stock-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="stock-modal-header">
          <div className="stock-modal-title-wrap">
            <div className="stock-modal-title-icon">
              <PackagePlus size={22} />
            </div>

            <div>
              <h2>
                Add Medicine Stock
              </h2>

              <p>
                Choose medicine and
                update inventory levels
              </p>
            </div>
          </div>

          <button
            type="button"
            className="stock-modal-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close stock modal"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="stock-modal-form"
          onSubmit={handleSubmit}
        >
          <div className="stock-modal-note">
            <AlertCircle size={18} />

            <span>
              Select an existing
              medicine before adding
              stock details.
            </span>
          </div>

          {/* MEDICINE */}

          <section className="stock-modal-section stock-modal-section-medicine">
            <div className="stock-modal-section-title">
              <ClipboardList
                size={18}
              />

              <span>
                Medicine
              </span>
            </div>

            <div className="stock-modal-field">
              <label htmlFor="medicineName">
                Medicine *
              </label>

              <div
                className={`stock-modal-select-wrap ${
                  medicineDropdownOpen
                    ? "is-open"
                    : ""
                } ${
                  errors.medicineName
                    ? "stock-modal-input-error"
                    : ""
                }`}
              >
                <button
                  id="medicineName"
                  type="button"
                  className="stock-modal-select-trigger"
                  disabled={
                    loadingMedicines ||
                    medicines.length ===
                      0
                  }
                  onClick={() =>
                    setMedicineDropdownOpen(
                      (open) =>
                        loadingMedicines ||
                        medicines.length ===
                          0
                          ? false
                          : !open
                    )
                  }
                >
                  <span>
                    {loadingMedicines
                      ? "Loading medicines..."
                      : formData.medicineName ||
                        (medicines.length ===
                        0
                          ? "No medicines available"
                          : "Select medicine")}
                  </span>

                  <ChevronDown
                    size={18}
                  />
                </button>

                {medicineDropdownOpen && (
                  <div className="stock-modal-select-menu">
                    {medicines.map(
                      (medicine) => {
                        const id =
                          medicine.id ??
                          medicine._id ??
                          medicine.medicineId;

                        const name =
                          medicine.medicineName ??
                          medicine.name ??
                          "";

                        const dosage =
                          medicine.dosage ??
                          "";

                        const selected =
                          String(
                            formData.medicineId
                          ) ===
                          String(id);

                        return (
                          <button
                            type="button"
                            key={
                              id ??
                              name
                            }
                            className={`stock-modal-select-option ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleMedicineSelect(
                                medicine
                              )
                            }
                          >
                            <span>
                              {name}
                            </span>

                            {dosage && (
                              <em>
                                {dosage}
                              </em>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {errors.medicineName && (
                <span className="stock-modal-error">
                  {
                    errors.medicineName
                  }
                </span>
              )}

              {!loadingMedicines &&
                medicines.length ===
                  0 && (
                  <span className="stock-modal-helper">
                    First add a medicine
                    from Medicine
                    Management.
                  </span>
                )}
            </div>
          </section>

          {/* STOCK LEVELS */}

          <section className="stock-modal-section">
            <div className="stock-modal-section-title">
              <Boxes size={18} />

              <span>
                Stock Levels
              </span>
            </div>

            <div className="stock-modal-grid">
              <div className="stock-modal-field">
                <label htmlFor="currentStock">
                  Current Stock *
                </label>

                <input
                  id="currentStock"
                  type="number"
                  name="currentStock"
                  min="0"
                  placeholder="e.g., 40 tablets"
                  value={
                    formData.currentStock
                  }
                  onChange={
                    handleChange
                  }
                  className={
                    errors.currentStock
                      ? "stock-modal-input-error"
                      : ""
                  }
                />

                {errors.currentStock && (
                  <span className="stock-modal-error">
                    {
                      errors.currentStock
                    }
                  </span>
                )}
              </div>

              <div className="stock-modal-field">
                <label htmlFor="minimumStock">
                  Minimum Stock *
                </label>

                <input
                  id="minimumStock"
                  type="number"
                  name="minimumStock"
                  min="0"
                  placeholder="e.g., 10 tablets"
                  value={
                    formData.minimumStock
                  }
                  onChange={
                    handleChange
                  }
                  className={
                    errors.minimumStock
                      ? "stock-modal-input-error"
                      : ""
                  }
                />

                {errors.minimumStock && (
                  <span className="stock-modal-error">
                    {
                      errors.minimumStock
                    }
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* EXPIRY */}

          <section className="stock-modal-section stock-modal-section-expiry">
            <div className="stock-modal-section-title">
              <CalendarDays
                size={18}
              />

              <span>
                Expiry
              </span>
            </div>

            <div className="stock-modal-field">
              <label htmlFor="expiryDate">
                Expiry Date *
              </label>

              <input
                id="expiryDate"
                type="date"
                name="expiryDate"
                value={
                  formData.expiryDate
                }
                onChange={
                  handleChange
                }
                className={
                  errors.expiryDate
                    ? "stock-modal-input-error"
                    : ""
                }
              />

              {errors.expiryDate && (
                <span className="stock-modal-error">
                  {
                    errors.expiryDate
                  }
                </span>
              )}
            </div>
          </section>

          {/* ACTIONS */}

          <div className="stock-modal-actions">
            <button
              type="button"
              className="stock-modal-btn stock-modal-btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="stock-modal-btn stock-modal-btn-primary"
              disabled={
                loading ||
                loadingMedicines ||
                medicines.length === 0
              }
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                <Save size={16} />
              )}

              <span>
                {loading
                  ? "Saving..."
                  : "Save Stock"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;