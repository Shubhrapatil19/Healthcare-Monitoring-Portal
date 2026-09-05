import { useCallback, useEffect, useMemo, useState } from "react";
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


const TIME_HOUR_OPTIONS = Array.from(
  { length: 12 },
  (_, index) => String(index + 1).padStart(2, "0")
);

const TIME_MINUTE_OPTIONS = Array.from(
  { length: 60 },
  (_, index) => String(index).padStart(2, "0")
);
const ITEMS_PER_PAGE = 3;
const TODAY_SCHEDULE_CACHE_KEY = "todayScheduleCache";
const COMPLETED_TODAY_DOSE_KEYS = "completedTodayDoseKeys";

const FREQUENCY_OPTIONS = [
  { value: "ONCE_A_DAY", label: "Once a day" },
  { value: "TWICE_A_DAY", label: "Twice a day" },
  { value: "THRICE_A_DAY", label: "Three times a day" },
  { value: "AS_NEEDED", label: "As needed" },
  { value: "WEEKLY", label: "Weekly" },
];

const FREQUENCY_LABEL_TO_VALUE = FREQUENCY_OPTIONS.reduce(
  (labels, option) => ({
    ...labels,
    [option.label.toLowerCase()]: option.value,
  }),
  {}
);
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

  const [editTimingValues, setEditTimingValues] =
    useState([""]);

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

  const getMedicineId = (medicine) => {
    return (
      medicine?.id ??
      medicine?._id ??
      medicine?.medicineId ??
      medicine?.medicine_id
    );
  };
  const todayForDateInput = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const normalizeDateForInput = (value) => {
    const raw = String(value || "").trim();

    if (!raw) return "";

    const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
    }

    const dmyMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }

    return "";
  };

  const formatDateForBackend = (value) => {
    const inputDate = normalizeDateForInput(value);
    if (!inputDate) return "";

    const [year, month, day] = inputDate.split("-");
    return `${day}-${month}-${year}`;
  };

  const getEditableScheduleDates = (medicine) => {
    const today = todayForDateInput();
    const originalStart = normalizeDateForInput(medicine?.startDate);
    const originalEnd = normalizeDateForInput(medicine?.endDate);
    const startDate = originalStart && originalStart >= today ? originalStart : today;
    const endDate = originalEnd && originalEnd >= startDate ? originalEnd : startDate;

    return {
      startDate: formatDateForBackend(startDate),
      endDate: formatDateForBackend(endDate),
    };
  };

  const formatTimeForBackend = (value) => {
    const raw = String(value || "").trim();

    if (!raw) return "";

    const meridiemMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (meridiemMatch) {
      const hour = String(Number(meridiemMatch[1])).padStart(2, "0");
      return `${hour}:${meridiemMatch[2]} ${meridiemMatch[3].toUpperCase()}`;
    }

    const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!twentyFourHourMatch) return raw;

    const hour24 = Number(twentyFourHourMatch[1]);
    const minute = twentyFourHourMatch[2];
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;

    return `${String(hour12).padStart(2, "0")}:${minute} ${period}`;
  };

  const normalizeTimeForInput = (value) => {
    const raw = String(value || "").trim();

    if (!raw) return "";

    const meridiemMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);

    if (meridiemMatch) {
      let hour = Number(meridiemMatch[1]);
      const minute = meridiemMatch[2];
      const period = meridiemMatch[3].toUpperCase();

      if (period === "PM" && hour < 12) {
        hour += 12;
      }

      if (period === "AM" && hour === 12) {
        hour = 0;
      }

      return String(hour).padStart(2, "0") + ":" + minute;
    }

    const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

    if (!twentyFourHourMatch) return "";

    return String(Number(twentyFourHourMatch[1])).padStart(2, "0") + ":" + twentyFourHourMatch[2];
  };

  const getTimePeriod = (value) => {
    const raw = String(value || "").trim();
    const meridiemMatch = raw.match(/\b(AM|PM)\b/i);

    if (meridiemMatch) {
      return meridiemMatch[1].toUpperCase();
    }

    const timeInput = normalizeTimeForInput(raw);
    const hour = Number(timeInput.split(":")[0]);

    return Number.isFinite(hour) && hour >= 12 ? "PM" : "AM";
  };

  const getTimeParts12 = (value) => {
    const timeInput = normalizeTimeForInput(value);
    const [hourValue = "00", minute = "00"] = timeInput.split(":");
    const hour12 = Number(hourValue) % 12 || 12;

    return {
      hour: String(hour12).padStart(2, "0"),
      minute,
      period: getTimePeriod(value),
    };
  };

  const buildTimeWithPeriod = (timeValue, period) => {
    const timeInput = normalizeTimeForInput(timeValue);

    if (!timeInput) return "";

    const [hourValue, minute] = timeInput.split(":");
    let hour = Number(hourValue) % 12;

    if (String(period).toUpperCase() === "PM") {
      hour += 12;
    }

    return String(hour).padStart(2, "0") + ":" + minute;
  };

  const getFrequencyDoseCount = (frequency) => {
    const normalizedFrequency =
      normalizeFrequencyValue(frequency);

    const counts = {
      ONCE_A_DAY: 1,
      TWICE_A_DAY: 2,
      THRICE_A_DAY: 3,
      THREE_TIMES_A_DAY: 3,
    };

    return counts[normalizedFrequency] || null;
  };

  const alignTimingSlots = (times, frequency) => {
    const normalizedTimes =
      times.map((time) => normalizeTimeForInput(time));
    const expectedCount =
      getFrequencyDoseCount(frequency);

    if (!expectedCount) {
      return normalizedTimes.length > 0
        ? normalizedTimes
        : [""];
    }

    return Array.from(
      { length: expectedCount },
      (_, index) => normalizedTimes[index] || ""
    );
  };

  const getEditTimingValues = () => {
    return editTimingValues.length > 0
      ? editTimingValues
      : [""];
  };

  const normalizeFrequencyValue = (value) => {
    const raw = String(value || "").trim();

    if (!raw) return "";

    const directOption = FREQUENCY_OPTIONS.find(
      (option) => option.value === raw
    );

    if (directOption) {
      return directOption.value;
    }

    return FREQUENCY_LABEL_TO_VALUE[raw.toLowerCase()] || raw;
  };

  const normalizeScheduleValue = (value) =>
    String(value ?? "").trim().toLowerCase();

  const getScheduleMedicineId = (item) => {
    return (
      item?.medicineId ??
      item?.medicine_id ??
      item?.medicine?.id ??
      item?.medicine?._id ??
      item?.medicine?.medicineId ??
      item?.medicine?.medicine_id
    );
  };

  const getScheduleMedicineName = (item) => {
    return (
      item?.medicineName ??
      item?.medicine_name ??
      item?.medicine?.medicineName ??
      item?.medicine?.medicine_name ??
      item?.medicine?.name
    );
  };

  const removeMedicineFromTodayScheduleCache = (medicine) => {
    const deletedMedicineId = normalizeScheduleValue(getMedicineId(medicine));
    const deletedMedicineName = normalizeScheduleValue(
      medicine?.medicineName || medicine?.medicine_name || medicine?.name
    );

    if (!deletedMedicineId && !deletedMedicineName) return;

    try {
      const rawSchedule = localStorage.getItem(TODAY_SCHEDULE_CACHE_KEY);
      const cachedSchedule = JSON.parse(rawSchedule || "[]");

      if (Array.isArray(cachedSchedule)) {
        const nextSchedule = cachedSchedule.filter((dose) => {
          const doseMedicineId = normalizeScheduleValue(
            getScheduleMedicineId(dose)
          );
          const doseMedicineName = normalizeScheduleValue(
            getScheduleMedicineName(dose)
          );

          if (deletedMedicineId && doseMedicineId === deletedMedicineId) {
            return false;
          }

          return !(
            deletedMedicineName &&
            !doseMedicineId &&
            doseMedicineName === deletedMedicineName
          );
        });

        if (nextSchedule.length > 0) {
          localStorage.setItem(
            TODAY_SCHEDULE_CACHE_KEY,
            JSON.stringify(nextSchedule)
          );
        } else {
          localStorage.removeItem(TODAY_SCHEDULE_CACHE_KEY);
          localStorage.removeItem("todaySchedulePage");
        }
      }

      const rawCompletedKeys = localStorage.getItem(COMPLETED_TODAY_DOSE_KEYS);
      const completedKeys = JSON.parse(rawCompletedKeys || "[]");

      if (Array.isArray(completedKeys) && deletedMedicineName) {
        const nextKeys = completedKeys.filter(
          (key) => !String(key).startsWith(`details:${deletedMedicineName}|`)
        );

        localStorage.setItem(
          COMPLETED_TODAY_DOSE_KEYS,
          JSON.stringify(nextKeys)
        );
      }
    } catch {
      localStorage.removeItem(TODAY_SCHEDULE_CACHE_KEY);
      localStorage.removeItem("todaySchedulePage");
    }
  };


  // =========================================================
  // REFRESH MEDICINES
  //
  // GET /api/medicines
  // =========================================================

  const refreshMedicines = useCallback(async (showErrorToast = true) => {
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

      if (showErrorToast) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to load medicines."
        );
      }

      return [];
    }

  }, []);

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

  useEffect(() => {
    if (editingId || deleting) {
      return undefined;
    }

    let cancelled = false;

    const intervalId = setInterval(
      async () => {
        if (cancelled) return;
        await refreshMedicines(false);
      },
      5000
    );

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [editingId, deleting, refreshMedicines]);

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
          if (
            editingId &&
            getMedicineId(medicine) ===
              editingId
          ) {
            return true;
          }

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
      editingId,
    ]);

  const editingMedicine =
    useMemo(() => {
      if (!editingId) {
        return null;
      }

      return medicines.find(
        (medicine) =>
          getMedicineId(medicine) ===
          editingId
      ) || null;
    }, [medicines, editingId]);

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

      const pageItems =
        filteredMedicines.slice(
          start,
          start +
            ITEMS_PER_PAGE
        );

      if (
        editingMedicine &&
        !pageItems.some(
          (medicine) =>
            getMedicineId(medicine) ===
            editingId
        )
      ) {
        return [
          editingMedicine,
          ...pageItems,
        ].slice(0, ITEMS_PER_PAGE);
      }

      return pageItems;
    }, [
      filteredMedicines,
      currentPage,
      editingMedicine,
      editingId,
    ]);
  const medicineRangeStart =
    filteredMedicines.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const medicineRangeEnd =
    Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      filteredMedicines.length
    );
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
      getMedicineId(medicine)
    );

    const doseTimes =
      Array.isArray(
        medicine.doseTimes
      )
        ? medicine.doseTimes
        : [];

    const rawTimingValues =
      doseTimes.length > 0
        ? doseTimes
        : String(
            medicine.timing ||
              medicine.time ||
              ""
          )
            .split(",")
            .map((time) => time.trim())
            .filter(Boolean);

    setEditTimingValues(
      alignTimingSlots(
        rawTimingValues,
        medicine.frequency
      )
    );
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
    setEditTimingValues([""]);

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

    if (field === "frequency") {
      setEditTimingValues((prev) =>
        alignTimingSlots(prev, value)
      );
    }
  };

  const handleEditTimingChange = (
    index,
    value
  ) => {
    setEditTimingValues((prev) => {
      const times = [...prev];
      const currentPeriod = getTimePeriod(times[index]);

      times[index] = buildTimeWithPeriod(
        value,
        currentPeriod
      );

      setEditFormData((form) => ({
        ...form,
        timing: times.join(", "),
      }));

      return times;
    });
  };

  const handleEditTimingPeriodChange = (
    index,
    period
  ) => {
    setEditTimingValues((prev) => {
      const times = [...prev];

      times[index] = buildTimeWithPeriod(
        times[index],
        period
      );

      setEditFormData((form) => ({
        ...form,
        timing: times.join(", "),
      }));

      return times;
    });
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
        !normalizeFrequencyValue(editFormData.frequency)
      ) {
        toast.error(
          "Frequency is required"
        );

        return;
      }

      const doseTimes =
        editTimingValues
          .map(
            (time) =>
              formatTimeForBackend(time)
          )
          .filter(Boolean);

      const scheduleDates =
        getEditableScheduleDates(
          medicine
        );

      const payload = {
        medicineName:
          editFormData.medicineName.trim(),

        dosage:
          editFormData.dosage.trim(),

        frequency:
          normalizeFrequencyValue(editFormData.frequency),

        doseTimes,

        startDate:
          scheduleDates.startDate,

        endDate:
          scheduleDates.endDate,

        notes:
          editFormData.notes.trim(),
      };

      console.log(
        "UPDATE MEDICINE PAYLOAD:",
        payload
      );

      setSavingEdit(true);

      try {
        const response =
          await api.put(
            `/api/medicines/${getMedicineId(medicine)}`,
            payload
          );

        toast.success(
          response?.data?.message ||
            "Medicine updated successfully!"
        );

        removeMedicineFromTodayScheduleCache(medicine);

        window.dispatchEvent(
          new CustomEvent("medicineScheduleChanged")
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

      if (!getMedicineId(medicine)) {
        toast.error(
          "Medicine ID not found."
        );

        return;
      }

      setDeleting(true);

      try {
        const response =
          await api.delete(
            `/api/medicines/${getMedicineId(medicine)}`
          );

        toast.success(
          response?.data?.message ||
            "Medicine deleted successfully!"
        );

        removeMedicineFromTodayScheduleCache(medicine);

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

  const getDoseTimes = (
    medicine
  ) => {
    if (
      Array.isArray(
        medicine.doseTimes
      ) &&
      medicine.doseTimes.length >
        0
    ) {
      return medicine.doseTimes.filter(Boolean);
    }

    const timing =
      medicine.timing ||
      medicine.time ||
      "";

    return String(timing)
      .split(",")
      .map((time) => time.trim())
      .filter(Boolean);
  };

  const getFrequencyDisplay = (
    frequency
  ) => {
    const labels = {
      ONCE_A_DAY: "Once a day",
      TWICE_A_DAY: "Twice a day",
      THRICE_A_DAY: "Three times a day",
      THREE_TIMES_A_DAY: "Three times a day",
      AS_NEEDED: "As needed",
      WEEKLY: "Weekly",
    };

    return labels[frequency] || frequency || "-";
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
                      getMedicineId(medicine);

                    const savedNotes =
                      String(
                        medicine.notes ||
                          ""
                      ).trim();

                    return (
                      <div
                        key={
                          getMedicineId(medicine)
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

                            <div className="medicine-time-value medicine-edit-time-value">
                              <div className="medicine-edit-time-list">
                                {getEditTimingValues().map(
                                  (
                                    timeValue,
                                    timeIndex
                                  ) => {
                                    const timeParts = getTimeParts12(timeValue);

                                    return (
                                      <div
                                        className="medicine-edit-time-row"
                                        key={`edit-time-${timeIndex}`}
                                      >
                                        <select
                                          className="edit-input medicine-edit-time-input"
                                          value={timeParts.hour}
                                          onChange={(e) =>
                                            handleEditTimingChange(
                                              timeIndex,
                                              `${e.target.value}:${timeParts.minute}`
                                            )
                                          }
                                          aria-label={`Dose ${timeIndex + 1} hour`}
                                        >
                                          {TIME_HOUR_OPTIONS.map((hour) => (
                                            <option key={hour} value={hour}>
                                              {hour}
                                            </option>
                                          ))}
                                        </select>

                                        <select
                                          className="edit-input medicine-edit-time-input"
                                          value={timeParts.minute}
                                          onChange={(e) =>
                                            handleEditTimingChange(
                                              timeIndex,
                                              `${timeParts.hour}:${e.target.value}`
                                            )
                                          }
                                          aria-label={`Dose ${timeIndex + 1} minute`}
                                        >
                                          {TIME_MINUTE_OPTIONS.map((minuteOption) => (
                                            <option key={minuteOption} value={minuteOption}>
                                              {minuteOption}
                                            </option>
                                          ))}
                                        </select>

                                        <select
                                          className="edit-input medicine-edit-period-select"
                                          value={timeParts.period}
                                          onChange={(e) =>
                                            handleEditTimingPeriodChange(
                                              timeIndex,
                                              e.target.value
                                            )
                                          }
                                          aria-label={`Dose ${timeIndex + 1} AM or PM`}
                                        >
                                          <option value="AM">
                                            AM
                                          </option>

                                          <option value="PM">
                                            PM
                                          </option>
                                        </select>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>

                            {/* FREQUENCY */}

                            <div className="medicine-frequency-value medicine-frequency-value--editing">
                              <select
                                className="edit-input medicine-edit-frequency-select"
                                value={
                                  normalizeFrequencyValue(
                                    editFormData.frequency
                                  )
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
                                aria-label="Medicine frequency"
                              >
                                <option value="">
                                  Select frequency
                                </option>

                                {FREQUENCY_OPTIONS.map(
                                  (option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            {/* ACTIONS */}

                            <div className="medicine-actions">

                              <button
                                type="button"
                                className="action-btn manage-save-btn"
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
                                className="action-btn manage-cancel-btn"
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
                                htmlFor={`medicine-notes-${getMedicineId(medicine)}`}
                              >
                                Notes
                              </label>

                              <textarea
                                id={`medicine-notes-${getMedicineId(medicine)}`}
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

                              <div className="medicine-time-chips">
                                {getDoseTimes(
                                  medicine
                                ).length > 0 ? (
                                  getDoseTimes(
                                    medicine
                                  ).map(
                                    (
                                      time,
                                      index
                                    ) => (
                                      <span
                                        className="medicine-time-chip"
                                        key={`${time}-${index}`}
                                      >
                                        {time}
                                      </span>
                                    )
                                  )
                                ) : (
                                  <span className="medicine-time-empty">
                                    —
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* FREQUENCY */}

                            <div className="medicine-frequency-value">
                              {
                                getFrequencyDisplay(
                                  medicine.frequency
                                )
                              }
                            </div>

                            {/* ACTIONS */}

                            <div className="medicine-actions">

                              <button
                                type="button"
                                className="action-btn manage-edit-btn"
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
                                className="action-btn manage-delete-btn"
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
                  medicineRangeStart
                }{" "}
                to{" "}
                {
                  medicineRangeEnd
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









