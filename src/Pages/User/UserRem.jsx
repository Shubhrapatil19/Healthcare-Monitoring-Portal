import { useCallback, useEffect, useState } from "react";
import "./UserRem.css";

import toast from "react-hot-toast";

import {
  Plus,
  Clock,
  Lightbulb,
  Trash2,
  Pill,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "../../api/axiosInstance";

const UserRem = ({
  onAddMedicine,
  onDeleteReminder,
  onReminderActionComplete,
}) => {
  // =========================================================
  // DATE
  // =========================================================

  const today = new Date();

  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // =========================================================
  // STATE
  // =========================================================

  const [pendingReminders, setPendingReminders] = useState([]);
  const [historyReminders, setHistoryReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [historyPage, setHistoryPage] = useState(1);

  // =========================================================
  // NORMALIZE API RESPONSE
  // =========================================================

  const normalizeArray = useCallback((data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.content)) {
      return data.content;
    }

    if (Array.isArray(data?.reminders)) {
      return data.reminders;
    }

    return [];
  }, []);

  // =========================================================
  // GET REMINDER ID
  //
  // Swagger field:
  // reminderId
  // =========================================================

  const getReminderId = useCallback((reminder) =>
    reminder?.reminderId ??
    reminder?.id ??
    null, []);

  const getReminderDate = useCallback((reminder) =>
    reminder?.scheduledDate ||
    reminder?.reminderDate ||
    reminder?.date ||
    "", []);

  const getReminderTime = useCallback((
    reminder
  ) =>
    reminder?.scheduledTime ||
    reminder?.reminderTime ||
    reminder?.timing ||
    reminder?.time ||
    "", []);

  const getReminderStatus = useCallback((reminder) => {
    const status = String(reminder?.status ?? "").trim();

    return status ? status.toUpperCase() : "";
  }, []);

  const normalizeReminder = useCallback((reminder = {}) => ({
    ...reminder,
    id: getReminderId(reminder),
    medicineName:
      reminder.medicineName ||
      reminder.name ||
      "Medicine",
    dosage:
      reminder.dosage ||
      reminder.dose ||
      "",
    scheduledDate:
      getReminderDate(reminder),
    scheduledTime:
      getReminderTime(reminder),
    status: getReminderStatus(reminder),
  }), [
    getReminderDate,
    getReminderId,
    getReminderStatus,
    getReminderTime,
  ]);

  // =========================================================
  // GET TODAY REMINDERS
  //
  // GET /api/reminders/today
  // =========================================================

  const fetchTodayReminders = async () => {
    const response = await api.get(
      "/api/reminders/today"
    );

    const reminders = normalizeArray(
      response.data
    ).map(normalizeReminder);

    setPendingReminders(reminders);

    return reminders;
  };

  // =========================================================
  // GET REMINDER HISTORY
  //
  // GET /api/reminders/history
  // =========================================================

  const fetchReminderHistory = async () => {
    const response = await api.get(
      "/api/reminders/history"
    );

    const reminders = normalizeArray(
      response.data
    ).map(normalizeReminder);

    setHistoryReminders(reminders);

    return reminders;
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    let active = true;

    const loadReminders = async () => {
      try {
        const [
          todayResponse,
          historyResponse,
        ] = await Promise.all([
          api.get(
            "/api/reminders/today"
          ),

          api.get(
            "/api/reminders/history"
          ),
        ]);

        if (!active) {
          return;
        }

        const todayData = normalizeArray(
          todayResponse.data
        ).map(normalizeReminder);

        const historyData = normalizeArray(
          historyResponse.data
        ).map(normalizeReminder);

        setPendingReminders(
          todayData
        );

        setHistoryReminders(
          historyData
        );
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "Initial Reminder Fetch Error:",
          error?.response?.status,
          error?.response?.data ||
            error.message
        );

        setPendingReminders(
          []
        );

        setHistoryReminders(
          []
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Failed to load reminders."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadReminders();

    const intervalId = setInterval(() => {
      setNow(Date.now());
      void loadReminders();
    }, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [normalizeArray, normalizeReminder]);

  // =========================================================
  // DISPLAY DATA
  // =========================================================

  const displayHistory =
    historyReminders;

  const historyItemsPerPage = 5;
  const historyTotalPages = Math.max(
    1,
    Math.ceil(displayHistory.length / historyItemsPerPage)
  );
  const currentHistoryPage = Math.min(
    historyPage,
    historyTotalPages
  );
  const historyStartIndex =
    (currentHistoryPage - 1) * historyItemsPerPage;
  const paginatedHistory = displayHistory.slice(
    historyStartIndex,
    historyStartIndex + historyItemsPerPage
  );
  const historyPageStart =
    displayHistory.length === 0 ? 0 : historyStartIndex + 1;
  const historyPageEnd = Math.min(
    historyStartIndex + historyItemsPerPage,
    displayHistory.length
  );

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "";
    }

    const rawValue = String(value).trim();
    const backendDateMatch = rawValue.match(/^\d{4}-\d{2}-\d{2}/);

    if (backendDateMatch) {
      return backendDateMatch[0];
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return rawValue;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =========================================================
  // 24 HOUR → 12 HOUR
  // =========================================================

  const convertTo12Hour = (
    timeValue
  ) => {
    if (!timeValue) {
      return "";
    }

    const time =
      String(timeValue).trim();

    if (/\b(?:AM|PM)\b/i.test(time)) {
      return time.replace(
        /\s+/g,
        " "
      ).toUpperCase();
    }

    const [
      hoursRaw,
      minutesRaw = "00",
    ] = time.split(":");

    const hours =
      parseInt(
        hoursRaw,
        10
      );

    if (
      Number.isNaN(hours)
    ) {
      return time;
    }

    const ampm =
      hours >= 12
        ? "PM"
        : "AM";

    const hours12 =
      hours % 12 || 12;

    return `${hours12}:${String(
      minutesRaw
    ).padStart(
      2,
      "0"
    )} ${ampm}`;
  };

  const REMINDER_LEAD_TIME_MS = 10 * 60 * 1000;
  const MISSED_GRACE_TIME_MS = 30 * 60 * 1000;

  const parseReminderDateTime = (reminder) => {
    const time = String(
      getReminderTime(reminder)
    ).trim();

    if (!time) {
      return null;
    }

    const dateValue =
      reminder?.scheduledDate ||
      reminder?.date ||
      new Date(now);

    let year;
    let month;
    let day;

    if (typeof dateValue === "string") {
      const isoMatch = dateValue.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );
      const dashMatch = dateValue.match(
        /^(\d{2})-(\d{2})-(\d{4})/
      );

      if (isoMatch) {
        year = Number(isoMatch[1]);
        month = Number(isoMatch[2]) - 1;
        day = Number(isoMatch[3]);
      } else if (dashMatch) {
        day = Number(dashMatch[1]);
        month = Number(dashMatch[2]) - 1;
        year = Number(dashMatch[3]);
      }
    }

    if (
      year == null ||
      month == null ||
      day == null
    ) {
      const fallbackDate = new Date(dateValue);

      if (Number.isNaN(fallbackDate.getTime())) {
        const todayDate = new Date(now);
        year = todayDate.getFullYear();
        month = todayDate.getMonth();
        day = todayDate.getDate();
      } else {
        year = fallbackDate.getFullYear();
        month = fallbackDate.getMonth();
        day = fallbackDate.getDate();
      }
    }

    const match = time.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i
    );

    if (!match) {
      return null;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const period = match[3]?.toUpperCase();

    if (period === "PM" && hours < 12) {
      hours += 12;
    }

    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return new Date(
      year,
      month,
      day,
      hours,
      minutes,
      0,
      0
    );
  };

  const shouldShowReminder = (reminder) => {
    const scheduledAt = parseReminderDateTime(reminder);

    if (!scheduledAt) {
      return true;
    }

    const scheduledTime = scheduledAt.getTime();
    const showFromTime = scheduledTime - REMINDER_LEAD_TIME_MS;
    const showUntilTime = scheduledTime + MISSED_GRACE_TIME_MS;

    return now >= showFromTime && now < showUntilTime;
  };

  const isPendingReminder = (reminder) =>
    getReminderStatus(reminder) === "PENDING";

  const isTodayReminder = (reminder) => {
    const scheduledAt = parseReminderDateTime(reminder);
    const todayDate = new Date(now);

    if (!scheduledAt) {
      return true;
    }

    return (
      scheduledAt.getFullYear() === todayDate.getFullYear() &&
      scheduledAt.getMonth() === todayDate.getMonth() &&
      scheduledAt.getDate() === todayDate.getDate()
    );
  };

  const getReminderKey = (reminder) => {
    const reminderId = getReminderId(reminder);

    if (reminderId != null) {
      return `id-${reminderId}`;
    }

    return `${reminder?.medicineName || "medicine"}-${
      reminder?.scheduledDate || reminder?.date || "date"
    }-${getReminderTime(reminder) || "time"}`;
  };

  const pendingReminderMap = new Map();

  [...pendingReminders, ...historyReminders]
    .filter((reminder) =>
      isPendingReminder(reminder) &&
      isTodayReminder(reminder) &&
      shouldShowReminder(reminder)
    )
    .forEach((reminder) => {
      pendingReminderMap.set(getReminderKey(reminder), reminder);
    });

  const displayPending = Array.from(pendingReminderMap.values());

  // =========================================================
  // TAKEN TOAST
  // =========================================================

  const showTakenToast = (
    name
  ) => {
    toast.custom(
      (t) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",

            background:
              "linear-gradient(135deg, #065F46, #0F766E)",

            color: "#fff",

            padding:
              "14px 24px",

            borderRadius:
              "14px",

            fontSize:
              "15px",

            fontWeight:
              "600",

            boxShadow:
              "0 8px 32px rgba(15, 118, 110, 0.35)",

            border:
              "1px solid rgba(255,255,255,0.15)",

            animation:
              t.visible
                ? "slideInUp 0.4s ease-out"
                : "slideOutDown 0.3s ease-in",

            transformOrigin:
              "top",
          }}
        >
          <span
            style={{
              display:
                "inline-flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              width:
                "32px",

              height:
                "32px",

              borderRadius:
                "50%",

              background:
                "rgba(255,255,255,0.2)",

              fontSize:
                "18px",

              animation:
                "popIn 0.5s ease-out",
            }}
          >
            ✓
          </span>

          <div
            style={{
              display:
                "flex",

              flexDirection:
                "column",
            }}
          >
            <span
              style={{
                fontSize:
                  "16px",

                fontWeight:
                  "700",
              }}
            >
              {name}
            </span>

            <span
              style={{
                fontSize:
                  "12px",

                opacity:
                  "0.85",

                fontWeight:
                  "400",
              }}
            >
              Medicine taken successfully! 💊
            </span>
          </div>
        </div>
      ),
      {
        duration: 3000,
      }
    );
  };

  // =========================================================
  // SNOOZE TOAST
  // =========================================================

  const showSnoozeToast = (
    name,
    minutes
  ) => {
    toast.custom(
      (t) => (
        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "12px",

            background:
              "linear-gradient(135deg, #92400E, #D97706)",

            color:
              "#fff",

            padding:
              "14px 24px",

            borderRadius:
              "14px",

            fontSize:
              "15px",

            fontWeight:
              "600",

            boxShadow:
              "0 8px 32px rgba(217, 119, 6, 0.35)",

            border:
              "1px solid rgba(255,255,255,0.15)",

            animation:
              t.visible
                ? "slideInUp 0.4s ease-out"
                : "slideOutDown 0.3s ease-in",

            transformOrigin:
              "top",
          }}
        >
          <span
            style={{
              display:
                "inline-flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              width:
                "32px",

              height:
                "32px",

              borderRadius:
                "50%",

              background:
                "rgba(255,255,255,0.2)",

              fontSize:
                "18px",

              animation:
                "popIn 0.5s ease-out",
            }}
          >
            ⏰
          </span>

          <div
            style={{
              display:
                "flex",

              flexDirection:
                "column",
            }}
          >
            <span
              style={{
                fontSize:
                  "16px",

                fontWeight:
                  "700",
              }}
            >
              {name}
            </span>

            <span
              style={{
                fontSize:
                  "12px",

                opacity:
                  "0.85",

                fontWeight:
                  "400",
              }}
            >
              Snoozed for {minutes} minutes! 😴
            </span>
          </div>
        </div>
      ),
      {
        duration: 3000,
      }
    );
  };

  // =========================================================
  // MARK TAKEN
  //
  // PATCH /api/reminders/{reminderId}/taken
  // =========================================================

  const handleMarkTaken =
    async (reminder) => {
      const reminderId =
        getReminderId(
          reminder
        );

      if (
        reminderId == null
      ) {
        toast.error(
          "Could not find a valid reminder ID."
        );

        return;
      }

      try {
        await api.patch(
          `/api/reminders/${reminderId}/taken`
        );

        showTakenToast(
          reminder.medicineName ||
            "Medicine"
        );

        await Promise.all([
          fetchTodayReminders(),
          fetchReminderHistory(),
        ]);

        if (
          typeof onReminderActionComplete ===
          "function"
        ) {
          await onReminderActionComplete("taken", reminder);
        }
      } catch (error) {
        console.error(
          "Mark Taken Error:",
          error?.response
            ?.status,

          error?.response
            ?.data ||
            error.message
        );

        const errorMessage =
          error?.response
            ?.data
            ?.message ||
          error?.response
            ?.data
            ?.error ||
          "Failed to mark medicine as taken.";

        toast.error(
          errorMessage
        );
      }
    };

  // =========================================================
  // SNOOZE
  //
  // PATCH /api/reminders/{reminderId}/snooze
  //
  // BODY:
  // {
  //   snoozeMinutes: 15
  // }
  // =========================================================

  const handleSnooze =
    async (reminder) => {
      const reminderId =
        getReminderId(
          reminder
        );

      if (
        reminderId == null
      ) {
        toast.error(
          "Could not find a valid reminder ID."
        );

        return;
      }

      const snoozeMinutes =
        15;

      try {
        await api.patch(
          `/api/reminders/${reminderId}/snooze`,
          {
            snoozeMinutes,
          }
        );

        showSnoozeToast(
          reminder.medicineName ||
            "Medicine",

          snoozeMinutes
        );

        await Promise.all([
          fetchTodayReminders(),
          fetchReminderHistory(),
        ]);

        if (
          typeof onReminderActionComplete ===
          "function"
        ) {
          await onReminderActionComplete();
        }
      } catch (error) {
        console.error(
          "Snooze Error:",
          error?.response
            ?.status,

          error?.response
            ?.data ||
            error.message
        );

        const errorMessage =
          error?.response
            ?.data
            ?.message ||
          error?.response
            ?.data
            ?.error ||
          "Failed to snooze reminder.";

        toast.error(
          errorMessage
        );
      }
    };

  // =========================================================
  // DELETE REMINDER
  //
  // DELETE /api/reminders/{reminderId}
  // =========================================================

  const handleDeleteReminder =
    async (reminder) => {
      const reminderId =
        typeof reminder ===
        "object"
          ? getReminderId(
              reminder
            )
          : reminder;

      if (
        reminderId == null
      ) {
        toast.error(
          "Could not find a valid reminder ID."
        );

        return;
      }

      try {
        await api.delete(
          `/api/reminders/${reminderId}`
        );

        toast.success(
          "Reminder deleted successfully!"
        );

        setPendingReminders(
          (prev) =>
            prev.filter(
              (item) =>
                String(
                  getReminderId(
                    item
                  )
                ) !==
                String(
                  reminderId
                )
            )
        );

        setHistoryReminders(
          (prev) =>
            prev.filter(
              (item) =>
                String(
                  getReminderId(
                    item
                  )
                ) !==
                String(
                  reminderId
                )
            )
        );

        await Promise.all([
          fetchTodayReminders(),
          fetchReminderHistory(),
        ]);

        if (
          typeof onDeleteReminder ===
          "function"
        ) {
          onDeleteReminder(
            reminderId
          );
        }

        if (
          typeof onReminderActionComplete ===
          "function"
        ) {
          await onReminderActionComplete();
        }
      } catch (error) {
        console.error(
          "Delete Reminder Error:",
          error?.response
            ?.status,

          error?.response
            ?.data ||
            error.message
        );

        const errorMessage =
          error?.response
            ?.data
            ?.message ||
          error?.response
            ?.data
            ?.error ||
          "Failed to delete reminder.";

        toast.error(
          errorMessage
        );
      }
    };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="rem-page">
      {/* ===============================================
          HEADER
      =============================================== */}

      <div className="rem-header-section">
        <div className="rem-header-top">
          <div className="rem-header-left">
            <h1 className="rem-heading">
              Medicine Reminders
            </h1>

            <p className="rem-subtitle">
              Track your scheduled medications for today
            </p>
          </div>

          <button
            className="rem-add-more-btn rem-header-add-btn"
            type="button"
            onClick={() =>
              onAddMedicine?.()
            }
          >
            <Plus
              size={18}
            />

            Add More Medicine
          </button>
        </div>
      </div>

      {/* ===============================================
          LOADING
      =============================================== */}

      {loading ? (
        <div className="rem-card">
          <div className="rem-empty">
            <p>
              Loading reminders...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ===========================================
              UPCOMING TODAY
          =========================================== */}

          {displayPending.length ===
          0 ? (
            <div className="rem-card">
              <div className="rem-empty">
                <div className="rem-illustration">
                  <svg
                    width="300"
                    height="260"
                    viewBox="0 0 300 260"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Reminder illustration"
                  >
                    <rect
                      x="80"
                      y="20"
                      width="140"
                      height="200"
                      rx="16"
                      fill="#DFF6F4"
                      stroke="#0F766E"
                      strokeWidth="3"
                    />

                    <rect
                      x="110"
                      y="8"
                      width="80"
                      height="24"
                      rx="8"
                      fill="#0F766E"
                    />

                    <rect
                      x="120"
                      y="16"
                      width="60"
                      height="8"
                      rx="4"
                      fill="#DFF6F4"
                    />

                    <rect
                      x="130"
                      y="60"
                      width="40"
                      height="55"
                      rx="6"
                      fill="#0F766E"
                      opacity=".85"
                    />

                    <rect
                      x="135"
                      y="52"
                      width="30"
                      height="14"
                      rx="4"
                      fill="#115E59"
                    />

                    <circle
                      cx="150"
                      cy="80"
                      r="5"
                      fill="#DFF6F4"
                    />

                    <circle
                      cx="150"
                      cy="95"
                      r="5"
                      fill="#DFF6F4"
                    />

                    <ellipse
                      cx="185"
                      cy="120"
                      rx="18"
                      ry="10"
                      fill="#0F766E"
                      transform="rotate(-30 185 120)"
                    />

                    <ellipse
                      cx="115"
                      cy="130"
                      rx="14"
                      ry="8"
                      fill="#DFF6F4"
                      stroke="#0F766E"
                      strokeWidth="1.5"
                    />

                    <rect
                      x="100"
                      y="150"
                      width="100"
                      height="55"
                      rx="8"
                      fill="#fff"
                      stroke="#0F766E"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />

                    <line
                      x1="115"
                      y1="165"
                      x2="170"
                      y2="165"
                      stroke="#0F766E"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    <line
                      x1="115"
                      y1="178"
                      x2="155"
                      y2="178"
                      stroke="#0F766E"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity=".6"
                    />

                    <line
                      x1="115"
                      y1="191"
                      x2="140"
                      y2="191"
                      stroke="#0F766E"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity=".4"
                    />

                    <circle
                      cx="220"
                      cy="170"
                      r="20"
                      fill="#DFF6F4"
                    />

                    <path
                      d="M212 170 L218 177 L228 164"
                      stroke="#0F766E"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <h2 className="rem-empty-heading">
                  No Reminders Scheduled Yet
                </h2>

                <p className="rem-empty-desc">
                  You haven't added any medicines or set any reminder times.
                  <br />
                  Add your medicines and schedule times to stay on track and never miss a dose.
                </p>

                <button
                  className="rem-add-btn"
                  type="button"
                  onClick={() =>
                    onAddMedicine?.()
                  }
                >
                  <Plus
                    size={24}
                  />

                  Add Medicine
                </button>

                <div className="rem-banner">
                  <div className="rem-banner-icon">
                    <Lightbulb
                      size={24}
                    />
                  </div>

                  <div className="rem-banner-text">
                    <h3>
                      Stay on track, every day!
                    </h3>

                    <p>
                      Set your reminders and we'll help you never miss a dose.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rem-content">
              <div className="rem-section-header">
                <span className="rem-section-title">
                  UPCOMING TODAY
                </span>
              </div>

              <div className="rem-cards-grid">
                {displayPending.map(
                  (
                    med,
                    index
                  ) => {
                    const reminderId =
                      getReminderId(
                        med
                      );

                    return (
                      <div
                        key={
                          reminderId ??
                          `pending-${index}`
                        }
                        className="rem-card-item"
                      >
                        <div className="rem-card-top-row">
                          <div className="rem-time-badge">
                            <Clock
                              size={
                                16
                              }
                            />

                            <span>
                              {convertTo12Hour(
                                getReminderTime(
                                  med
                                )
                              ) ||
                                "—"}
                            </span>
                          </div>

                          <span className="rem-next-dose-label">
                            NEXT DOSE
                          </span>
                        </div>

                        <div className="rem-card-middle">
                          <div className="rem-pill-icon-wrap">
                            <Pill
                              size={
                                28
                              }
                            />
                          </div>

                          <div className="rem-card-info">
                            <div className="rem-card-name">
                              {med.medicineName ||
                                "Medicine"}
                            </div>

                            <div className="rem-card-dose">
                              {med.dosage ||
                                "—"}
                            </div>
                          </div>
                        </div>

                        <div className="rem-card-date-row">
                          <Calendar
                            size={16}
                          />

                          <span>
                            {formatDate(
                              med.scheduledDate
                            ) ||
                              dateStr}
                          </span>
                        </div>

                        <div className="rem-card-actions-bar">
                          <button
                            className="rem-snooze-btn"
                            type="button"
                            onClick={() =>
                              handleSnooze(
                                med
                              )
                            }
                          >
                            <Clock
                              size={
                                16
                              }
                            />

                            Snooze
                          </button>

                          <button
                            className="rem-taken-btn"
                            type="button"
                            onClick={() =>
                              handleMarkTaken(
                                med
                              )
                            }
                          >
                            ✓ Taken
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* ===========================================
              REMINDER HISTORY
          =========================================== */}

          <div className="rem-history-card">
            <div className="rem-history-header">
              <h3>
                Reminder History
              </h3>
            </div>

            <div className="rem-history-list">
              <div className="rem-hl-header">
                <div className="rem-hl-col rem-hl-col-name">
                  Medicine Name
                </div>

                <div className="rem-hl-col rem-hl-col-dose">
                  Dosage
                </div>

                <div className="rem-hl-col rem-hl-col-date">
                  Date
                </div>

                <div className="rem-hl-col rem-hl-col-time">
                  Time
                </div>

                <div className="rem-hl-col rem-hl-col-status">
                  Status
                </div>

                <div className="rem-hl-col rem-hl-col-action">
                  Action
                </div>
              </div>

              {paginatedHistory.map(
                (
                  med,
                  index
                ) => {
                  const reminderId =
                    getReminderId(
                      med
                    );

                  const status = String(
                    med.status ?? ""
                  ).trim().toLowerCase();

                  return (
                    <div
                      key={
                        reminderId ??
                        `history-${historyStartIndex + index}`
                      }
                      className="rem-hl-row"
                    >
                      <div className="rem-hl-col rem-hl-col-name">
                        <span className="rem-mobile-main-icon" aria-hidden="true"><Pill size={20} /></span>

                        <span className="rem-hl-label">
                          Medicine Name
                        </span>

                        <span className="rem-hl-value rem-hl-value-name">
                          {med.medicineName ||
                            "—"}
                        </span>
                        <span className="rem-mobile-top-dose">
                          {med.dosage ||
                            "—"}
                        </span>
                        <span
                          className={`rem-mobile-top-status rem-status-badge ${
                            status ===
                            "snoozed"
                              ? "rem-status-snoozed"
                              : status ===
                                  "taken"
                                ? "rem-status-taken"
                                : status ===
                                    "missed"
                                  ? "rem-status-missed"
                                  : "rem-status-upcoming"
                          }`}
                        >
                          {status
                            ? status
                                .charAt(
                                  0
                                )
                                .toUpperCase() +
                              status.slice(
                                1
                              )
                            : "Unknown"}
                        </span>
                      </div>

                      <div className="rem-hl-col rem-hl-col-dose">
                        <span className="rem-mobile-field-icon" aria-hidden="true"><Pill size={17} /></span>

                        <span className="rem-hl-label">
                          Dose
                        </span>

                        <span className="rem-hl-value">
                          {med.dosage ||
                            "—"}
                        </span>
                      </div>

                      <div className="rem-hl-col rem-hl-col-date">
                        <span className="rem-mobile-field-icon" aria-hidden="true"><Calendar size={17} /></span>

                        <span className="rem-hl-label">
                          Date
                        </span>

                        <span className="rem-hl-value">
                          {formatDate(
                            med.scheduledDate ||
                              med.date
                          ) ||
                            "—"}
                        </span>
                      </div>

                      <div className="rem-hl-col rem-hl-col-time">
                        <span className="rem-mobile-field-icon" aria-hidden="true"><Clock size={17} /></span>

                        <span className="rem-hl-label">
                          Time
                        </span>

                        <span className="rem-hl-value">
                          {convertTo12Hour(
                            getReminderTime(
                              med
                            )
                          ) ||
                            "—"}
                        </span>
                      </div>

                      <div className="rem-hl-col rem-hl-col-status">
                        <span className="rem-mobile-field-icon" aria-hidden="true"><Info size={17} /></span>

                        <span className="rem-hl-label">
                          Status
                        </span>

                        <span
                          className={`rem-status-badge ${
                            status ===
                            "snoozed"
                              ? "rem-status-snoozed"
                              : status ===
                                  "taken"
                                ? "rem-status-taken"
                                : status ===
                                    "missed"
                                  ? "rem-status-missed"
                                  : "rem-status-upcoming"
                          }`}
                        >
                          {status
                            ? status
                                .charAt(
                                  0
                                )
                                .toUpperCase() +
                              status.slice(
                                1
                              )
                            : "Unknown"}
                        </span>
                      </div>

                      <div className="rem-hl-col rem-hl-col-action">
                        <button
                          className="rem-delete-btn"
                          type="button"
                          aria-label="Delete reminder"
                          onClick={() =>
                            handleDeleteReminder(
                              med
                            )
                          }
                        >
                          <Trash2
                            size={
                              18
                            }
                          />
                        </button>
                      </div>
                    </div>
                  );
                }
              )}

            </div>
            {displayHistory.length > historyItemsPerPage && (
              <div className="rem-history-pagination">
                <span className="rem-history-page-info">
                  Showing {historyPageStart}-{historyPageEnd} of {displayHistory.length}
                </span>

                <div className="rem-history-page-controls">
                  <button
                    className="rem-history-page-btn"
                    type="button"
                    aria-label="Previous history page"
                    onClick={() =>
                      setHistoryPage((currentPage) =>
                        Math.max(1, currentPage - 1)
                      )
                    }
                    disabled={currentHistoryPage === 1}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className="rem-history-page-current">
                    Page {currentHistoryPage} of {historyTotalPages}
                  </span>

                  <button
                    className="rem-history-page-btn"
                    type="button"
                    aria-label="Next history page"
                    onClick={() =>
                      setHistoryPage(
                        Math.min(historyTotalPages, currentHistoryPage + 1)
                      )
                    }
                    disabled={currentHistoryPage === historyTotalPages}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
            {displayHistory.length ===
              0 && (
              <div className="rem-history-empty">
                <div className="rem-history-empty-illustration">
                  <svg
                    width="150"
                    height="150"
                    viewBox="0 0 150 150"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="All caught up illustration"
                  >
                    <circle
                      cx="75"
                      cy="75"
                      r="60"
                      fill="#E6FAF8"
                    />

                    <rect
                      x="45"
                      y="30"
                      width="60"
                      height="80"
                      rx="8"
                      fill="white"
                      stroke="#0F766E"
                      strokeWidth="2.5"
                    />

                    <rect
                      x="55"
                      y="38"
                      width="40"
                      height="6"
                      rx="3"
                      fill="#0F766E"
                      opacity=".3"
                    />

                    <rect
                      x="55"
                      y="50"
                      width="30"
                      height="4"
                      rx="2"
                      fill="#0F766E"
                      opacity=".5"
                    />

                    <rect
                      x="55"
                      y="60"
                      width="35"
                      height="4"
                      rx="2"
                      fill="#0F766E"
                      opacity=".5"
                    />

                    <rect
                      x="55"
                      y="70"
                      width="25"
                      height="4"
                      rx="2"
                      fill="#0F766E"
                      opacity=".5"
                    />

                    <rect
                      x="55"
                      y="80"
                      width="32"
                      height="4"
                      rx="2"
                      fill="#0F766E"
                      opacity=".5"
                    />

                    <path
                      d="M52 42 L56 46 L62 38"
                      stroke="#0F766E"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <circle
                      cx="95"
                      cy="45"
                      r="15"
                      fill="#0F766E"
                      opacity=".15"
                    />

                    <rect
                      x="90"
                      y="30"
                      width="10"
                      height="12"
                      rx="5"
                      fill="#0F766E"
                    />

                    <circle
                      cx="95"
                      cy="30"
                      r="4"
                      fill="#0F766E"
                    />
                  </svg>
                </div>

                <h3 className="rem-history-empty-heading">
                  That's it for now!
                </h3>

                <p className="rem-history-empty-desc">
                  Keep taking your medicines on time and stay healthy.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserRem;
