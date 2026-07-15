import { useState } from "react";

import "./AddStock.css";

const AddStockModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    medicineName: "",
    currentStock: "",
    minimumStock: "",
    expiryDate: ""
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

  const validate = () => {
    let temp = {};

    if (!formData.medicineName)
      temp.medicineName = "Medicine name is required";

    if (!formData.currentStock)
      temp.currentStock = "Current stock is required";

    if (!formData.minimumStock)
      temp.minimumStock = "Minimum stock is required";

    if (!formData.expiryDate)
      temp.expiryDate = "Expiry date is required";

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      console.log("Stock Data:", formData);
      onClose(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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

export default AddStockModal;