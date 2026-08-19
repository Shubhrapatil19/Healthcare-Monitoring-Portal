import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { addStock, getMedicines } from "../api/MockApi";

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
  const [formData, setFormData] = useState({
    medicineName: "",
    currentStock: "",
    minimumStock: "",
    expiryDate: "",
  });

  const [medicines, setMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [medicineDropdownOpen, setMedicineDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMedicines = async () => {
      try {
        setLoadingMedicines(true);
        const response = await getMedicines();

        if (!active) return;

        setMedicines(
          Array.isArray(response?.data?.medicines)
            ? response.data.medicines
            : []
        );
      } catch (error) {
        console.error("Medicine load error:", error);

        if (active) {
          setMedicines([]);
          toast.error("Unable to load medicines.");
        }
      } finally {
        if (active) setLoadingMedicines(false);
      }
    };

    loadMedicines();

    return () => {
      active = false;
    };
  }, []);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleMedicineSelect = (medicineName) => {
    setFormData((prev) => ({ ...prev, medicineName }));
    setMedicineDropdownOpen(false);
    setErrors((prev) => ({ ...prev, medicineName: "" }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      (name === "currentStock" || name === "minimumStock") &&
      (value.includes("-") || Number(value) < 0)
    ) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.medicineName) {
      nextErrors.medicineName = "Please select a medicine";
    }

    if (formData.currentStock === "") {
      nextErrors.currentStock = "Current stock is required";
    } else if (Number(formData.currentStock) < 0) {
      nextErrors.currentStock = "Current stock cannot be negative";
    }

    if (formData.minimumStock === "") {
      nextErrors.minimumStock = "Minimum stock is required";
    } else if (Number(formData.minimumStock) < 0) {
      nextErrors.minimumStock = "Minimum stock cannot be negative";
    }

    if (!formData.expiryDate) {
      nextErrors.expiryDate = "Expiry date is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await addStock({
        medicineName: formData.medicineName,
        currentStock: Number(formData.currentStock),
        minimumStock: Number(formData.minimumStock),
        expiryDate: formData.expiryDate,
      });

      toast.success(response?.data?.message || "Stock updated successfully!", {
        duration: 3000,
      });

      const savedItem = response?.data?.stockItem || {
        id: Date.now(),
        medicineName: formData.medicineName,
        currentStock: Number(formData.currentStock),
        minimumStock: Number(formData.minimumStock),
        expiryDate: formData.expiryDate,
      };

      onClose(savedItem);
    } catch (error) {
      console.error("Add stock error:", error?.response?.data || error?.message);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update stock. Please try again.",
        { duration: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-modal-overlay" onMouseDown={handleClose}>
      <div className="stock-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="stock-modal-header">
          <div className="stock-modal-title-wrap">
            <div className="stock-modal-title-icon">
              <PackagePlus size={22} />
            </div>
            <div>
              <h2>Add Medicine Stock</h2>
              <p>Choose medicine and update inventory levels</p>
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

        <form className="stock-modal-form" onSubmit={handleSubmit}>
          <div className="stock-modal-note">
            <AlertCircle size={18} />
            <span>Select an existing medicine before adding stock details.</span>
          </div>

          <section className="stock-modal-section stock-modal-section-medicine">
            <div className="stock-modal-section-title">
              <ClipboardList size={18} />
              <span>Medicine</span>
            </div>

            <div className="stock-modal-field">
              <label htmlFor="medicineName">Medicine *</label>
              <div
                className={`stock-modal-select-wrap ${
                  medicineDropdownOpen ? "is-open" : ""
                } ${errors.medicineName ? "stock-modal-input-error" : ""}`}
              >
                <button
                  id="medicineName"
                  type="button"
                  className="stock-modal-select-trigger"
                  onClick={() =>
                    setMedicineDropdownOpen((open) =>
                      loadingMedicines || medicines.length === 0 ? false : !open
                    )
                  }
                  disabled={loadingMedicines || medicines.length === 0}
                >
                  <span>
                    {loadingMedicines
                      ? "Loading medicines..."
                      : formData.medicineName ||
                        (medicines.length === 0
                          ? "No medicines available"
                          : "Select medicine")}
                  </span>
                  <ChevronDown size={18} />
                </button>

                {medicineDropdownOpen && (
                  <div className="stock-modal-select-menu">
                    {medicines.map((medicine) => {
                      const name = medicine.medicineName || medicine.name || "";
                      const dosage = medicine.dosage || "";
                      const selected = formData.medicineName === name;

                      return (
                        <button
                          type="button"
                          key={medicine.id || medicine._id || name}
                          className={`stock-modal-select-option ${
                            selected ? "selected" : ""
                          }`}
                          onClick={() => handleMedicineSelect(name)}
                        >
                          <span>{name}</span>
                          {dosage && <em>{dosage}</em>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {errors.medicineName && (
                <span className="stock-modal-error">{errors.medicineName}</span>
              )}
              {!loadingMedicines && medicines.length === 0 && (
                <span className="stock-modal-helper">
                  First add a medicine from Medicine Management.
                </span>
              )}
            </div>
          </section>

          <section className="stock-modal-section">
            <div className="stock-modal-section-title">
              <Boxes size={18} />
              <span>Stock Levels</span>
            </div>

            <div className="stock-modal-grid">
              <div className="stock-modal-field">
                <label htmlFor="currentStock">Current Stock *</label>
                <input
                  id="currentStock"
                  type="number"
                  name="currentStock"
                  min="0"
                  placeholder="e.g., 40 tablets"
                  value={formData.currentStock}
                  onChange={handleChange}
                  className={errors.currentStock ? "stock-modal-input-error" : ""}
                />
                {errors.currentStock && (
                  <span className="stock-modal-error">{errors.currentStock}</span>
                )}
              </div>

              <div className="stock-modal-field">
                <label htmlFor="minimumStock">Minimum Stock *</label>
                <input
                  id="minimumStock"
                  type="number"
                  name="minimumStock"
                  min="0"
                  placeholder="e.g., 10 tablets"
                  value={formData.minimumStock}
                  onChange={handleChange}
                  className={errors.minimumStock ? "stock-modal-input-error" : ""}
                />
                {errors.minimumStock && (
                  <span className="stock-modal-error">{errors.minimumStock}</span>
                )}
              </div>
            </div>
          </section>

          <section className="stock-modal-section stock-modal-section-expiry">
            <div className="stock-modal-section-title">
              <CalendarDays size={18} />
              <span>Expiry</span>
            </div>

            <div className="stock-modal-field">
              <label htmlFor="expiryDate">Expiry Date *</label>
              <input
                id="expiryDate"
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className={errors.expiryDate ? "stock-modal-input-error" : ""}
              />
              {errors.expiryDate && (
                <span className="stock-modal-error">{errors.expiryDate}</span>
              )}
            </div>
          </section>

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
              disabled={loading || loadingMedicines || medicines.length === 0}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              <span>{loading ? "Saving..." : "Save Stock"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;