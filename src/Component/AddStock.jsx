import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  addStock,
  getMedicines,
} from "../api/MockApi";

import {
  Plus,
  X,
  Info,
  Save,
  ChevronDown,
} from "lucide-react";

import "./AddStock.css";

const AddStockModal = ({ onClose }) => {
  // =========================================================
  // FORM DATA
  // =========================================================

  const [formData, setFormData] = useState({
    medicineName: "",
    currentStock: "",
    minimumStock: "",
    expiryDate: "",
  });

  const [medicines, setMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(true);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // =========================================================
  // LOAD MEDICINES
  // Only medicines added earlier by the user will appear
  // =========================================================

  useEffect(() => {
    let active = true;

    const loadMedicines = async () => {
      try {
        setLoadingMedicines(true);

        const response = await getMedicines();

        if (!active) return;

        const medicineList =
          Array.isArray(response?.data?.medicines)
            ? response.data.medicines
            : [];

        setMedicines(medicineList);
      } catch (error) {
        console.error(
          "Medicine load error:",
          error
        );

        if (active) {
          setMedicines([]);

          toast.error(
            "Unable to load medicines."
          );
        }
      } finally {
        if (active) {
          setLoadingMedicines(false);
        }
      }
    };

    loadMedicines();

    return () => {
      active = false;
    };
  }, []);

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const handleClose = () => {
    if (loading) return;

    onClose();
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent negative stock values
    if (
      (name === "currentStock" ||
        name === "minimumStock") &&
      (
        value.includes("-") ||
        Number(value) < 0
      )
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
    const temp = {};

    if (!formData.medicineName) {
      temp.medicineName =
        "Please select a medicine";
    }

    if (
      formData.currentStock === ""
    ) {
      temp.currentStock =
        "Current stock is required";
    } else if (
      Number(formData.currentStock) < 0
    ) {
      temp.currentStock =
        "Current stock cannot be negative";
    }

    if (
      formData.minimumStock === ""
    ) {
      temp.minimumStock =
        "Minimum stock is required";
    } else if (
      Number(formData.minimumStock) < 0
    ) {
      temp.minimumStock =
        "Minimum stock cannot be negative";
    }

    if (!formData.expiryDate) {
      temp.expiryDate =
        "Expiry date is required";
    }

    setErrors(temp);

    return (
      Object.keys(temp).length === 0
    );
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response =
        await addStock({
          medicineName:
            formData.medicineName,

          currentStock:
            Number(
              formData.currentStock
            ),

          minimumStock:
            Number(
              formData.minimumStock
            ),

          expiryDate:
            formData.expiryDate,
        });

      toast.success(
        response?.data?.message ||
          "Stock updated successfully!",
        {
          duration: 3000,
        }
      );

      const savedItem =
        response?.data?.stockItem || {
          id: Date.now(),

          medicineName:
            formData.medicineName,

          currentStock:
            Number(
              formData.currentStock
            ),

          minimumStock:
            Number(
              formData.minimumStock
            ),

          expiryDate:
            formData.expiryDate,
        };

      onClose(savedItem);
    } catch (error) {
      console.error(
        "Add stock error:",
        error?.response?.data ||
          error?.message
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to update stock. Please try again.",
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
      className="modal-overlay"
      onClick={handleClose}
    >
      <div
        className="modal-container add-stock-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="add-stock-header">

          <div className="add-stock-title">

            <div className="add-stock-title-icon">
              <Plus size={23} />
            </div>

            <h2>
              Add Medicine Stock
            </h2>

          </div>

          <button
            type="button"
            className="add-stock-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

        </div>

        {/* =====================================================
            INFO BOX
        ===================================================== */}

        <div className="add-stock-info">

          <Info size={20} />

          <span>
            Select a medicine and add
            its stock details.
          </span>

        </div>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="add-stock-form"
        >

          {/* =================================================
              MEDICINE DROPDOWN
          ================================================= */}

          <div className="form-group">

            <label htmlFor="medicineName">
              Medicine
              <span className="required">
                *
              </span>
            </label>

            <div className="medicine-select-wrapper">

              <select
                id="medicineName"
                name="medicineName"
                value={
                  formData.medicineName
                }
                onChange={handleChange}
                disabled={
                  loadingMedicines ||
                  medicines.length === 0
                }
                className={
                  errors.medicineName
                    ? "input-error"
                    : ""
                }
              >

                <option
                  value=""
                  disabled
                >
                  {loadingMedicines
                    ? "Loading medicines..."
                    : medicines.length === 0
                      ? "No medicines available"
                      : "Select medicine"}
                </option>

                {medicines.map(
                  (medicine) => {
                    const name =
                      medicine.medicineName ||
                      medicine.name ||
                      "";

                    const dosage =
                      medicine.dosage ||
                      "";

                    return (
                      <option
                        key={
                          medicine.id ||
                          medicine._id ||
                          name
                        }
                        value={name}
                      >
                        {name}
                        {dosage
                          ? ` - ${dosage}`
                          : ""}
                      </option>
                    );
                  }
                )}

              </select>

              <ChevronDown
                size={18}
                className="medicine-select-icon"
              />

            </div>

            {errors.medicineName && (
              <span className="error">
                {errors.medicineName}
              </span>
            )}

            {!loadingMedicines &&
              medicines.length === 0 && (
                <span className="medicine-helper-text">
                  First add a medicine
                  from Medicine Management.
                </span>
              )}

          </div>

          {/* =================================================
              CURRENT STOCK
          ================================================= */}

          <div className="form-group">

            <label htmlFor="currentStock">
              Current Stock
              <span className="required">
                *
              </span>
            </label>

            <input
              id="currentStock"
              type="number"
              name="currentStock"
              min="0"
              placeholder="Enter current stock"
              value={
                formData.currentStock
              }
              onChange={handleChange}
              className={
                errors.currentStock
                  ? "input-error"
                  : ""
              }
            />

            {errors.currentStock && (
              <span className="error">
                {errors.currentStock}
              </span>
            )}

          </div>

          {/* =================================================
              MINIMUM STOCK
          ================================================= */}

          <div className="form-group">

            <label htmlFor="minimumStock">
              Minimum Stock
              <span className="required">
                *
              </span>
            </label>

            <input
              id="minimumStock"
              type="number"
              name="minimumStock"
              min="0"
              placeholder="Enter minimum stock"
              value={
                formData.minimumStock
              }
              onChange={handleChange}
              className={
                errors.minimumStock
                  ? "input-error"
                  : ""
              }
            />

            {errors.minimumStock && (
              <span className="error">
                {errors.minimumStock}
              </span>
            )}

          </div>

          {/* =================================================
              EXPIRY DATE
          ================================================= */}

          <div className="form-group">

            <label htmlFor="expiryDate">
              Expiry Date
              <span className="required">
                *
              </span>
            </label>

            <input
              id="expiryDate"
              type="date"
              name="expiryDate"
              value={
                formData.expiryDate
              }
              onChange={handleChange}
              className={
                errors.expiryDate
                  ? "input-error"
                  : ""
              }
            />

            {errors.expiryDate && (
              <span className="error">
                {errors.expiryDate}
              </span>
            )}

          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="modal-actions">

            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-save"
              disabled={
                loading ||
                loadingMedicines ||
                medicines.length === 0
              }
            >

              <Save size={18} />

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