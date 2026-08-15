import { useState } from "react";
import toast from "react-hot-toast";
import { addStock } from "../api/MockApi";

import "./AddStock.css";

const AddStockModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    medicineName: "",
    currentStock: "",
    minimumStock: "",
    expiryDate: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Wraps onClose so accidental clicks (overlay backdrop, Cancel button)
  // never pass a click event through as if it were a saved stock item.
  const handleClose = () => onClose();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For stock fields, reject any negative values including standalone "-" sign
    if ((name === "currentStock" || name === "minimumStock") && (value.includes("-") || Number(value) < 0)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  };

  const validate = () => {
    let temp = {};

    if (!formData.medicineName)
      temp.medicineName = "Medicine name is required";

    if (!formData.currentStock) {
      temp.currentStock = "Current stock is required";
    } else if (Number(formData.currentStock) < 0) {
      temp.currentStock = "Current stock cannot be negative";
    }

    if (!formData.minimumStock) {
      temp.minimumStock = "Minimum stock is required";
    } else if (Number(formData.minimumStock) < 0) {
      temp.minimumStock = "Minimum stock cannot be negative";
    }

    if (!formData.expiryDate)
      temp.expiryDate = "Expiry date is required";

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // ================= MOCK: ADD/UPDATE STOCK (no backend) =================
      const response = await addStock({
        medicineName: formData.medicineName,
        currentStock: Number(formData.currentStock),
        minimumStock: Number(formData.minimumStock),
        expiryDate: formData.expiryDate,
      });
      // ============================================================================

      toast.success(response.data?.message || "Stock updated successfully!", {
        duration: 3000,
      });

      // Pass back the saved object (with generated id) so Edit/Delete
      // work correctly afterwards.
      const savedItem = response.data?.stockItem || {
        id: Date.now(),
        ...formData,
        currentStock: Number(formData.currentStock),
        minimumStock: Number(formData.minimumStock),
      };

      onClose(savedItem);
    } catch (error) {
      console.log("Add/Update Stock error:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.message || "Failed to update stock. Please try again.",
        { duration: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h2>Add Medicine Stock</h2>

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
            <label>Current Stock *</label>
            <input
              type="number"
              name="currentStock"
              min="0"
              placeholder="Enter current stock"
              value={formData.currentStock}
              onChange={handleChange}
            />
            <span className="error">{errors.currentStock}</span>
          </div>

          <div className="form-group">
            <label>Minimum Stock *</label>
            <input
              type="number"
              name="minimumStock"
              min="0"
              placeholder="Enter minimum stock"
              value={formData.minimumStock}
              onChange={handleChange}
            />
            <span className="error">{errors.minimumStock}</span>
          </div>

          <div className="form-group">
            <label>Expiry Date *</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
            />
            <span className="error">{errors.expiryDate}</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose} disabled={loading}>
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

export default AddStockModal;