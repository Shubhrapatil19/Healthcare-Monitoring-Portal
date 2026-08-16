import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import gsap from "gsap";

import {
  Users,
  ShieldCheck,
  Ban,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Mail,
  Phone,
  CalendarDays,
  User,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  getAdminPatients,
  getAdminPatientStats,
  addAdminPatient,
  toggleAdminPatientStatus,
  deleteAdminPatient,
} from "../../api/AdminMockApi";

import AdminAddUser from "./AdminAddUser";

import "./AdminPatientManagementPage.css";

const ITEMS_PER_PAGE = 7;

const getEmptyPatientForm =
  () => ({
    name: "",
    email: "",
    phone: "",
    age: "",
    dob: "",
    gender: "",
    disease: "",
    address: "",
  });

export default function AdminPatientManagementPage() {
  // =========================================================
  // DATA
  // =========================================================

  const [
    patients,
    setPatients,
  ] =
    useState([]);

  const [
    stats,
    setStats,
  ] =
    useState({
      total: 0,
      active: 0,
      blocked: 0,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  // =========================================================
  // FILTERS
  // =========================================================

  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");

  const [
    dateFilter,
    setDateFilter,
  ] =
    useState("");

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  // =========================================================
  // MODALS
  // =========================================================

  const [
    showAddModal,
    setShowAddModal,
  ] =
    useState(false);

  const [
    viewPatient,
    setViewPatient,
  ] =
    useState(null);

  const [
    deletePatientData,
    setDeletePatientData,
  ] =
    useState(null);

  const [
    blockPatientData,
    setBlockPatientData,
  ] =
    useState(null);

  // =========================================================
  // ADD PATIENT
  // =========================================================

  const [
    addForm,
    setAddForm,
  ] =
    useState(
      getEmptyPatientForm()
    );

  const [
    addErrors,
    setAddErrors,
  ] =
    useState({});

  const [
    savingPatient,
    setSavingPatient,
  ] =
    useState(false);

  const pageRef =
    useRef(null);

  // =========================================================
  // LOAD PATIENTS
  // IMPORTANT:
  // No setLoading(true) here.
  // loading initially true already.
  // =========================================================

  const loadPatients =
    async () => {
      try {
        const [
          patientResponse,
          statResponse,
        ] =
          await Promise.all([
            getAdminPatients(),
            getAdminPatientStats(),
          ]);

        setPatients(
          patientResponse
            ?.data
            ?.patients ||
            []
        );

        setStats({
          total:
            statResponse
              ?.data
              ?.total ||
            0,

          active:
            statResponse
              ?.data
              ?.active ||
            0,

          blocked:
            statResponse
              ?.data
              ?.blocked ||
            0,
        });
      } catch (error) {
        console.error(
          "Admin patient load error:",
          error
        );

        setPatients([]);

        setStats({
          total: 0,
          active: 0,
          blocked: 0,
        });
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // INITIAL LOAD
  // Async callback ensures state update happens
  // after the async mock request
  // =========================================================

  useEffect(() => {
    let cancelled =
      false;

    const fetchPatients =
      async () => {
        try {
          const [
            patientResponse,
            statResponse,
          ] =
            await Promise.all([
              getAdminPatients(),
              getAdminPatientStats(),
            ]);

          if (cancelled) {
            return;
          }

          setPatients(
            patientResponse
              ?.data
              ?.patients ||
              []
          );

          setStats({
            total:
              statResponse
                ?.data
                ?.total ||
              0,

            active:
              statResponse
                ?.data
                ?.active ||
              0,

            blocked:
              statResponse
                ?.data
                ?.blocked ||
              0,
          });
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Admin patient load error:",
            error
          );

          setPatients([]);

          setStats({
            total: 0,
            active: 0,
            blocked: 0,
          });
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    fetchPatients();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // GSAP
  // =========================================================

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    try {
      const context =
        gsap.context(
          () => {
            gsap.from(
              ".pm-header",
              {
                opacity: 0,
                y: -20,
                duration:
                  0.5,
                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".pm-stat-card",
              {
                opacity: 0,
                y: 35,
                scale: 0.9,
                duration:
                  0.5,
                stagger:
                  0.1,
                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".pm-filter-card",
              {
                opacity: 0,
                x: -25,
                duration:
                  0.5,
                delay:
                  0.2,
                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".pm-table-card",
              {
                opacity: 0,
                x: 25,
                duration:
                  0.5,
                delay:
                  0.3,
                clearProps:
                  "all",
              }
            );
          },
          pageRef
        );

      return () =>
        context.revert();
    } catch {
      return undefined;
    }
  }, [loading]);

  // =========================================================
  // FILTERED PATIENTS
  // =========================================================

  const filteredPatients =
    useMemo(() => {
      let list = [
        ...patients,
      ];

      // SEARCH
      if (
        searchInput.trim()
      ) {
        const query =
          searchInput
            .trim()
            .toLowerCase();

        list =
          list.filter(
            (patient) =>
              String(
                patient.name ||
                  ""
              )
                .toLowerCase()
                .includes(
                  query
                ) ||

              String(
                patient.email ||
                  ""
              )
                .toLowerCase()
                .includes(
                  query
                ) ||

              String(
                patient.phone ||
                  ""
              )
                .toLowerCase()
                .includes(
                  query
                )
          );
      }

      // STATUS
      if (
        statusFilter !==
        "All"
      ) {
        list =
          list.filter(
            (patient) =>
              patient.status ===
              statusFilter
          );
      }

      // DATE
      if (dateFilter) {
        const months = {
          Jan: "01",
          Feb: "02",
          Mar: "03",
          Apr: "04",
          May: "05",
          Jun: "06",
          Jul: "07",
          Aug: "08",
          Sep: "09",
          Oct: "10",
          Nov: "11",
          Dec: "12",
        };

        list =
          list.filter(
            (patient) => {
              if (
                !patient.registered
              ) {
                return false;
              }

              const parts =
                patient.registered.split(
                  " "
                );

              if (
                parts.length !==
                3
              ) {
                return false;
              }

              const formatted =
                `${parts[2]}-${months[parts[1]]}-${String(
                  parts[0]
                ).padStart(
                  2,
                  "0"
                )}`;

              return (
                formatted ===
                dateFilter
              );
            }
          );
      }

      return list;
    }, [
      patients,
      searchInput,
      statusFilter,
      dateFilter,
    ]);

  // =========================================================
  // PAGINATION
  // No setCurrentPage inside useEffect
  // =========================================================

  const totalPages =
    Math.ceil(
      filteredPatients.length /
        ITEMS_PER_PAGE
    );

  const safeCurrentPage =
    Math.min(
      currentPage,
      Math.max(
        totalPages,
        1
      )
    );

  const startIndex =
    (safeCurrentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedPatients =
    filteredPatients.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    );

  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  const getPageNumbers =
    () => {
      const pages = [];

      const maxVisible =
        5;

      let start =
        Math.max(
          1,
          safeCurrentPage -
            Math.floor(
              maxVisible / 2
            )
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
        let page = start;
        page <= end;
        page++
      ) {
        pages.push(page);
      }

      return {
        pages,
        start,
      };
    };

  const {
    pages,
    start:
      visibleStart,
  } =
    getPageNumbers();

  // =========================================================
  // ADD FORM CHANGE
  // =========================================================

  const handleAddFormChange =
    (
      field,
      value
    ) => {
      setAddForm(
        (prev) => ({
          ...prev,
          [field]:
            value,
        })
      );

      setAddErrors(
        (prev) => ({
          ...prev,
          [field]:
            "",
        })
      );
    };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateAddForm =
    () => {
      const errors = {};

      if (
        !addForm.name.trim()
      ) {
        errors.name =
          "Full name is required";
      }

      if (
        !addForm.email.trim()
      ) {
        errors.email =
          "Email is required";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          addForm.email
        )
      ) {
        errors.email =
          "Enter a valid email";
      }

      if (
        !addForm.phone.trim()
      ) {
        errors.phone =
          "Phone number is required";
      }

      if (!addForm.dob) {
        errors.dob =
          "Date of birth is required";
      }

      if (!addForm.age) {
        errors.age =
          "Age is required";
      } else if (
        Number(addForm.age) <
          1 ||
        Number(addForm.age) >
          120
      ) {
        errors.age =
          "Enter a valid age";
      }

      if (
        !addForm.gender
      ) {
        errors.gender =
          "Gender is required";
      }

      setAddErrors(
        errors
      );

      return (
        Object.keys(
          errors
        ).length ===
        0
      );
    };

  // =========================================================
  // ADD PATIENT
  // =========================================================

  const handleAddPatient =
    async () => {
      if (
        !validateAddForm()
      ) {
        return;
      }

      setSavingPatient(
        true
      );

      try {
        await addAdminPatient({
          name:
            addForm.name.trim(),

          email:
            addForm.email
              .trim()
              .toLowerCase(),

          phone:
            addForm.phone.trim(),

          age:
            addForm.age,

          dob:
            addForm.dob,

          gender:
            addForm.gender,

          disease:
            addForm.disease.trim(),

          address:
            addForm.address.trim(),
        });

        setAddForm(
          getEmptyPatientForm()
        );

        setAddErrors({});

        setShowAddModal(
          false
        );

        setCurrentPage(1);

        await loadPatients();
      } catch (error) {
        console.error(
          "Add patient error:",
          error
        );
      } finally {
        setSavingPatient(
          false
        );
      }
    };

  // =========================================================
  // BLOCK / ACTIVATE
  // =========================================================

  const handleBlockToggle =
    async (id) => {
      try {
        await toggleAdminPatientStatus(
          id
        );

        setBlockPatientData(
          null
        );

        await loadPatients();

        if (
          viewPatient &&
          String(
            viewPatient.id
          ) ===
            String(id)
        ) {
          const response =
            await getAdminPatients();

          const updated =
            response
              ?.data
              ?.patients
              ?.find(
                (patient) =>
                  String(
                    patient.id
                  ) ===
                  String(id)
              );

          setViewPatient(
            updated ||
              null
          );
        }
      } catch (error) {
        console.error(
          "Patient status update error:",
          error
        );
      }
    };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDeletePatient =
    async (id) => {
      try {
        await deleteAdminPatient(
          id
        );

        setDeletePatientData(
          null
        );

        setViewPatient(
          null
        );

        await loadPatients();
      } catch (error) {
        console.error(
          "Patient delete error:",
          error
        );
      }
    };

  // =========================================================
  // INITIALS
  // =========================================================

  const getInitials =
    (name = "") =>
      name
        .split(" ")
        .filter(Boolean)
        .map(
          (part) =>
            part[0]
        )
        .join("")
        .slice(0, 2)
        .toUpperCase();

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="pm-page"
      ref={pageRef}
    >
      {/* HEADER */}

      <div className="pm-header">
        <div className="pm-header-left">
          <h1>
            PATIENT MANAGEMENT
          </h1>

          <p>
            Manage all registered
            patients and control
            account access.
          </p>
        </div>

        <button
          type="button"
          className="pm-add-btn"
          onClick={() => {
            setAddForm(
              getEmptyPatientForm()
            );

            setAddErrors({});

            setShowAddModal(
              true
            );
          }}
        >
          <Plus
            size={18}
          />

          Add Patient
        </button>
      </div>

      {/* STATS */}

      <div className="pm-stats-row">
        <div className="pm-stat-card">
          <div className="pm-stat-icon pm-stat-blue">
            <Users
              size={22}
            />
          </div>

          <div className="pm-stat-info">
            <span className="pm-stat-label">
              Total Patients
            </span>

            <span className="pm-stat-value">
              {loading
                ? "..."
                : stats.total}
            </span>

            <span className="pm-stat-sub">
              All registered patients
            </span>
          </div>
        </div>

        <div className="pm-stat-card">
          <div className="pm-stat-icon pm-stat-green">
            <ShieldCheck
              size={22}
            />
          </div>

          <div className="pm-stat-info">
            <span className="pm-stat-label">
              Active Patients
            </span>

            <span className="pm-stat-value">
              {loading
                ? "..."
                : stats.active}
            </span>

            <span className="pm-stat-sub">
              Currently active accounts
            </span>
          </div>
        </div>

        <div className="pm-stat-card">
          <div className="pm-stat-icon pm-stat-red">
            <Ban
              size={22}
            />
          </div>

          <div className="pm-stat-info">
            <span className="pm-stat-label">
              Blocked Patients
            </span>

            <span className="pm-stat-value">
              {loading
                ? "..."
                : stats.blocked}
            </span>

            <span className="pm-stat-sub">
              Blocked accounts
            </span>
          </div>
        </div>
      </div>

      {/* FILTER */}

      <div className="pm-filter-card">
        <div className="pm-filter-row">
          <div className="pm-filter-field pm-search-field">
            <Search
              size={16}
              className="pm-search-icon"
            />

            <input
              type="text"
              placeholder="Search by Name, Email or Phone"
              value={
                searchInput
              }
              onChange={(e) => {
                setSearchInput(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            />
          </div>

          <div className="pm-filter-field">
            <select
              value={
                statusFilter
              }
              onChange={(e) => {
                setStatusFilter(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Blocked">
                Blocked
              </option>
            </select>
          </div>

          <div className="pm-filter-field">
            <input
              type="date"
              value={
                dateFilter
              }
              onChange={(e) => {
                setDateFilter(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}

      <div className="pm-table-card">
        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>
                  Patient Name
                </th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>
                  Registered
                </th>
                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="pm-no-data"
                  >
                    Loading patients...
                  </td>
                </tr>
              ) : paginatedPatients.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="pm-no-data"
                  >
                    No patients found
                  </td>
                </tr>
              ) : (
                paginatedPatients.map(
                  (
                    patient,
                    index
                  ) => (
                    <tr
                      key={
                        patient.id
                      }
                    >
                      <td className="pm-id-cell">
                        {startIndex +
                          index +
                          1}
                      </td>

                      <td>
                        <div className="pm-patient-name">
                          <div className="pm-avatar">
                            {getInitials(
                              patient.name
                            )}
                          </div>

                          <span>
                            {
                              patient.name
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        {
                          patient.email
                        }
                      </td>

                      <td>
                        {
                          patient.phone
                        }
                      </td>

                      <td>
                        <span
                          className={`pm-status-badge ${
                            patient.status ===
                            "Active"
                              ? "pm-status-active"
                              : "pm-status-blocked"
                          }`}
                        >
                          {
                            patient.status
                          }
                        </span>
                      </td>

                      <td>
                        {
                          patient.registered
                        }
                      </td>

                      <td>
                        <div className="pm-actions">
                          <button
                            type="button"
                            className="pm-action-btn pm-action-view"
                            onClick={() =>
                              setViewPatient(
                                patient
                              )
                            }
                          >
                            <Eye
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            className={`pm-action-btn ${
                              patient.status ===
                              "Active"
                                ? "pm-action-block"
                                : "pm-action-activate"
                            }`}
                            onClick={() =>
                              setBlockPatientData(
                                patient
                              )
                            }
                          >
                            {patient.status ===
                            "Active" ? (
                              <UserX
                                size={15}
                              />
                            ) : (
                              <UserCheck
                                size={15}
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            className="pm-action-btn pm-action-delete"
                            onClick={() =>
                              setDeletePatientData(
                                patient
                              )
                            }
                          >
                            <Trash2
                              size={15}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {!loading &&
          filteredPatients.length >
            0 && (
            <div className="pm-pagination">
              <div className="pm-pagination-info">
                Showing{" "}
                {startIndex + 1}
                {" – "}
                {Math.min(
                  startIndex +
                    ITEMS_PER_PAGE,
                  filteredPatients.length
                )}
                {" of "}
                {
                  filteredPatients.length
                }
                {" patients"}
              </div>

              <div className="pm-pagination-controls">
                <button
                  type="button"
                  className="pm-page-btn"
                  disabled={
                    safeCurrentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.max(
                        1,
                        safeCurrentPage -
                          1
                      )
                    )
                  }
                >
                  <ChevronLeft
                    size={16}
                  />

                  Previous
                </button>

                {visibleStart >
                  1 && (
                  <>
                    <button
                      type="button"
                      className="pm-page-btn"
                      onClick={() =>
                        setCurrentPage(
                          1
                        )
                      }
                    >
                      1
                    </button>

                    {visibleStart >
                      2 && (
                      <span className="pm-page-ellipsis">
                        ...
                      </span>
                    )}
                  </>
                )}

                {pages.map(
                  (page) => (
                    <button
                      type="button"
                      key={page}
                      className={`pm-page-btn ${
                        safeCurrentPage ===
                        page
                          ? "pm-page-active"
                          : ""
                      }`}
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="pm-page-btn"
                  disabled={
                    safeCurrentPage ===
                      totalPages ||
                    totalPages ===
                      0
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        totalPages,
                        safeCurrentPage +
                          1
                      )
                    )
                  }
                >
                  Next

                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* VIEW MODAL */}

      {viewPatient && (
        <div
          className="pm-modal-overlay"
          onClick={() =>
            setViewPatient(
              null
            )
          }
        >
          <div
            className="pm-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="pm-modal-header">
              <h2>
                Patient Details
              </h2>

              <button
                type="button"
                className="pm-modal-close"
                onClick={() =>
                  setViewPatient(
                    null
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="pm-modal-body">
              <div className="pm-view-banner">
                <div className="pm-view-avatar">
                  {getInitials(
                    viewPatient.name
                  )}
                </div>

                <div className="pm-view-title">
                  <strong>
                    {
                      viewPatient.name
                    }
                  </strong>

                  <span
                    className={`pm-status-badge ${
                      viewPatient.status ===
                      "Active"
                        ? "pm-status-active"
                        : "pm-status-blocked"
                    }`}
                  >
                    {
                      viewPatient.status
                    }
                  </span>
                </div>
              </div>

              <div className="pm-view-grid">
                <div className="pm-view-item">
                  <Mail size={16} />

                  <div>
                    <span>Email</span>

                    <strong>
                      {
                        viewPatient.email
                      }
                    </strong>
                  </div>
                </div>

                <div className="pm-view-item">
                  <Phone size={16} />

                  <div>
                    <span>Phone</span>

                    <strong>
                      {
                        viewPatient.phone
                      }
                    </strong>
                  </div>
                </div>

                <div className="pm-view-item">
                  <CalendarDays
                    size={16}
                  />

                  <div>
                    <span>
                      Registered
                    </span>

                    <strong>
                      {
                        viewPatient.registered
                      }
                    </strong>
                  </div>
                </div>

                <div className="pm-view-item">
                  <User size={16} />

                  <div>
                    <span>
                      Last Login
                    </span>

                    <strong>
                      {
                        viewPatient.lastLogin ||
                        "Never"
                      }
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pm-modal-footer">
              <button
                type="button"
                className="pm-modal-btn-save"
                onClick={() =>
                  setViewPatient(
                    null
                  )
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK MODAL */}

      {blockPatientData && (
        <div
          className="pm-modal-overlay"
          onClick={() =>
            setBlockPatientData(
              null
            )
          }
        >
          <div
            className="pm-modal pm-modal-small"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="pm-modal-header">
              <h2>
                {blockPatientData.status ===
                "Active"
                  ? "Block Patient"
                  : "Activate Patient"}
              </h2>

              <button
                type="button"
                className="pm-modal-close"
                onClick={() =>
                  setBlockPatientData(
                    null
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="pm-modal-body">
              <p className="pm-delete-text">
                Are you sure you want to{" "}
                <strong>
                  {blockPatientData.status ===
                  "Active"
                    ? "block"
                    : "activate"}
                </strong>{" "}
                <strong>
                  {
                    blockPatientData.name
                  }
                </strong>
                ?
              </p>
            </div>

            <div className="pm-modal-footer">
              <button
                type="button"
                className="pm-modal-btn-cancel"
                onClick={() =>
                  setBlockPatientData(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  blockPatientData.status ===
                  "Active"
                    ? "pm-modal-btn-delete"
                    : "pm-modal-btn-save"
                }
                onClick={() =>
                  handleBlockToggle(
                    blockPatientData.id
                  )
                }
              >
                {blockPatientData.status ===
                "Active"
                  ? "Block"
                  : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deletePatientData && (
        <div
          className="pm-modal-overlay"
          onClick={() =>
            setDeletePatientData(
              null
            )
          }
        >
          <div
            className="pm-modal pm-modal-small"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="pm-modal-header">
              <h2>
                Delete Patient
              </h2>

              <button
                type="button"
                className="pm-modal-close"
                onClick={() =>
                  setDeletePatientData(
                    null
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="pm-modal-body">
              <p className="pm-delete-text">
                Are you sure you want
                to delete{" "}
                <strong>
                  {
                    deletePatientData.name
                  }
                </strong>
                ?
              </p>
            </div>

            <div className="pm-modal-footer">
              <button
                type="button"
                className="pm-modal-btn-cancel"
                onClick={() =>
                  setDeletePatientData(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="pm-modal-btn-delete"
                onClick={() =>
                  handleDeletePatient(
                    deletePatientData.id
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PATIENT MODAL */}

      {showAddModal && (
        <AdminAddUser
          form={addForm}
          errors={addErrors}
          saving={savingPatient}
          onChange={handleAddFormChange}
          onClose={() =>
            setShowAddModal(false)
          }
          onSubmit={handleAddPatient}
        />
      )}
    </div>
  );
}
