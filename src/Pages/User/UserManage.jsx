import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

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
import api from "../../api/axiosInstance";

import "./UserManage.css";

const ITEMS_PER_PAGE = 3;

const UserManage = () => {
  // =========================================================
  // MEDICINES
  // =========================================================

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // UI STATE
  // =========================================================

  const [showAddMedicineModal, setShowAddMedicineModal] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [searchTerm, setSearchTerm] =
    useState("");

  // =========================================================
  // EDIT STATE
  // =========================================================

  const [editingId, setEditingId] =
    useState(null);

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [editFormData, setEditFormData] =
    useState({
      medicineName: "",
      dosage: "",
      timing: "",
      frequency: "",
      startDate: "",
      endDate: "",
      notes: "",
    });

  // =========================================================
  // DELETE STATE
  // =========================================================

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState({
    visible: false,
    medicine: null,
  });

  const [deleting, setDeleting] =
    useState(false);

  // =========================================================
  // NORMALIZE MEDICINE RESPONSE
  // =========================================================

  const normalizeMedicineList = (responseData) => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (
      Array.isArray(
        responseData?.medicines
      )
    ) {
      return responseData.medicines;
    }

    if (
      Array.isArray(
        responseData?.data
      )
    ) {
      return responseData.data;
    }

    return [];
  };

  // =========================================================
  // REFRESH MEDICINES
  //
  // GET /api/medicines
  // =========================================================

  const refreshMedicines = async () => {
    try {
      const response =
        await api.get(
          "/api/medicines"
        );

      const list =
        normalizeMedicineList(
          response.data
        );

      setMedicines(list);

      return list;
    } catch (error) {
      console.error(
        "Fetch Medicines Error:",
        error?.response?.data ||
          error.message
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Failed to load medicines."
      );

      return [];
    }
  };

  // =========================================================
  // INITIAL MEDICINE LOAD
  //
  // NOTE:
  // setLoading(true) effect ke andar synchronously
  // call nahi kar rahe.
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadMedicines = async () => {
      try {
        const response =
          await api.get(
            "/api/medicines"
          );

        const responseData =
          response.data;

        let list = [];

        if (
          Array.isArray(
            responseData
          )
        ) {
          list = responseData;
        } else if (
          Array.isArray(
            responseData?.medicines
          )
        ) {
          list =
            responseData.medicines;
        } else if (
          Array.isArray(
            responseData?.data
          )
        ) {
          list =
            responseData.data;
        }

        if (!cancelled) {
          setMedicines(list);
        }
      } catch (error) {
        console.error(
          "Initial Medicines Error:",
          error?.response?.data ||
            error.message
        );

        if (!cancelled) {
          toast.error(
            error?.response?.data
              ?.message ||
              "Failed to load medicines."
          );

          setMedicines([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMedicines();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredMedicines =
    useMemo(() => {
      if (!searchTerm.trim()) {
        return medicines;
      }

      const term =
        searchTerm
          .trim()
          .toLowerCase();

      return medicines.filter(
        (medicine) => {
          const medicineName =
            String(
              medicine.medicineName ||
                ""
            ).toLowerCase();

          const dosage =
            String(
              medicine.dosage ||
                ""
            ).toLowerCase();

          const frequency =
            String(
              medicine.frequency ||
                ""
            ).toLowerCase();

          return (
            medicineName.includes(
              term
            ) ||
            dosage.includes(
              term
            ) ||
            frequency.includes(
              term
            )
          );
        }
      );
    }, [
      medicines,
      searchTerm,
    ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages =
    useMemo(() => {
      return Math.max(
        1,
        Math.ceil(
          filteredMedicines.length /
            ITEMS_PER_PAGE
        )
      );
    }, [filteredMedicines]);

  const paginatedMedicines =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredMedicines.slice(
        start,
        start +
          ITEMS_PER_PAGE
      );
    }, [
      filteredMedicines,
      currentPage,
    ]);

  const handlePageChange = (
    page
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const handleSearchChange = (
    e
  ) => {
    setSearchTerm(
      e.target.value
    );

    setCurrentPage(1);
  };

  // =========================================================
  // ADD MEDICINE MODAL
  // =========================================================

  const handleAddMedicine = () => {
    setShowAddMedicineModal(
      true
    );
  };

  const handleCloseMedicineModal =
    async (medicineData) => {
      setShowAddMedicineModal(
        false
      );

      if (medicineData) {
        await refreshMedicines();
      }
    };

  // =========================================================
  // EDIT START
  // =========================================================

  const handleStartEdit = (
    medicine
  ) => {
    setEditingId(
      medicine.id
    );

    const doseTimes =
      Array.isArray(
        medicine.doseTimes
      )
        ? medicine.doseTimes
        : [];

    setEditFormData({
      medicineName:
        medicine.medicineName ||
        "",

      dosage:
        medicine.dosage ||
        "",

      timing:
        doseTimes.length > 0
          ? doseTimes.join(", ")
          : medicine.timing ||
            medicine.time ||
            "",

      frequency:
        medicine.frequency ||
        "",

      startDate:
        medicine.startDate ||
        "",

      endDate:
        medicine.endDate ||
        "",

      notes:
        medicine.notes ||
        "",
    });
  };

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelEdit = () => {
    setEditingId(null);

    setEditFormData({
      medicineName: "",
      dosage: "",
      timing: "",
      frequency: "",
      startDate: "",
      endDate: "",
      notes: "",
    });
  };

  // =========================================================
  // EDIT FIELD
  // =========================================================

  const handleEditFieldChange = (
    field,
    value
  ) => {
    setEditFormData(
      (prev) => ({
        ...prev,
        [field]: value,
      })
    );
  };

  // =========================================================
  // SAVE EDIT
  //
  // PUT /api/medicines/{medicineId}
  // =========================================================

  const handleSaveEdit =
    async (medicine) => {
      if (
        !editFormData.medicineName.trim()
      ) {
        toast.error(
          "Medicine name is required"
        );

        return;
      }

      if (
        !editFormData.dosage.trim()
      ) {
        toast.error(
          "Dosage is required"
        );

        return;
      }

      if (
        !editFormData.frequency.trim()
      ) {
        toast.error(
          "Frequency is required"
        );

        return;
      }

      const doseTimes =
        editFormData.timing
          .split(",")
          .map(
            (time) =>
              time.trim()
          )
          .filter(Boolean);

      const payload = {
        medicineName:
          editFormData.medicineName.trim(),

        dosage:
          editFormData.dosage.trim(),

        frequency:
          editFormData.frequency.trim(),

        doseTimes,

        startDate:
          editFormData.startDate ||
          medicine.startDate,

        notes:
          editFormData.notes.trim(),
      };

      if (
        editFormData.endDate ||
        medicine.endDate
      ) {
        payload.endDate =
          editFormData.endDate ||
          medicine.endDate;
      }

      console.log(
        "UPDATE MEDICINE PAYLOAD:",
        payload
      );

      setSavingEdit(true);

      try {
        const response =
          await api.put(
            `/api/medicines/${medicine.id}`,
            payload
          );

        toast.success(
          response?.data?.message ||
            "Medicine updated successfully!"
        );

        setEditingId(null);

        await refreshMedicines();
      } catch (error) {
        console.error(
          "Update Medicine Error:",
          error?.response?.data ||
            error.message
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.response?.data
              ?.error ||
            "Failed to update medicine."
        );
      } finally {
        setSavingEdit(false);
      }
    };

  // =========================================================
  // DELETE OPEN
  // =========================================================

  const handleDeleteMedicine = (
    medicine
  ) => {
    setDeleteConfirmation({
      visible: true,
      medicine,
    });
  };

  // =========================================================
  // DELETE CANCEL
  // =========================================================

  const cancelDeleteMedicine =
    () => {
      if (deleting) {
        return;
      }

      setDeleteConfirmation({
        visible: false,
        medicine: null,
      });
    };

  // =========================================================
  // DELETE MEDICINE
  //
  // DELETE /api/medicines/{medicineId}
  // =========================================================

  const confirmDeleteMedicine =
    async () => {
      const medicine =
        deleteConfirmation.medicine;

      if (!medicine?.id) {
        toast.error(
          "Medicine ID not found."
        );

        return;
      }

      setDeleting(true);

      try {
        const response =
          await api.delete(
            `/api/medicines/${medicine.id}`
          );

        toast.success(
          response?.data?.message ||
            "Medicine deleted successfully!"
        );

        setDeleteConfirmation({
          visible: false,
          medicine: null,
        });

        await refreshMedicines();
      } catch (error) {
        console.error(
          "Delete Medicine Error:",
          error?.response?.data ||
            error.message
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.response?.data
              ?.error ||
            "Failed to delete medicine."
        );
      } finally {
        setDeleting(false);
      }
    };

  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  const getPageNumbers = () => {
    const pages = [];

    const maxVisible = 3;

    let start =
      Math.max(
        1,
        currentPage - 1
      );

    let end =
      Math.min(
        totalPages,
        start +
          maxVisible -
          1
      );

    if (
      end -
        start +
        1 <
      maxVisible
    ) {
      start =
        Math.max(
          1,
          end -
            maxVisible +
            1
        );
    }

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    return pages;
  };

  // =========================================================
  // TIMING DISPLAY
  // =========================================================

  const getDoseTimesDisplay = (
    medicine
  ) => {
    if (
      Array.isArray(
        medicine.doseTimes
      ) &&
      medicine.doseTimes.length >
        0
    ) {
      return medicine.doseTimes.join(
        ", "
      );
    }

    return (
      medicine.timing ||
      medicine.time ||
      "—"
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* ADD MEDICINE MODAL */}

      {showAddMedicineModal && (
        <AddMedicineModal
          onClose={
            handleCloseMedicineModal
          }
        />
      )}

      <div className="dashboard-card active-card user-manage-card">

        {/* HEADER */}

        <div className="card-header user-manage-header">

          <div className="header-title">
            <Pill />
            My Medicine
          </div>

          <div className="medicine-search-box">
            <Search
              size={16}
            />

            <input
              type="text"
              placeholder="Search medicine..."
              value={
                searchTerm
              }
              onChange={
                handleSearchChange
              }
            />
          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="empty-card">
            <Pill size={60} />

            <h4>
              Loading your medicines...
            </h4>
          </div>

        ) : medicines.length ===
          0 ? (

          /* EMPTY */

          <div className="empty-card">

            <Pill size={60} />

            <h4>
              No medicine added yet
            </h4>

            <p>
              Add your medicine to see your medicine list
            </p>

            <button
              className="add-first-medicine-btn"
              onClick={
                handleAddMedicine
              }
            >
              <Plus size={24} />

              <span>
                Add Your First Medicine
              </span>
            </button>

          </div>

        ) : (

          /* MEDICINE LIST */

          <div className="medicine-list medicine-list--my-medicine">

            {/* HEADER */}

            <div className="medicine-table-header">

              <span className="medicine-col medicine-name-col">
                Medicine
              </span>

              <span className="medicine-col medicine-dosage-col">
                Dosage
              </span>

              <span className="medicine-col medicine-time-col">
                Timing
              </span>

              <span className="medicine-col medicine-frequency-col">
                Frequency
              </span>

              <span className="medicine-col medicine-actions-col">
                Actions
              </span>

            </div>

            {/* MEDICINE ITEMS */}

            <div className="medicine-items-wrapper">

              {paginatedMedicines.length >
              0 ? (

                paginatedMedicines.map(
                  (medicine) => {
                    const isEditing =
                      editingId ===
                      medicine.id;

                    const savedNotes =
                      String(
                        medicine.notes ||
                          ""
                      ).trim();

                    return (
                      <div
                        key={
                          medicine.id
                        }
                        className={`medicine-item ${
                          isEditing
                            ? "editing"
                            : ""
                        }`}
                      >
                        {isEditing ? (
                          <>
                            {/* NAME */}

                            <div className="medicine-info">
                              <input
                                type="text"
                                className="edit-input"
                                value={
                                  editFormData.medicineName
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleEditFieldChange(
                                    "medicineName",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Medicine name"
                              />
                            </div>

                            {/* DOSAGE */}

                            <div className="medicine-dosage-value">
                              <input
                                type="text"
                                className="edit-input"
                                value={
                                  editFormData.dosage
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleEditFieldChange(
                                    "dosage",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Dosage"
                              />
                            </div>

                            {/* TIMING */}

                            <div className="medicine-time-value">
                              <input
                                type="text"
                                className="edit-input"
                                value={
                                  editFormData.timing
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleEditFieldChange(
                                    "timing",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="08:00, 20:00"
                              />
                            </div>

                            {/* FREQUENCY */}

                            <div className="medicine-frequency-value">
                              <input
                                type="text"
                                className="edit-input"
                                value={
                                  editFormData.frequency
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleEditFieldChange(
                                    "frequency",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Frequency"
                              />
                            </div>

                            {/* ACTIONS */}

                            <div className="medicine-actions">

                              <button
                                type="button"
                                className="action-btn save-btn"
                                title="Save"
                                disabled={
                                  savingEdit
                                }
                                onClick={() =>
                                  handleSaveEdit(
                                    medicine
                                  )
                                }
                              >
                                <Save
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                className="action-btn cancel-btn"
                                title="Cancel"
                                disabled={
                                  savingEdit
                                }
                                onClick={
                                  handleCancelEdit
                                }
                              >
                                <X
                                  size={15}
                                />
                              </button>

                            </div>

                            {/* NOTES */}

                            <div className="medicine-notes-edit">

                              <label
                                htmlFor={`medicine-notes-${medicine.id}`}
                              >
                                Notes
                              </label>

                              <textarea
                                id={`medicine-notes-${medicine.id}`}
                                className="edit-input medicine-notes-textarea"
                                value={
                                  editFormData.notes
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleEditFieldChange(
                                    "notes",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Add instructions, meal timing, or doctor notes"
                              />

                            </div>
                          </>
                        ) : (
                          <>
                            {/* NAME */}

                            <div className="medicine-info">
                              <h5>
                                {
                                  medicine.medicineName
                                }
                              </h5>
                            </div>

                            {/* DOSAGE */}

                            <div className="medicine-dosage-value">
                              {
                                medicine.dosage
                              }
                            </div>

                            {/* TIMING */}

                            <div className="medicine-time-value">
                              <Clock
                                size={
                                  14
                                }
                              />

                              {
                                getDoseTimesDisplay(
                                  medicine
                                )
                              }
                            </div>

                            {/* FREQUENCY */}

                            <div className="medicine-frequency-value">
                              {
                                medicine.frequency
                              }
                            </div>

                            {/* ACTIONS */}

                            <div className="medicine-actions">

                              <button
                                type="button"
                                className="action-btn edit-btn"
                                title="Edit"
                                onClick={() =>
                                  handleStartEdit(
                                    medicine
                                  )
                                }
                              >
                                <Pencil
                                  size={
                                    15
                                  }
                                />
                              </button>

                              <button
                                type="button"
                                className="action-btn delete-btn"
                                title="Delete"
                                onClick={() =>
                                  handleDeleteMedicine(
                                    medicine
                                  )
                                }
                              >
                                <Trash2
                                  size={
                                    15
                                  }
                                />
                              </button>

                            </div>

                            {/* NOTES */}

                            {savedNotes && (
                              <div className="medicine-notes-panel">

                                <div className="medicine-notes-label">
                                  <FileText
                                    size={
                                      14
                                    }
                                  />

                                  <span>
                                    Notes
                                  </span>
                                </div>

                                <p>
                                  {
                                    savedNotes
                                  }
                                </p>

                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }
                )

              ) : (
                <div className="no-results-found">

                  <Search
                    size={28}
                  />

                  <p>
                    No medicine found matching "{searchTerm}"
                  </p>

                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="user-manage-footer">

              <div className="medicine-count-info">
                Showing{" "}
                {
                  paginatedMedicines.length
                }{" "}
                of{" "}
                {
                  filteredMedicines.length
                }{" "}
                medicines
              </div>

              <div className="user-manage-footer-actions">

                <button
                  className="add-more-btn"
                  onClick={
                    handleAddMedicine
                  }
                >
                  <Plus
                    size={24}
                  />

                  Add More Medicine
                </button>

                {totalPages > 1 && (
                  <div className="pagination-controls">

                    <button
                      className="pagination-btn"
                      onClick={() =>
                        handlePageChange(
                          currentPage -
                            1
                        )
                      }
                      disabled={
                        currentPage ===
                        1
                      }
                    >
                      <ChevronLeft
                        size={
                          16
                        }
                      />
                    </button>

                    {getPageNumbers().map(
                      (page) => (
                        <button
                          key={
                            page
                          }
                          className={`pagination-btn ${
                            page ===
                            currentPage
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            handlePageChange(
                              page
                            )
                          }
                        >
                          {
                            page
                          }
                        </button>
                      )
                    )}

                    <button
                      className="pagination-btn"
                      onClick={() =>
                        handlePageChange(
                          currentPage +
                            1
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                    >
                      <ChevronRight
                        size={
                          16
                        }
                      />
                    </button>

                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      {deleteConfirmation.visible && (
        <div
          className="confirm-modal-overlay"
          onClick={
            cancelDeleteMedicine
          }
        >
          <div
            className="confirm-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="confirm-modal-icon">
              <AlertTriangle
                size={30}
              />
            </div>

            <h2>
              Confirm Deletion
            </h2>

            <p className="confirm-modal-text">
              Are you sure you want to delete
            </p>

            <p className="confirm-modal-medicine">
              "
              {
                deleteConfirmation
                  .medicine
                  ?.medicineName
              }
              "?
            </p>

            <p className="confirm-modal-hint">
              This action cannot be undone.
            </p>

            <div className="confirm-modal-actions">

              <button
                type="button"
                className="confirm-btn cancel"
                onClick={
                  cancelDeleteMedicine
                }
                disabled={
                  deleting
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-btn delete"
                onClick={
                  confirmDeleteMedicine
                }
                disabled={
                  deleting
                }
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManage;