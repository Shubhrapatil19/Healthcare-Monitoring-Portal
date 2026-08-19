import { useState, useMemo } from "react";
import {
  Pill,
  Plus,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Save,
  X,
  AlertTriangle,
  FileText,
} from "lucide-react";
import AddMedicineModal from "../../Component/UserAddMed";

import "./UserManage.css";

const ITEMS_PER_PAGE = 3;

const UserManage = ({ medicines, onAddMedicine, onEditMedicine, onDeleteMedicine, loading }) => {
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    medicineName: "",
    dosage: "",
    timing: "",
    frequency: "",
    notes: "",
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    visible: false,
    medicine: null,
  });

  const filteredMedicines = useMemo(() => {
    if (!medicines) return [];
    if (!searchTerm.trim()) return medicines;
    const term = searchTerm.toLowerCase();
    return medicines.filter(
      (med) =>
        med.medicineName.toLowerCase().includes(term) ||
        med.dosage.toLowerCase().includes(term) ||
        med.frequency.toLowerCase().includes(term)
    );
  }, [medicines, searchTerm]);

  const totalPages = useMemo(() => {
    if (!filteredMedicines) return 0;
    return Math.max(1, Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE));
  }, [filteredMedicines]);

  const paginatedMedicines = useMemo(() => {
    if (!filteredMedicines) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMedicines.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMedicines, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleAddMedicine = () => {
    setShowAddMedicineModal(true);
  };

  const handleCloseMedicineModal = (medicineData) => {
    setShowAddMedicineModal(false);

    if (medicineData && onAddMedicine) {
      onAddMedicine(medicineData);
    }
  };

  // ===== INLINE EDIT HANDLERS =====
  const handleStartEdit = (medicine) => {
    setEditingId(medicine.id);
    setEditFormData({
      medicineName: medicine.medicineName,
      dosage: medicine.dosage,
      timing: medicine.timing,
      frequency: medicine.frequency,
      notes: medicine.notes || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ medicineName: "", dosage: "", timing: "", frequency: "", notes: "" });
  };

  const handleEditFieldChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = (medicine) => {
    if (!editFormData.medicineName.trim() || !editFormData.dosage.trim()) {
      return; // basic guard against empty required fields
    }

    if (onEditMedicine) {
      onEditMedicine({
        ...medicine,
        ...editFormData,
        notes: editFormData.notes.trim(),
      });
    }

    setEditingId(null);
  };

  const handleDeleteMedicine = (medicine) => {
    setDeleteConfirmation({ visible: true, medicine });
  };

  const confirmDeleteMedicine = () => {
    if (deleteConfirmation.medicine && onDeleteMedicine) {
      onDeleteMedicine(deleteConfirmation.medicine.id);
    }
    setDeleteConfirmation({ visible: false, medicine: null });
  };

  const cancelDeleteMedicine = () => {
    setDeleteConfirmation({ visible: false, medicine: null });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // ===== FIX: safe default is "upcoming", not "taken" =====
  // Previously this defaulted to "taken" whenever status was missing,
  // null, empty, or any unexpected value — which made brand-new
  // medicines (with no status yet) show up as already "Taken".
  // Also normalizes case so "Taken" / "TAKEN" / "taken" all match.
  return (
    <>
      {showAddMedicineModal && (
        <AddMedicineModal onClose={handleCloseMedicineModal} />
      )}

      <div className="dashboard-card active-card user-manage-card">
        <div className="card-header user-manage-header">
          <div className="header-title">
            <Pill />
            My Medicine
          </div>

          <div className="medicine-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search medicine..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-card">
            <Pill size={60} />
            <h4>Loading your medicines...</h4>
          </div>
        ) : medicines && medicines.length === 0 ? (
          <div className="empty-card">
            <Pill size={60} />
            <h4>No medicine added yet</h4>
            <p>Add your medicine to see your medicine list</p>
            <button className="add-first-medicine-btn" onClick={handleAddMedicine}>
              <Plus size={24} />
              <span>Add Your First Medicine</span>
            </button>
          </div>
        ) : (
          <div className="medicine-list medicine-list--my-medicine">
            <div className="medicine-table-header">
              <span className="medicine-col medicine-name-col">Medicine</span>
              <span className="medicine-col medicine-dosage-col">Dosage</span>
              <span className="medicine-col medicine-time-col">Timing</span>
              <span className="medicine-col medicine-frequency-col">Frequency</span>
              <span className="medicine-col medicine-actions-col">Actions</span>
            </div>

            <div className="medicine-items-wrapper">
              {paginatedMedicines.length > 0 ? (
                paginatedMedicines.map((medicine) => {
                  const isEditing = editingId === medicine.id;
                  const savedNotes = String(
                    medicine.notes || medicine.note || medicine.instructions || ""
                  ).trim();

                  return (
                    <div
                      key={medicine.id}
                      className={`medicine-item ${isEditing ? "editing" : ""}`}
                    >
                      {isEditing ? (
                        <>
                          <div className="medicine-info">
                            <input
                              type="text"
                              className="edit-input"
                              value={editFormData.medicineName}
                              onChange={(e) =>
                                handleEditFieldChange("medicineName", e.target.value)
                              }
                              placeholder="Medicine name"
                            />
                          </div>
                          <div className="medicine-dosage-value">
                            <input
                              type="text"
                              className="edit-input"
                              value={editFormData.dosage}
                              onChange={(e) =>
                                handleEditFieldChange("dosage", e.target.value)
                              }
                              placeholder="Dosage"
                            />
                          </div>
                          <div className="medicine-time-value">
                            <input
                              type="text"
                              className="edit-input"
                              value={editFormData.timing}
                              onChange={(e) =>
                                handleEditFieldChange("timing", e.target.value)
                              }
                              placeholder="Timing"
                            />
                          </div>
                          <div className="medicine-frequency-value">
                            <input
                              type="text"
                              className="edit-input"
                              value={editFormData.frequency}
                              onChange={(e) =>
                                handleEditFieldChange("frequency", e.target.value)
                              }
                              placeholder="Frequency"
                            />
                          </div>
                          <div className="medicine-actions">
                            <button
                              className="action-btn save-btn"
                              title="Save"
                              onClick={() => handleSaveEdit(medicine)}
                            >
                              <Save size={15} />
                            </button>
                            <button
                              className="action-btn cancel-btn"
                              title="Cancel"
                              onClick={handleCancelEdit}
                            >
                              <X size={15} />
                            </button>
                          </div>
                          <div className="medicine-notes-edit">
                            <label htmlFor={`medicine-notes-${medicine.id}`}>Notes</label>
                            <textarea
                              id={`medicine-notes-${medicine.id}`}
                              className="edit-input medicine-notes-textarea"
                              value={editFormData.notes}
                              onChange={(e) =>
                                handleEditFieldChange("notes", e.target.value)
                              }
                              placeholder="Add instructions, meal timing, or doctor notes"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="medicine-info">
                            <h5>{medicine.medicineName}</h5>
                          </div>
                          <div className="medicine-dosage-value">{medicine.dosage}</div>
                          <div className="medicine-time-value">
                            <Clock size={14} />
                            {medicine.timing || medicine.time || "—"}
                          </div>
                          <div className="medicine-frequency-value">{medicine.frequency}</div>
                          <div className="medicine-actions">
                            <button
                              className="action-btn edit-btn"
                              title="Edit"
                              onClick={() => handleStartEdit(medicine)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              title="Delete"
                              onClick={() => handleDeleteMedicine(medicine)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          {savedNotes && (
                            <div className="medicine-notes-panel">
                              <div className="medicine-notes-label">
                                <FileText size={14} />
                                <span>Notes</span>
                              </div>
                              <p>{savedNotes}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="no-results-found">
                  <Search size={28} />
                  <p>No medicine found matching "{searchTerm}"</p>
                </div>
              )}
            </div>

            <div className="user-manage-footer">
              <div className="medicine-count-info">
                Showing {paginatedMedicines.length} of {filteredMedicines.length} medicines
              </div>

              <div className="user-manage-footer-actions">
                <button className="add-more-btn" onClick={handleAddMedicine}>
                  <Plus size={24} />
                  Add More Medicine
                </button>

                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        className={`pagination-btn ${page === currentPage ? "active" : ""}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {deleteConfirmation.visible && (
        <div className="confirm-modal-overlay" onClick={cancelDeleteMedicine}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <AlertTriangle size={30} />
            </div>
            <h2>Confirm Deletion</h2>
            <p className="confirm-modal-text">Are you sure you want to delete</p>
            <p className="confirm-modal-medicine">"{deleteConfirmation.medicine?.medicineName}"?</p>
            <p className="confirm-modal-hint">This action cannot be undone.</p>
            <div className="confirm-modal-actions">
              <button className="confirm-btn cancel" onClick={cancelDeleteMedicine}>
                Cancel
              </button>
              <button className="confirm-btn delete" onClick={confirmDeleteMedicine}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManage;





