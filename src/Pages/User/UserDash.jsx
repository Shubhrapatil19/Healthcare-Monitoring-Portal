import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";



import api from "../../api/axiosInstance";

import "./UserDash.css";

// =========================================================
// COMPONENTS
// =========================================================

import CompleteProfileModal from "../../Component/ComProfile";
import AddMedicineModal from "../../Component/UserAddMed";
import AddStockModal from "../../Component/AddStock";

import UserInvent from "./UserInvent";
import UserReport from "./UserReport";
import UserRem from "./UserRem";
import UserAlert from "./UserAlert";
import UserLogout from "./UserLogout";
import UserManage from "./UserManage";
import UserProfiles from "./UserProfiles";
import UserViewRep from "./UserViewRep";
import UserNotifi from "./UserNotifi";

// =========================================================
// ICONS
// =========================================================

import {
  Home,
  User,
  ClipboardPlus,
  Bell,
  TriangleAlert,
  BarChart3,
  LogOut,
  CalendarDays,
  Package,
  ShieldCheck,
  CircleCheck,
  CircleX,
  ArrowDownCircle,
  Plus,
  Menu,
  Clock,
  FileText,
  ChevronDown,
} from "lucide-react";

const getUserInitials = (name) => {
  const nameParts = String(name || "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (nameParts.length === 0 || name === "User") {
    return "U";
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
};
const UserDash = ({ onLogout }) => {
  // =========================================================
  // RESPONSIVE
  // =========================================================

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < 900;
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;

    if (window.innerWidth < 900) return false;

    return localStorage.getItem("sidebarOpen") === "true";
  });

  // =========================================================
  // PROFILE
  // =========================================================

  const [profileCompleted, setProfileCompleted] = useState(
    localStorage.getItem("profileCompleted") === "true"
  );

  const [showProfile, setShowProfile] = useState(false);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const [activeItem, setActiveItem] = useState("Home");

  const [showViewReport, setShowViewReport] = useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  // =========================================================
  // MODALS
  // =========================================================

  const [showAddMedicineModal, setShowAddMedicineModal] =
    useState(false);

  const [showAddStockModal, setShowAddStockModal] =
    useState(false);

  // =========================================================
  // REF
  // =========================================================

  const myMedicineRef = useRef(null);

  // =========================================================
  // DATE
  // =========================================================

  const today = useMemo(() => new Date(), []);

  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // =========================================================
  // DASHBOARD SUMMARY
  //
  // GET /api/dashboard
  // =========================================================

  const [dashboardSummary, setDashboardSummary] = useState({
    todaysMedicines: 0,
    taken: 0,
    missed: 0,
    lowStockAlerts: 0,
  });

  const [summaryLoading, setSummaryLoading] = useState(true);

  const getFirstNumber = (source, keys) => {
    for (const key of keys) {
      const value = Number(source?.[key]);

      if (Number.isFinite(value)) {
        return value;
      }
    }

    return 0;
  };

  const normalizeDashboardSummary = (payload = {}) => {
    const data = payload?.data || payload?.dashboard || payload?.summary || payload;

    return {
      todaysMedicines: getFirstNumber(data, [
        "todaysMedicines",
        "todayMedicines",
        "todayMedicineCount",
        "todaysMedicineCount",
        "scheduled",
        "scheduledCount",
      ]),

      taken: getFirstNumber(data, [
        "taken",
        "takenCount",
        "takenDoses",
        "takenDoseCount",
      ]),

      missed: getFirstNumber(data, [
        "missed",
        "missedCount",
        "missedDoses",
        "missedDoseCount",
      ]),

      lowStockAlerts: getFirstNumber(data, [
        "lowStockAlerts",
        "lowStockAlertCount",
        "lowStockCount",
      ]),
    };
  };

  const [notificationCount, setNotificationCount] = useState(0);

  const notificationCountRef = useRef(0);
  const notificationSoundReadyRef = useRef(false);
  const notificationSoundUnlockedRef = useRef(false);
  const notificationSoundPendingRef = useRef(false);
  const notificationAudioContextRef = useRef(null);
  const lastNotificationSoundRef = useRef({ count: 0, playedAt: 0 });
  const latestNotificationKeyRef = useRef("");

  const getNotificationAudioContext = useCallback((allowCreate = false) => {
    if (typeof window === "undefined") return null;

    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return null;

    if (!notificationAudioContextRef.current && allowCreate) {
      notificationAudioContextRef.current = new AudioContext();
    }

    return notificationAudioContextRef.current;
  }, []);

  const emitNotificationTone = useCallback((audioContext) => {
    const firstTone = audioContext.createOscillator();
    const secondTone = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    firstTone.type = "sine";
    firstTone.frequency.setValueAtTime(880, now);
    firstTone.frequency.setValueAtTime(1046, now + 0.16);

    secondTone.type = "triangle";
    secondTone.frequency.setValueAtTime(1320, now + 0.2);

    firstTone.connect(gain);
    secondTone.connect(gain);
    gain.connect(audioContext.destination);

    firstTone.start(now);
    firstTone.stop(now + 0.32);
    secondTone.start(now + 0.2);
    secondTone.stop(now + 0.6);
  }, []);

  const playNotificationSound = useCallback(async () => {
    try {
      if (!notificationSoundUnlockedRef.current) {
        notificationSoundPendingRef.current = true;
        return;
      }

      const audioContext = getNotificationAudioContext();

      if (!audioContext) {
        notificationSoundPendingRef.current = true;
        return;
      }

      if (audioContext.state !== "running") {
        notificationSoundPendingRef.current = true;
        return;
      }

      notificationSoundUnlockedRef.current = true;
      notificationSoundPendingRef.current = false;
      emitNotificationTone(audioContext);
    } catch (error) {
      notificationSoundPendingRef.current = true;
      console.error("Notification Sound Error:", error.message);
    }
  }, [emitNotificationTone, getNotificationAudioContext]);

  const unlockNotificationSound = useCallback(async (event) => {
    try {
      if (event?.isTrusted === false) return;

      const audioContext = getNotificationAudioContext(true);

      if (!audioContext) return;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      notificationSoundUnlockedRef.current = audioContext.state === "running";

      if (
        notificationSoundUnlockedRef.current &&
        notificationSoundPendingRef.current
      ) {
        void playNotificationSound();
      }
    } catch (error) {
      console.error("Notification Sound Unlock Error:", error.message);
    }
  }, [getNotificationAudioContext, playNotificationSound]);

  useEffect(() => {
    const unlock = (event) => {
      void unlockNotificationSound(event);
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("click", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [unlockNotificationSound]);

  useEffect(() => {
    return () => {
      notificationAudioContextRef.current?.close?.().catch(() => {});
      notificationAudioContextRef.current = null;
    };
  }, []);
  // =========================================================
  // TODAY SCHEDULE
  // =========================================================

  const [todaySchedule, setTodaySchedule] = useState([]);

  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [schedulePage, setSchedulePage] = useState(() => {
    const savedPage = Number(
      localStorage.getItem("todaySchedulePage")
    );

    return savedPage > 0 ? savedPage : 1;
  });

  const changeSchedulePage = (nextPageOrUpdater) => {
    setSchedulePage((currentPage) => {
      const nextPage =
        typeof nextPageOrUpdater === "function"
          ? nextPageOrUpdater(currentPage)
          : nextPageOrUpdater;

      const safePage = Math.max(1, Number(nextPage) || 1);

      localStorage.setItem(
        "todaySchedulePage",
        String(safePage)
      );

      return safePage;
    });
  };

  const scheduleItemsPerPage = 1;

  // =========================================================
  // INVENTORY
  // =========================================================

  const [inventoryData, setInventoryData] = useState([]);

  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [inventoryPage, setInventoryPage] = useState(1);

  const inventoryItemsPerPage = 3;

  // =========================================================
  // CALENDAR
  // =========================================================

  const [calendarMonth, setCalendarMonth] =
    useState(todayMonth);

  const [calendarYear, setCalendarYear] =
    useState(todayYear);

  const [calendarData, setCalendarData] =
    useState([]);

  const [calendarLoading, setCalendarLoading] =
    useState(true);

  const [visibleStatuses, setVisibleStatuses] = useState({
    taken: true,
    missed: true,
  });

  // =========================================================
  // CURRENT USER NAME
  // =========================================================

  const currentUserName = useMemo(() => {
    try {
      const stored = localStorage.getItem("currentUserName");

      if (stored?.trim()) {
        return stored.trim();
      }

      const registeredUser = localStorage.getItem("registeredUser");

      if (registeredUser) {
        const parsed = JSON.parse(registeredUser);

        if (parsed?.fullName?.trim()) {
          return parsed.fullName.trim();
        }
      }
    } catch {
      // ignore
    }

    return "User";
  }, []);

  const userInitials = getUserInitials(currentUserName);

  // =========================================================
  // ARRAY RESPONSE HELPER
  // =========================================================

  const extractArray = (payload, keys = []) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    for (const key of keys) {
      if (Array.isArray(payload?.[key])) {
        return payload[key];
      }
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    return [];
  };

  const getNotificationKey = (notification = {}) => {
    const id = notification.notificationId ?? notification.id ?? "";
    const createdAt =
      notification.createdAt || notification.time || notification.date || "";
    const title = notification.title || "";
    const message = notification.message || "";

    return [id, createdAt, title, message].map(String).join("|");
  };

  const getLatestNotificationKey = (notifications = []) => {
    if (!notifications.length) return "";

    const latestNotification = notifications.reduce((latest, notification) => {
      const currentTime = new Date(
        notification.createdAt || notification.time || notification.date || 0
      ).getTime();
      const latestTime = new Date(
        latest.createdAt || latest.time || latest.date || 0
      ).getTime();

      if (!Number.isFinite(currentTime) || !Number.isFinite(latestTime)) {
        return latest;
      }

      return currentTime > latestTime ? notification : latest;
    }, notifications[0]);

    return getNotificationKey(latestNotification);
  };

  // =========================================================
  // DASHBOARD SUMMARY
  //
  // GET /api/dashboard
  //
  // RESPONSE:
  // {
  //   todaysMedicines: 0,
  //   taken: 0,
  //   missed: 0,
  //   lowStockAlerts: 0
  // }
  // =========================================================

  const fetchDashboardSummary = async () => {
    try {
      const response = await api.get("/api/dashboard");

      const nextSummary = normalizeDashboardSummary(response?.data || {});

      setDashboardSummary(nextSummary);

      if (nextSummary.todaysMedicines === 0) {
        clearTodayScheduleCache();
      }
    } catch (error) {
      console.error(
        "Dashboard Summary Error:",
        error?.response?.data || error.message
      );

      setDashboardSummary({
        todaysMedicines: 0,
        taken: 0,
        missed: 0,
        lowStockAlerts: 0,
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await api.get("/api/notifications/unread-count");
      const data = response?.data || {};

      let count = Number(
        data.unreadCount ??
          data.count ??
          data.total ??
          data.additionalProp1 ??
          0
      );

      let latestNotificationKey = latestNotificationKeyRef.current;

      try {
        const listResponse = await api.get("/api/notifications");
        const notifications = extractArray(listResponse.data, [
          "notifications",
          "data",
          "items",
        ]);

        latestNotificationKey = getLatestNotificationKey(notifications);

        if (!Number.isFinite(count) || count === 0) {
          count = Number(
            listResponse.data?.unreadCount ??
              notifications.filter(
                (notification) =>
                  String(notification.status || "UNREAD").toUpperCase() ===
                  "UNREAD"
              ).length ??
              0
          );
        }
      } catch (error) {
        if (!Number.isFinite(count) || count === 0) {
          const unreadResponse = await api.get("/api/notifications", {
            params: { status: "UNREAD" },
          });

          const unreadNotifications = extractArray(unreadResponse.data, [
            "notifications",
            "data",
            "items",
          ]);

          count = Number(
            unreadResponse.data?.unreadCount ??
              unreadResponse.data?.totalCount ??
              unreadNotifications.length ??
              0
          );
        }
      }

      const safeCount = Number.isFinite(count) ? count : 0;
      const previousCount = notificationCountRef.current;
      const previousNotificationKey = latestNotificationKeyRef.current;
      const hasNewNotification =
        Boolean(latestNotificationKey) &&
        Boolean(previousNotificationKey) &&
        latestNotificationKey !== previousNotificationKey;

      setNotificationCount(safeCount);

      if (!notificationSoundReadyRef.current) {
        notificationSoundReadyRef.current = true;
      } else if (safeCount > previousCount || hasNewNotification) {
        const now = Date.now();
        const lastSound = lastNotificationSoundRef.current;
        const soundKey = latestNotificationKey || String(safeCount);
        const isDuplicateSound =
          lastSound.count === soundKey && now - lastSound.playedAt < 1500;

        if (!isDuplicateSound) {
          void playNotificationSound();
          lastNotificationSoundRef.current = {
            count: soundKey,
            playedAt: now,
          };
        }
      }

      notificationCountRef.current = safeCount;
      latestNotificationKeyRef.current = latestNotificationKey;
    } catch (error) {
      console.error(
        "Notification Count Error:",
        error?.response?.data || error.message
      );
    }
  };


  // =========================================================
  // TODAY'S DOSES
  //
  // GET /api/doses/today
  //
  // NOTE:
  // Backend /api/doses/today browser refresh par kabhi-kabhi
  // empty return kar deta hai (doses sirf medicine create karte
  // waqt generate hoti hain). Isliye hum today's schedule ko
  // localStorage me cache karte hain. Refresh par agar API empty
  // aaye to cached schedule dikhate hain taaki cards gayab na hon.
  // =========================================================

  const TODAY_SCHEDULE_CACHE_KEY =
    "todayScheduleCache";

  const readTodayScheduleCache = () => {
    try {
      const raw =
        localStorage.getItem(
          TODAY_SCHEDULE_CACHE_KEY
        );

      if (!raw) return [];

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  };

  const writeTodayScheduleCache = (
    doses
  ) => {
    try {
      localStorage.setItem(
        TODAY_SCHEDULE_CACHE_KEY,
        JSON.stringify(doses)
      );
    } catch {
      // ignore storage errors
    }
  };

  const COMPLETED_TODAY_DOSE_KEYS = "completedTodayDoseKeys";

  const normalizeScheduleValue = (value) =>
    String(value ?? "").trim().toLowerCase();

  const normalizeScheduleTime = (value) =>
    normalizeScheduleValue(value).replace(/^(0)(\d:)/, "$2");

  const MISSED_DOSE_HIDE_DELAY_MS = 30 * 60 * 1000;

  const parseScheduleDateTime = (dose) => {
    const dateValue =
      dose?.scheduledDate || dose?.date || dose?.reminderDate;
    const timeValue =
      dose?.scheduledTime || dose?.time || dose?.reminderTime;

    if (!dateValue || !timeValue) return null;

    const dateParts = String(dateValue).match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    );

    const timeMatch = String(timeValue)
      .trim()
      .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

    if (!dateParts || !timeMatch) return null;

    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2] || 0);
    const period = timeMatch[3].toUpperCase();

    if (period === "PM" && hours < 12) {
      hours += 12;
    }

    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return new Date(
      Number(dateParts[3]),
      Number(dateParts[2]) - 1,
      Number(dateParts[1]),
      hours,
      minutes
    );
  };

  const isDosePastMissedWindow = (dose) => {
    const scheduledAt = parseScheduleDateTime(dose);

    if (!scheduledAt) return false;

    return Date.now() >= scheduledAt.getTime() + MISSED_DOSE_HIDE_DELAY_MS;
  };

  const filterMissedWindowDoses = (doses) =>
    doses.filter((dose) => !isDosePastMissedWindow(dose));

  const getScheduleDateKey = (value) => {
    if (!value) return "";

    const raw = String(value).trim();

    const dmyMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

    if (dmyMatch) {
      return `${dmyMatch[3]}-${String(dmyMatch[2]).padStart(2, "0")}-${String(dmyMatch[1]).padStart(2, "0")}`;
    }

    const ymdMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

    if (ymdMatch) {
      return `${ymdMatch[1]}-${String(ymdMatch[2]).padStart(2, "0")}-${String(ymdMatch[3]).padStart(2, "0")}`;
    }

    const parsedDate = new Date(raw);

    if (!Number.isNaN(parsedDate.getTime())) {
      return (
        `${parsedDate.getFullYear()}-` +
        `${String(parsedDate.getMonth() + 1).padStart(2, "0")}-` +
        `${String(parsedDate.getDate()).padStart(2, "0")}`
      );
    }

    return normalizeScheduleValue(raw);
  };

  const getDoseDateKey = (dose) =>
    getScheduleDateKey(
      dose?.scheduledDate || dose?.date || dose?.reminderDate
    );

  const getTodayDateKey = () => {
    const now = new Date();

    return (
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, "0")}-` +
      `${String(now.getDate()).padStart(2, "0")}`
    );
  };

  const isDoseScheduledToday = (dose) => {
    const doseDate = getDoseDateKey(dose);

    return !doseDate || doseDate === getTodayDateKey();
  };

  const getTodayDoseKeys = (dose) => {
    if (!dose) return [];

    const date = getDoseDateKey(dose) || getTodayDateKey();

    const idKeys = [
      dose.doseLogId,
      dose.reminderId,
      dose.doseId,
      dose.id,
    ]
      .filter((value) => value !== undefined && value !== null && value !== "")
      .map((value) => `id:${date}|${value}`);

    const name = normalizeScheduleValue(dose.medicineName);
    const time = normalizeScheduleTime(
      dose.scheduledTime || dose.time || dose.reminderTime
    );
    const detailsKeys =
      name && time && date
        ? [`details:${name}|${date}|${time}`]
        : [];

    return [...idKeys, ...detailsKeys].filter(Boolean);
  };

  const readCompletedTodayDoseKeys = () => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(COMPLETED_TODAY_DOSE_KEYS) || "[]"
      );

      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  };

  const addCompletedTodayDoseKey = (dose) => {
    const doseKeys = getTodayDoseKeys(dose);

    if (doseKeys.length === 0) return;

    const keys = readCompletedTodayDoseKeys();
    doseKeys.forEach((key) => keys.add(key));

    localStorage.setItem(
      COMPLETED_TODAY_DOSE_KEYS,
      JSON.stringify(Array.from(keys))
    );
  };

  const filterCompletedTodayDoses = (doses, completedDoses = []) => {
    const completedKeys = readCompletedTodayDoseKeys();

    completedDoses.forEach((dose) => {
      getTodayDoseKeys(dose).forEach((key) => completedKeys.add(key));
    });

    return doses.filter((dose) =>
      getTodayDoseKeys(dose).every((key) => !completedKeys.has(key))
    );
  };

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

  const getMedicineIdentity = (medicine) => ({
    id: normalizeScheduleValue(
      medicine?.id ??
        medicine?._id ??
        medicine?.medicineId ??
        medicine?.medicine_id
    ),
    name: normalizeScheduleValue(
      medicine?.medicineName ?? medicine?.medicine_name ?? medicine?.name
    ),
  });

  const filterDosesForActiveMedicines = (doses, activeMedicines) => {
    if (!Array.isArray(activeMedicines)) return doses;

    const activeIds = new Set();
    const activeNames = new Set();

    activeMedicines.forEach((medicine) => {
      const { id, name } = getMedicineIdentity(medicine);

      if (id) activeIds.add(id);
      if (name) activeNames.add(name);
    });

    if (activeIds.size === 0 && activeNames.size === 0) return [];

    return doses.filter((dose) => {
      const doseMedicineId = normalizeScheduleValue(getScheduleMedicineId(dose));
      const doseMedicineName = normalizeScheduleValue(getScheduleMedicineName(dose));

      if (doseMedicineId) return activeIds.has(doseMedicineId);
      if (doseMedicineName) return activeNames.has(doseMedicineName);

      return true;
    });
  };

  const clearTodayScheduleCache = () => {
    try {
      localStorage.removeItem(TODAY_SCHEDULE_CACHE_KEY);
      localStorage.removeItem("todaySchedulePage");
      localStorage.removeItem(COMPLETED_TODAY_DOSE_KEYS);
    } catch {
      // ignore storage errors
    }

    setTodaySchedule([]);
    setSchedulePage(1);
  };

  const removeDoseFromTodaySchedule = (reminder) => {
    if (!reminder) return;

    addCompletedTodayDoseKey(reminder);

    const reminderKeys = getTodayDoseKeys(reminder);

    setTodaySchedule((current) => {
      const next = current.filter((dose) => {
        const doseKeys = getTodayDoseKeys(dose);
        const keyMatched = doseKeys.some((key) => reminderKeys.includes(key));

        return !keyMatched;
      });

      writeTodayScheduleCache(next);

      if (next.length === 0) {
        localStorage.removeItem("todaySchedulePage");
        setSchedulePage(1);
      }

      return next;
    });
  };

  const fetchTodaySchedule = async () => {
    try {
      const [todayResponse, historyResponse, medicinesResponse] = await Promise.all([
        api.get("/api/doses/today"),
        api.get("/api/reminders/history").catch(() => ({ data: [] })),
        api.get("/api/medicines").catch(() => null),
      ]);

      const doses = extractArray(
        todayResponse.data,
        ["doses", "todayDoses"]
      );

      const historyDoses = extractArray(
        historyResponse.data,
        ["reminders", "history", "data"]
      );

      const activeMedicines = medicinesResponse
        ? extractArray(medicinesResponse.data, ["medicines"])
        : null;

      const IS_COMPLETED_STATUS = new Set(["TAKEN", "MISSED"]);

      const completedHistoryDoses = historyDoses.filter(
        (dose) =>
          isDoseScheduledToday(dose) &&
          IS_COMPLETED_STATUS.has(String(dose?.status || "").toUpperCase())
      );

      const mergeScheduleDoses = (primary, fallback) => {
        const merged = [];
        const seen = new Set();

        [...primary, ...fallback].forEach((dose) => {
          const key = getTodayDoseKeys(dose)[0] || JSON.stringify(dose);

          if (!seen.has(key)) {
            seen.add(key);
            merged.push(dose);
          }
        });

        return merged;
      };

      const rawPendingDoses = doses.filter(
        (dose) =>
          !IS_COMPLETED_STATUS.has(
            String(dose?.status || "").toUpperCase()
          )
      );

      const pendingDoses = filterCompletedTodayDoses(
        filterMissedWindowDoses(
          filterDosesForActiveMedicines(
            mergeScheduleDoses(rawPendingDoses, readTodayScheduleCache()),
            activeMedicines
          )
        ),
        completedHistoryDoses
      );

      if (pendingDoses.length > 0) {
        writeTodayScheduleCache(pendingDoses);
        setTodaySchedule(pendingDoses);
      } else {
        setTodaySchedule((current) =>
          current.length > 0
            ? filterCompletedTodayDoses(
                filterMissedWindowDoses(
                  filterDosesForActiveMedicines(current, activeMedicines)
                )
              )
            : filterCompletedTodayDoses(
                filterMissedWindowDoses(
                  filterDosesForActiveMedicines(
                    readTodayScheduleCache(),
                    activeMedicines
                  )
                )
              )
        );
      }
    } catch (error) {
      console.error(
        "Today Schedule Error:",
        error?.response?.data || error.message
      );

      const cached = filterCompletedTodayDoses(
        filterMissedWindowDoses(readTodayScheduleCache())
      );

      setTodaySchedule(cached);
    } finally {
      setScheduleLoading(false);
    }
  };

  // =========================================================
  // INVENTORY
  //
  // GET /api/inventory
  // =========================================================

  const fetchInventory = async () => {
    try {
      const response = await api.get("/api/inventory");

      const inventory = extractArray(
        response.data,
        [
          "inventory",
          "stockItems",
          "items",
        ]
      );

      setInventoryData(inventory);
    } catch (error) {
      console.error(
        "Inventory Error:",
        error?.response?.data || error.message
      );

      setInventoryData([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  // =========================================================
  // CALENDAR
  //
  // GET /api/doses/calendar
  // =========================================================

  const fetchCalendarData = async () => {
    try {
      const response = await api.get(
        "/api/doses/calendar"
      );

      const calendar = extractArray(
        response.data,
        [
          "doses",
          "calendar",
        ]
      );

      setCalendarData(calendar);
    } catch (error) {
      console.error(
        "Calendar Error:",
        error?.response?.data || error.message
      );

      setCalendarData([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  // =========================================================
  // INITIAL DASHBOARD LOAD
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [
          dashboardResponse,
          scheduleResponse,
          historyResponse,
          inventoryResponse,
          calendarResponse,
          medicinesResponse,
        ] = await Promise.all([
          api.get("/api/dashboard"),

          api.get("/api/doses/today"),

          api.get("/api/reminders/history").catch(() => ({ data: [] })),

          api.get("/api/inventory"),

          api.get("/api/doses/calendar"),

          api.get("/api/medicines").catch(() => null),
        ]);

        if (cancelled) return;

        // ===============================================
        // DASHBOARD CARDS
        // ===============================================

        const initialSummary = normalizeDashboardSummary(dashboardResponse?.data || {});

        setDashboardSummary(initialSummary);

        // ===============================================
        // TODAY SCHEDULE
        // ===============================================

        const schedules =
          Array.isArray(scheduleResponse.data)
            ? scheduleResponse.data
            : Array.isArray(scheduleResponse.data?.doses)
              ? scheduleResponse.data.doses
              : Array.isArray(
                    scheduleResponse.data?.todayDoses
                  )
                ? scheduleResponse.data.todayDoses
                : Array.isArray(
                      scheduleResponse.data?.data
                    )
                  ? scheduleResponse.data.data
                  : [];

        // Initial page load / browser refresh par bhi
        // Today's Schedule me sirf un doses ko dikhao jo abhi
        // TAKEN/MISSED nahi hui hain. Backend koi bhi status de sakta
        // hai (PENDING/UPCOMING/SCHEDULED/ACTIVE), isliye sirf
        // TAKEN/MISSED ko filter out karna sabse safe hai.
        const initialActiveMedicines = medicinesResponse
          ? extractArray(medicinesResponse.data, ["medicines"])
          : null;

        const completedHistorySchedules = extractArray(
          historyResponse.data,
          ["reminders", "history", "data"]
        ).filter(
          (dose) =>
            isDoseScheduledToday(dose) &&
            ["TAKEN", "MISSED"].includes(
              String(dose?.status || "").toUpperCase()
            )
        );

        const mergeInitialScheduleDoses = (primary, fallback) => {
          const merged = [];
          const seen = new Set();

          [...primary, ...fallback].forEach((dose) => {
            const key = getTodayDoseKeys(dose)[0] || JSON.stringify(dose);

            if (!seen.has(key)) {
              seen.add(key);
              merged.push(dose);
            }
          });

          return merged;
        };

        const rawPendingSchedules = schedules.filter(
          (dose) =>
            !["TAKEN", "MISSED"].includes(
              String(dose?.status || "").toUpperCase()
            )
        );

        const pendingSchedules = filterCompletedTodayDoses(
          filterMissedWindowDoses(
            filterDosesForActiveMedicines(
              mergeInitialScheduleDoses(rawPendingSchedules, readTodayScheduleCache()),
              initialActiveMedicines
            )
          ),
          completedHistorySchedules
        );

        // Agar dashboard count 0 hai to cache clear karo.
        // Warna API empty response par cached schedule fallback use karo.
        if (initialSummary.todaysMedicines === 0) {
          clearTodayScheduleCache();
        } else if (pendingSchedules.length > 0) {
          writeTodayScheduleCache(pendingSchedules);
          setTodaySchedule(pendingSchedules);
        } else {
          const cached = filterCompletedTodayDoses(
            filterMissedWindowDoses(
              filterDosesForActiveMedicines(
                readTodayScheduleCache(),
                initialActiveMedicines
              )
            ),
            completedHistorySchedules
          );
          setTodaySchedule(cached);
        }

        // ===============================================
        // INVENTORY
        // ===============================================

        const inventory =
          Array.isArray(inventoryResponse.data)
            ? inventoryResponse.data
            : Array.isArray(
                  inventoryResponse.data?.inventory
                )
              ? inventoryResponse.data.inventory
              : Array.isArray(
                    inventoryResponse.data?.stockItems
                  )
                ? inventoryResponse.data.stockItems
                : Array.isArray(
                      inventoryResponse.data?.data
                    )
                  ? inventoryResponse.data.data
                  : [];

        setInventoryData(inventory);

        // ===============================================
        // CALENDAR
        // ===============================================

        const calendar =
          Array.isArray(calendarResponse.data)
            ? calendarResponse.data
            : Array.isArray(calendarResponse.data?.doses)
              ? calendarResponse.data.doses
              : Array.isArray(
                    calendarResponse.data?.calendar
                  )
                ? calendarResponse.data.calendar
                : Array.isArray(
                      calendarResponse.data?.data
                    )
                  ? calendarResponse.data.data
                  : [];

        setCalendarData(calendar);


        await fetchNotificationCount();
      } catch (error) {
        console.error(
          "Dashboard Initial Load Error:",
          error?.response?.data || error.message
        );
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
          setScheduleLoading(false);
          setInventoryLoading(false);
          setCalendarLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
    // Dashboard initial load intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // AUTO-REFRESH (POLLING)
  //
  // Dashboard data ko har 5 second me auto-refresh karo
  // taaki naye doses / status changes bina manual refresh
  // ke dikh jaayein.
  // =========================================================

  const refreshHandlersRef = useRef({
    fetchTodaySchedule,
    fetchDashboardSummary,
    fetchInventory,
    fetchCalendarData,
    fetchNotificationCount,
  });

  useEffect(() => {
    refreshHandlersRef.current = {
      fetchTodaySchedule,
      fetchDashboardSummary,
      fetchInventory,
      fetchCalendarData,
      fetchNotificationCount,
    };
  });
  const AUTO_REFRESH_INTERVAL_MS = 5000;

  useEffect(() => {
    let cancelled = false;

    const refreshAll = async () => {
      if (cancelled) return;

      const handlers = refreshHandlersRef.current;

      try {
        await Promise.all([
          handlers.fetchTodaySchedule(),
          handlers.fetchDashboardSummary(),
          handlers.fetchInventory(),
          handlers.fetchCalendarData(),
          handlers.fetchNotificationCount(),
        ]);
      } catch {
        // individual fetch functions handle errors
      }
    };

    const intervalId = setInterval(
      refreshAll,
      AUTO_REFRESH_INTERVAL_MS
    );

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [AUTO_REFRESH_INTERVAL_MS]);

  // =========================================================
  // RESPONSIVE
  // =========================================================

  useEffect(() => {
    const handleResize = () => {
      const mobile =
        window.innerWidth < 900;

      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(
          localStorage.getItem("sidebarOpen") === "true"
        );
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  // =========================================================
  // PROFILE COMPLETE
  // =========================================================

  const handleProfileComplete = () => {
    localStorage.setItem(
      "profileCompleted",
      "true"
    );

    setProfileCompleted(true);
  };

  // =========================================================
  // SIDEBAR
  // =========================================================

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;

    setSidebarOpen(newState);

    localStorage.setItem(
      "sidebarOpen",
      String(newState)
    );
  };

  // =========================================================
  // MENU
  // =========================================================

  const handleMenuItemClick = (itemName) => {
    setActiveItem(itemName);

    setShowNotifications(false);

    if (isMobile) {
      setSidebarOpen(false);
    }

    if (itemName === "My Profile") {
      setShowProfile(true);

      setShowLogoutModal(false);
    } else if (itemName === "Logout") {
      setShowLogoutModal(true);

      setShowProfile(false);
    } else {
      setShowProfile(false);

      setShowLogoutModal(false);
    }

    if (
      itemName ===
      "Medicine Management"
    ) {
      setTimeout(() => {
        myMedicineRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  // =========================================================
  // ADD MEDICINE
  // =========================================================

  const handleAddMedicine = () => {
    setShowAddMedicineModal(true);
  };

  // =========================================================
  // AFTER MEDICINE ADDED
  // =========================================================

  const handleCloseMedicineModal = async (
    medicineData
  ) => {
    setShowAddMedicineModal(false);

    if (!medicineData) return;

    try {
      await Promise.all([
        fetchTodaySchedule(),

        fetchDashboardSummary(),

        fetchCalendarData(),
      ]);
    } catch {
      // individual fetch functions handle errors
    }

    // =====================================================
    // LOCAL NOTIFICATION
    // =====================================================

    const notification = {
      id: Date.now(),

      type: "success",

      title: "Medicine Added",

      message: `${
        medicineData.medicineName ||
        "Medicine"
      } ${
        medicineData.dosage || ""
      } has been successfully added to your medicine list.`,

      time: "Just now",

      date:
        new Date().toLocaleDateString(
          "en-GB"
        ),

      category: "system",

      status: "unread",
    };

    try {
      const existing =
        JSON.parse(
          localStorage.getItem(
            "userNotifications"
          ) || "[]"
        );

      existing.unshift(
        notification
      );

      localStorage.setItem(
        "userNotifications",
        JSON.stringify(existing)
      );
    } catch {
      // ignore
    }
  };

  // =========================================================
  // AFTER STOCK ADDED
  // =========================================================

  const handleAddStock = async (
    savedStockItem
  ) => {
    setShowAddStockModal(false);

    if (!savedStockItem) return;

    await Promise.all([
      fetchInventory(),

      fetchDashboardSummary(),
    ]);
  };

  // =========================================================
  // AFTER TAKEN / MISSED STATUS CHANGE
  // =========================================================

  const setCalendarDateStatus = (
    reminder,
    status
  ) => {
    const dateValue =
      reminder?.scheduledDate ||
      reminder?.date ||
      new Date();

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const dateKey =
      `${date.getFullYear()}-` +
      `${String(date.getMonth() + 1).padStart(2, "0")}-` +
      `${String(date.getDate()).padStart(2, "0")}`;

    setCalendarData((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const index = next.findIndex((item) => {
        const itemDateValue =
          item?.scheduledDate ||
          item?.date ||
          item?.reminderDate;
        const itemDate = new Date(itemDateValue);

        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }

        const itemKey =
          `${itemDate.getFullYear()}-` +
          `${String(itemDate.getMonth() + 1).padStart(2, "0")}-` +
          `${String(itemDate.getDate()).padStart(2, "0")}`;

        return itemKey === dateKey;
      });

      if (index >= 0) {
        next[index] = {
          ...next[index],
          status: status.toUpperCase(),
        };
      } else {
        next.push({
          date: dateKey,
          status: status.toUpperCase(),
        });
      }

      return next;
    });
  };

  const handleDoseActionComplete = async (
    status,
    reminder
  ) => {
    if (status && reminder) {
      setCalendarDateStatus(
        reminder,
        status
      );

      if (["taken", "missed"].includes(String(status).toLowerCase())) {
        removeDoseFromTodaySchedule(reminder);
      }
    }

    // Taken/Missed action complete hone ke baad:
    // 1) Today's Schedule refetch hoga
    // 2) Dashboard stat cards refetch honge
    // 3) Calendar refetch hoga
    //
    // Since fetchTodaySchedule() sirf PENDING doses rakhta hai,
    // TAKEN/MISSED dose automatically Today's Schedule se remove ho jayegi.
    await Promise.all([
      fetchTodaySchedule(),

      fetchDashboardSummary(),

      fetchCalendarData(),
    ]);
  };

  // =========================================================
  // TODAY SCHEDULE PAGINATION
  //
  // Same medicine ke saare timings ek hi timeline row me rahenge.
  // Pagination medicine rows par lagti hai, individual doses par nahi.
  // =========================================================

  const allScheduleMedicineRows =
    useMemo(() => {
      const grouped = new Map();

      todaySchedule.forEach((medicine) => {
        const name = medicine.medicineName || "Medicine";
        const key = name.trim().toLowerCase();

        if (!grouped.has(key)) {
          grouped.set(key, {
            name,
            medicines: [],
            notes: "",
          });
        }

        const row = grouped.get(key);
        row.medicines.push(medicine);

        const notes = String(
          medicine.notes ||
            medicine.note ||
            medicine.instructions ||
            ""
        ).trim();

        if (!row.notes && notes) {
          row.notes = notes;
        }
      });

      return Array.from(grouped.values());
    }, [todaySchedule]);

  const scheduleTotalItems =
    allScheduleMedicineRows.length;

  const scheduleTotalPages =
    Math.max(
      1,
      Math.ceil(
        scheduleTotalItems /
          scheduleItemsPerPage
      )
    );

  const schedulePageSafe =
    Math.min(
      schedulePage,
      scheduleTotalPages
    );

  const scheduleStartIndex =
    (schedulePageSafe - 1) *
    scheduleItemsPerPage;

  const schedulePageItems =
    allScheduleMedicineRows.slice(
      scheduleStartIndex,
      scheduleStartIndex +
        scheduleItemsPerPage
    );


  // =========================================================
  // INVENTORY OVERVIEW PAGINATION
  // =========================================================

  const inventoryTotalPages =
    Math.max(
      1,
      Math.ceil(
        inventoryData.length /
          inventoryItemsPerPage
      )
    );

  const inventoryPageSafe =
    Math.min(
      inventoryPage,
      inventoryTotalPages
    );

  const inventoryStartIndex =
    (inventoryPageSafe - 1) *
    inventoryItemsPerPage;

  const inventoryPageItems =
    inventoryData.slice(
      inventoryStartIndex,
      inventoryStartIndex +
        inventoryItemsPerPage
    );


  // =========================================================
  // TODAY LABEL
  // =========================================================

  const todayScheduleDate =
    today.toLocaleDateString(
      "en-US",
      {
        day: "2-digit",

        month: "short",

        year: "numeric",
      }
    );

  // =========================================================
  // DOSE TIME
  //
  // Real API = scheduledTime
  // =========================================================

  const getScheduleTimeLabel = (
    medicine
  ) =>
    medicine.scheduledTime ||
    medicine.timing ||
    medicine.time ||
    "00:00";

  // =========================================================
  // TIMELINE POSITION
  // =========================================================

  const getScheduleTimelinePosition = (
    medicine
  ) => {
    const rawTime = String(
      getScheduleTimeLabel(
        medicine
      )
    ).trim();

    const match =
      rawTime.match(
        /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i
      );

    if (!match) {
      return 50;
    }

    let hours =
      Number(match[1]);

    const minutes =
      Number(
        match[2] || 0
      );

    const period =
      match[3]?.toUpperCase();

    if (
      period === "PM" &&
      hours < 12
    ) {
      hours += 12;
    }

    if (
      period === "AM" &&
      hours === 12
    ) {
      hours = 0;
    }

    const totalMinutes =
      Math.min(
        Math.max(
          hours * 60 +
            minutes,
          0
        ),
        1440
      );

    return Math.min(
      Math.max(
        (totalMinutes /
          1440) *
          100,
        6
      ),
      82
    );
  };

  // =========================================================
  // CALENDAR
  // =========================================================

  const monthLabel =
    new Date(
      calendarYear,
      calendarMonth,
      1
    ).toLocaleString(
      "en-US",
      {
        month: "long",

        year: "numeric",
      }
    );

  const daysInMonth =
    new Date(
      calendarYear,
      calendarMonth + 1,
      0
    ).getDate();

  const firstDayOfMonth =
    new Date(
      calendarYear,
      calendarMonth,
      1
    ).getDay();

  const calendarDays = [
    ...Array(
      firstDayOfMonth
    ).fill(""),

    ...Array.from(
      {
        length:
          daysInMonth,
      },

      (_, index) =>
        String(index + 1)
    ),
  ];

  while (
    calendarDays.length %
      7 !==
    0
  ) {
    calendarDays.push("");
  }

  // =========================================================
  // CALENDAR STATUS MAP
  // =========================================================

  const calendarStatusMap =
    useMemo(() => {
      const map = {};

      calendarData.forEach(
        (item) => {
          const dateStr =
            item.scheduledDate ||
            item.date ||
            item.reminderDate;

          if (!dateStr) return;

          const key = (() => {
            const dateParts = String(dateStr).match(
              /^(\d{1,2})-(\d{1,2})-(\d{4})$/
            );

            if (dateParts) {
              return (
                `${dateParts[3]}-` +
                `${String(dateParts[2]).padStart(2, "0")}-` +
                `${String(dateParts[1]).padStart(2, "0")}`
              );
            }

            const date = new Date(dateStr);

            if (Number.isNaN(date.getTime())) {
              return "";
            }

            return (
              `${date.getFullYear()}-` +
              `${String(date.getMonth() + 1).padStart(2, "0")}-` +
              `${String(date.getDate()).padStart(2, "0")}`
            );
          })();

          if (!key) return;

          if (!map[key]) {
            map[key] = [];
          }

          map[key].push(
            String(
              item.status ||
                "PENDING"
            ).toLowerCase()
          );
        }
      );

      return map;
    }, [calendarData]);

  // =========================================================
  // CALENDAR DATE CLASS
  // =========================================================

  const getCalendarDateClass = (
    day
  ) => {
    const dateValue =
      Number(day);

    if (!dateValue) {
      return "";
    }

    const key =
      `${calendarYear}-` +
      `${String(
        calendarMonth + 1
      ).padStart(
        2,
        "0"
      )}-` +
      `${String(
        dateValue
      ).padStart(
        2,
        "0"
      )}`;

    const statuses =
      calendarStatusMap[
        key
      ];

    const currentDate =
      new Date(
        calendarYear,
        calendarMonth,
        dateValue
      );

    const todayOnly =
      new Date(
        todayYear,
        todayMonth,
        todayDate
      );

    const isPastDate =
      currentDate <
      todayOnly;

    const isToday =
      dateValue ===
        todayDate &&
      calendarMonth ===
        todayMonth &&
      calendarYear ===
        todayYear;

    if (
      statuses &&
      statuses.length > 0
    ) {
      const anyVisible =
        statuses.some(
          (status) =>
            visibleStatuses[
              status
            ]
        );

      if (!anyVisible) {
        return `${
          isToday
            ? " today"
            : ""
        } filtered-out`;
      }
    }

    let statusClass =
      "";

    if (
      statuses &&
      statuses.length > 0
    ) {
      if (
        statuses.includes(
          "missed"
        ) &&
        visibleStatuses.missed
      ) {
        statusClass =
          " missed";
      } else if (
        statuses.includes(
          "taken"
        ) &&
        visibleStatuses.taken
      ) {
        statusClass =
          " taken";
      }
    }

    if (statusClass) {
      return `${
        isToday
          ? " today"
          : ""
      }${statusClass}`;
    }

    if (isPastDate) {
      return " past-date";
    }

    return `${
      isToday
        ? " today"
        : ""
    }`;
  };

  const getCalendarDateDotClass = (day) => {
    const dateValue = Number(day);

    if (!dateValue) {
      return "";
    }

    const key =
      `${calendarYear}-` +
      `${String(calendarMonth + 1).padStart(2, "0")}-` +
      `${String(dateValue).padStart(2, "0")}`;

    const statuses = calendarStatusMap[key] || [];

    if (
      statuses.includes("missed") &&
      visibleStatuses.missed
    ) {
      return "missed";
    }

    if (
      statuses.includes("taken") &&
      visibleStatuses.taken
    ) {
      return "taken";
    }

    return "";
  };

  // =========================================================
  // CALENDAR NAVIGATION
  // =========================================================

  const handlePrevMonth = () => {
    if (
      calendarMonth === 0
    ) {
      setCalendarMonth(11);

      setCalendarYear(
        (year) =>
          year - 1
      );
    } else {
      setCalendarMonth(
        (month) =>
          month - 1
      );
    }
  };

  const handleNextMonth = () => {
    if (
      calendarMonth === 11
    ) {
      setCalendarMonth(0);

      setCalendarYear(
        (year) =>
          year + 1
      );
    } else {
      setCalendarMonth(
        (month) =>
          month + 1
      );
    }
  };

  const handleGoToToday = () => {
    setCalendarMonth(
      todayMonth
    );

    setCalendarYear(
      todayYear
    );
  };

  const toggleStatusFilter = (
    status
  ) => {
    setVisibleStatuses(
      (prev) => ({
        ...prev,

        [status]:
          !prev[status],
      })
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* PROFILE */}

      {!profileCompleted && (
        <CompleteProfileModal
          onComplete={
            handleProfileComplete
          }
        />
      )}

      {/* ADD MEDICINE */}

      {showAddMedicineModal && (
        <AddMedicineModal
          onClose={
            handleCloseMedicineModal
          }
        />
      )}

      {/* ADD STOCK */}

      {showAddStockModal && (
        <AddStockModal
          onClose={
            handleAddStock
          }
        />
      )}

      <div
        className={`dashboard ${
          !profileCompleted
            ? "dashboard-blur"
            : ""
        }`}
      >
        {/* HEADER */}

        <header className="topbar">
          <button
            type="button"
            className="header-menu-btn"
            aria-label="Toggle menu"
            onClick={
              handleSidebarToggle
            }
          >
            <Menu size={24} />
          </button>

          <div className="logo-section">
            <img
              src="ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
              alt="logo"
              className="logo"
            />

            <div className="logo-text">
              <h2>
                Healthcare Monitoring{" "}
                <span>
                  System
                </span>
              </h2>

              <p>
                Secure • Reliable • Care Focused
              </p>
            </div>
          </div>

          <div className="top-right">
            <button
              type="button"
              className="notification-btn"
              aria-label="Notifications"
              onClick={() => {
                setShowNotifications(
                  true
                );

                setShowProfile(
                  false
                );

                setShowLogoutModal(
                  false
                );

                if (isMobile) {
                  setSidebarOpen(
                    false
                  );
                }
              }}
            >
              <Bell className="top-icon" />

              {notificationCount > 0 && (
                <span className="notification-badge">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            <div className="profile-box">
              <div className="avatar">
                <span className="avatar-initials">{userInitials}</span>
              </div>

              <span>
                {currentUserName}
              </span>

              <ChevronDown
                className="profile-chevron"
                size={16}
              />
            </div>
          </div>
        </header>

        {/* BODY */}

        <div
          className={`dashboard-body ${
            sidebarOpen
              ? "sidebar-open"
              : "sidebar-closed"
          } ${
            isMobile
              ? "mobile-view"
              : ""
          }`}
        >
          {isMobile &&
            sidebarOpen && (
              <div
                className="sidebar-backdrop"
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
              />
            )}

          {/* SIDEBAR */}

          <aside className="sidebar">
            <div className="sidebar-header">
              {sidebarOpen && (
                <h3 className="sidebar-title">
                  Menu
                </h3>
              )}
            </div>

            <ul className="sidebar-menu">
              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Home"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Home"
                  )
                }
              >
                <Home size={22} />

                {sidebarOpen && (
                  <span>Home</span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "My Profile"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "My Profile"
                  )
                }
              >
                <User size={22} />

                {sidebarOpen && (
                  <span>
                    My Profile
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Medicine Management"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Medicine Management"
                  )
                }
              >
                <ClipboardPlus
                  size={22}
                />

                {sidebarOpen && (
                  <span>
                    Medicine Management
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Medicine Inventory"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Medicine Inventory"
                  )
                }
              >
                <Package size={22} />

                {sidebarOpen && (
                  <span>
                    Medicine Inventory
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Reminders"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Reminders"
                  )
                }
              >
                <Bell size={22} />

                {sidebarOpen && (
                  <span>
                    Reminders
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Alerts"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Alerts"
                  )
                }
              >
                <TriangleAlert
                  size={22}
                />

                {sidebarOpen && (
                  <span>
                    Alerts
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Reports"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Reports"
                  )
                }
              >
                <BarChart3
                  size={22}
                />

                {sidebarOpen && (
                  <span>
                    Reports
                  </span>
                )}
              </li>

              <li className="sidebar-divider" />

              <li
                className={`sidebar-item sidebar-logout ${
                  activeItem ===
                  "Logout"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Logout"
                  )
                }
              >
                <LogOut size={22} />

                {sidebarOpen && (
                  <span>
                    Logout
                  </span>
                )}
              </li>
            </ul>
          </aside>

          {/* MAIN */}

          <main className="main-content">
            {showNotifications ? (
              <UserNotifi />
            ) : showViewReport ? (
              <UserViewRep
                onBack={() =>
                  setShowViewReport(
                    false
                  )
                }
              />
            ) : activeItem ===
              "Medicine Inventory" ? (
              <UserInvent
                onAddStock={() =>
                  setShowAddStockModal(
                    true
                  )
                }
              />
            ) : activeItem ===
              "Reports" ? (
              <UserReport
                onViewReport={() =>
                  setShowViewReport(
                    true
                  )
                }
              />
            ) : activeItem ===
              "Alerts" ? (
              <UserAlert
                onAddMedicine={
                  handleAddMedicine
                }
                onViewInventory={() =>
                  setActiveItem(
                    "Medicine Inventory"
                  )
                }
              />
            ) : activeItem ===
              "Reminders" ? (
              <UserRem
                onAddMedicine={
                  handleAddMedicine
                }
                onReminderActionComplete={
                  handleDoseActionComplete
                }
              />
            ) : showLogoutModal ? (
              <UserLogout
                onCancel={() =>
                  setShowLogoutModal(
                    false
                  )
                }
                onLogout={() => {
                  setShowLogoutModal(
                    false
                  );

                  onLogout?.();
                }}
              />
            ) : showProfile ? (
              <UserProfiles />
            ) : (
              <>
                <h2 className="page-title">
                  Dashboard
                </h2>

                {/* =====================================
                    TOP 4 CARDS
                ===================================== */}

                <div className="stats-grid">
                  <div className="stat-card">
                    <CalendarDays />

                    <div>
                      <h1>
                        {summaryLoading
                          ? "..."
                          : dashboardSummary.todaysMedicines}
                      </h1>

                      <p>
                        Today's Medicines
                      </p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <CircleCheck />

                    <div>
                      <h1>
                        {summaryLoading
                          ? "..."
                          : dashboardSummary.taken}
                      </h1>

                      <p>
                        Taken
                      </p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <CircleX />

                    <div>
                      <h1>
                        {summaryLoading
                          ? "..."
                          : dashboardSummary.missed}
                      </h1>

                      <p>
                        Missed
                      </p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <ArrowDownCircle />

                    <div>
                      <h1>
                        {summaryLoading
                          ? "..."
                          : dashboardSummary.lowStockAlerts}
                      </h1>

                      <p>
                        Low Stock Alerts
                      </p>
                    </div>
                  </div>
                </div>

                {/* =====================================
                    ROW 1
                ===================================== */}

                <div className="card-row">
                  {/* TODAY'S SCHEDULE */}

                  <div className="dashboard-card today-schedule-card">
                    <div className="card-header">
                      <CalendarDays />

                      Today's Schedules
                    </div>

                    <div className="schedule-content">
                      {scheduleLoading ? (
                        <div className="empty-card">
                          <CalendarDays
                            size={60}
                          />

                          <h4>
                            Loading today's schedule...
                          </h4>
                        </div>
                      ) : todaySchedule.length ===
                        0 ? (
                        <div className="empty-card">
                          <CalendarDays
                            size={60}
                          />

                          <h4>
                            No medicine scheduled for today
                          </h4>

                          <p>
                            Add medicine and set reminder to see your schedule
                          </p>

                          <button
                            className="add-first-medicine-btn"
                            onClick={
                              handleAddMedicine
                            }
                          >
                            <Plus
                              size={24}
                            />

                            <span>
                              Add Your First Medicine
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="today-timeline medicine-list--today">
                          <div className="today-timeline-scroll-area">
                            <div className="today-timeline-date-card">
                              <CalendarDays
                                size={
                                  24
                                }
                              />

                              <span>
                                Today
                              </span>

                              <strong>
                                {
                                  todayScheduleDate
                                }
                              </strong>
                            </div>

                            <div className="today-timeline-track-wrap">
                              <div className="today-timeline-scale">
                                <span>
                                  00:00
                                </span>

                                <span>
                                  12:00
                                </span>

                                <span>
                                  24:00
                                </span>
                              </div>

                              <div className="today-timeline-rows">
                                {schedulePageItems.map(
                                  (row) => (
                                    <div
                                      key={
                                        row.name
                                      }
                                      className="today-timeline-row"
                                    >
                                      <div className="today-timeline-row-name">
                                        {
                                          row.name
                                        }
                                      </div>

                                      <div
                                        className="today-timeline-track"
                                        style={{
                                          minHeight: `${
                                            96 +
                                            Math.max(
                                              0,
                                              row
                                                .medicines
                                                .length -
                                                1
                                            ) *
                                              8
                                          }px`,
                                        }}
                                      >
                                        <span className="today-timeline-node start" />
                                        <span className="today-timeline-node mid" />
                                        <span className="today-timeline-node end" />

                                        {row.medicines.map(
                                          (
                                            medicine,
                                            index
                                          ) => {
                                            const status =
                                              String(
                                                medicine.status ||
                                                  "PENDING"
                                              ).toLowerCase();

                                            return (
                                              <div
                                                key={
                                                  medicine.doseId ||
                                                  medicine.id ||
                                                  `${row.name}-${index}`
                                                }
                                                className={`today-timeline-medicine ${status}`}
                                                style={{
                                                  left: `${getScheduleTimelinePosition(
                                                    medicine
                                                  )}%`,

                                                  "--card-offset": `${
                                                    (index -
                                                      (row
                                                        .medicines
                                                        .length -
                                                        1) /
                                                        2) *
                                                    44
                                                  }px`,
                                                }}
                                              >
                                                <span className="today-timeline-pin" />

                                                <div className="today-timeline-card">
                                                  <strong>
                                                    {getScheduleTimeLabel(
                                                      medicine
                                                    )}
                                                  </strong>

                                                  <small>
                                                    <Clock
                                                      size={
                                                        12
                                                      }
                                                    />

                                                    {status
                                                      .charAt(
                                                        0
                                                      )
                                                      .toUpperCase() +
                                                      status.slice(
                                                        1
                                                      )}
                                                  </small>
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>

                                      {row.notes && (
                                        <div className="today-schedule-notes">
                                          <div className="today-schedule-notes-label">
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
                                              row.notes
                                            }
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="dashboard-schedule-pagination">
                            <div className="schedule-page-info">
                              Showing{" "}
                              {scheduleStartIndex +
                                1}{" "}
                              to{" "}
                              {Math.min(
                                scheduleStartIndex +
                                  scheduleItemsPerPage,
                                scheduleTotalItems
                              )}{" "}
                              of{" "}
                              {
                                scheduleTotalItems
                              }
                            </div>

                            <div className="schedule-pagination-controls">
                              <button
                                className="schedule-page-btn"
                                disabled={
                                  schedulePageSafe ===
                                  1
                                }
                                onClick={() =>
                                  changeSchedulePage(
                                    (
                                      page
                                    ) =>
                                      Math.max(
                                        1,
                                        page -
                                          1
                                      )
                                  )
                                }
                              >
                                Prev
                              </button>

                              {Array.from(
                                {
                                  length:
                                    scheduleTotalPages,
                                },
                                (
                                  _,
                                  index
                                ) =>
                                  index +
                                  1
                              ).map(
                                (
                                  page
                                ) => (
                                  <button
                                    key={
                                      page
                                    }
                                    className={`schedule-page-btn schedule-page-num ${
                                      schedulePageSafe ===
                                      page
                                        ? "active"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      changeSchedulePage(
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
                                className="schedule-page-btn"
                                disabled={
                                  schedulePageSafe ===
                                  scheduleTotalPages
                                }
                                onClick={() =>
                                  changeSchedulePage(
                                    (
                                      page
                                    ) =>
                                      Math.min(
                                        scheduleTotalPages,
                                        page +
                                          1
                                      )
                                  )
                                }
                              >
                                Next
                              </button>
                            </div>
                          </div>

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
                        </div>
                      )}
                    </div>
                  </div>

                  {/* INVENTORY OVERVIEW */}

                  <div className="dashboard-card inventory-overview-card">
                    <div className="card-header">
                      <Package />

                      Inventory Overview
                    </div>

                    {inventoryLoading ? (
                      <div className="empty-card">
                        <Package
                          size={60}
                        />

                        <h4>
                          Loading inventory...
                        </h4>
                      </div>
                    ) : inventoryData.length ===
                      0 ? (
                      <div className="empty-card">
                        <Package
                          size={60}
                        />

                        <h4>
                          No inventory data available
                        </h4>

                        <p>
                          Add medicine stock to track stock and get alerts
                        </p>

                        <button
                          className="add-first-medicine-btn"
                          onClick={() =>
                            setShowAddStockModal(
                              true
                            )
                          }
                        >
                          <Plus
                            size={24}
                          />

                          <span>
                            Add Medicine Stock
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="stock-table">
                        <div className="stock-table-header">
                          <span>
                            Medicine
                          </span>

                          <span>
                            Current Stock
                          </span>

                          <span>
                            Min Stock
                          </span>

                          <span>
                            Expiry Date
                          </span>
                        </div>

                        {inventoryPageItems.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                item.id ||
                                item.inventoryId ||
                                index
                              }
                              className="stock-table-row"
                            >
                              <span className="stock-medicine-name">
                                {
                                  item.medicineName
                                }
                              </span>

                              <span>
                                {
                                  item.currentStock
                                }
                              </span>

                              <span>
                                {
                                  item.minimumStock
                                }
                              </span>

                              <span>
                                {
                                  item.expiryDate
                                }
                              </span>

                              <div
                                className="stock-mobile-top"
                                aria-hidden="true"
                              >
                                <span className="stock-mobile-name">
                                  {
                                    item.medicineName
                                  }
                                </span>
                              </div>

                              <div
                                className="stock-mobile-metrics"
                                aria-hidden="true"
                              >
                                <div className="stock-mobile-metric">
                                  <span className="stock-mobile-icon">
                                    <Package
                                      size={
                                        18
                                      }
                                    />
                                  </span>

                                  <strong>
                                    {
                                      item.currentStock
                                    }
                                  </strong>

                                  <small>
                                    Current
                                  </small>
                                </div>

                                <div className="stock-mobile-metric">
                                  <span className="stock-mobile-icon">
                                    <ShieldCheck
                                      size={
                                        18
                                      }
                                    />
                                  </span>

                                  <strong>
                                    {
                                      item.minimumStock
                                    }
                                  </strong>

                                  <small>
                                    Min
                                  </small>
                                </div>

                                <div className="stock-mobile-metric">
                                  <span className="stock-mobile-icon">
                                    <CalendarDays
                                      size={
                                        18
                                      }
                                    />
                                  </span>

                                  <strong>
                                    {item.expiryDate ||
                                      "--"}
                                  </strong>

                                  <small>
                                    Expiry
                                  </small>
                                </div>
                              </div>
                            </div>
                          )
                        )}

                        <div className="inventory-overview-pagination dashboard-schedule-pagination">
                          <div className="schedule-page-info">
                            Showing{" "}
                            {inventoryStartIndex +
                              1}{" "}
                            to{" "}
                            {Math.min(
                              inventoryStartIndex +
                                inventoryItemsPerPage,
                              inventoryData.length
                            )}{" "}
                            of{" "}
                            {
                              inventoryData.length
                            }
                          </div>

                          <div className="schedule-pagination-controls">
                            <button
                              className="schedule-page-btn"
                              disabled={
                                inventoryPageSafe ===
                                1
                              }
                              onClick={() =>
                                setInventoryPage(
                                  (
                                    page
                                  ) =>
                                    Math.max(
                                      1,
                                      page -
                                        1
                                    )
                                )
                              }
                            >
                              Prev
                            </button>

                            {Array.from(
                              {
                                length:
                                  inventoryTotalPages,
                              },
                              (
                                _,
                                index
                              ) =>
                                index +
                                1
                            ).map(
                              (
                                page
                              ) => (
                                <button
                                  key={
                                    page
                                  }
                                  className={`schedule-page-btn schedule-page-num ${
                                    inventoryPageSafe ===
                                    page
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    setInventoryPage(
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
                              className="schedule-page-btn"
                              disabled={
                                inventoryPageSafe ===
                                inventoryTotalPages
                              }
                              onClick={() =>
                                setInventoryPage(
                                  (
                                    page
                                  ) =>
                                    Math.min(
                                      inventoryTotalPages,
                                      page +
                                        1
                                    )
                                )
                              }
                            >
                              Next
                            </button>
                          </div>
                        </div>

                        <button
                          className="add-stock-inline-btn"
                          onClick={() =>
                            setShowAddStockModal(
                              true
                            )
                          }
                        >
                          <Plus
                            size={20}
                          />

                          Add More Stock
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* =====================================
                    ROW 2
                ===================================== */}

                <div
                  className="card-row"
                  ref={myMedicineRef}
                >
                  {/* UserManage now handles its own
                      GET/PUT/DELETE APIs */}

                  <UserManage />

                  {/* CALENDAR */}

                  <div className="dashboard-card calendar-card">
                    <div className="card-header">
                      <span className="calendar-title">
                        <CalendarDays />

                        Calendar
                      </span>

                      <button
                        type="button"
                        className="calendar-today-btn"
                        onClick={
                          handleGoToToday
                        }
                      >
                        Today

                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 1 1-2.64-6.36" />

                          <polyline points="21 3 21 9 15 9" />
                        </svg>
                      </button>
                    </div>

                    <div className="calendar-container">
                      <div className="calendar-header">
                        <button
                          type="button"
                          className="calendar-nav-btn"
                          onClick={
                            handlePrevMonth
                          }
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>

                        <h3>
                          {monthLabel}
                        </h3>

                        <button
                          type="button"
                          className="calendar-nav-btn"
                          onClick={
                            handleNextMonth
                          }
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>

                      {calendarLoading && (
                        <div className="calendar-loading">
                          Loading...
                        </div>
                      )}

                      <div className="calendar-grid">
                        {[
                          "Sun",
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                        ].map(
                          (day) => (
                            <div
                              key={
                                day
                              }
                              className="calendar-day-header"
                            >
                              {
                                day
                              }
                            </div>
                          )
                        )}

                        {calendarDays.map(
                          (
                            day,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                              className={`calendar-date${getCalendarDateClass(
                                day
                              )}`}
                            >
                              <span className="calendar-date-number">
                                {day}
                              </span>

                              {getCalendarDateDotClass(day) && (
                                <span
                                  className={`calendar-status-dot ${getCalendarDateDotClass(
                                    day
                                  )}`}
                                />
                              )}
                            </div>
                          )
                        )}
                      </div>

                      <div className="calendar-footer">
                        <div className="calendar-legend">
                          <div className="legend-item">
                            <button
                              type="button"
                              className={`legend-toggle ${
                                visibleStatuses.taken
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                toggleStatusFilter(
                                  "taken"
                                )
                              }
                            >
                              <span className="legend-dot taken" />

                              <span>
                                Taken
                              </span>
                            </button>
                          </div>

                          <div className="legend-item">
                            <button
                              type="button"
                              className={`legend-toggle ${
                                visibleStatuses.missed
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                toggleStatusFilter(
                                  "missed"
                                )
                              }
                            >
                              <span className="legend-dot missed" />

                              <span>
                                Missed
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="calendar-actions">
                          <button
                            type="button"
                            className="calendar-action-btn alert-btn"
                            onClick={() =>
                              handleMenuItemClick(
                                "Alerts"
                              )
                            }
                          >
                            Alert
                          </button>

                          <button
                            type="button"
                            className="calendar-action-btn reminder-btn"
                            onClick={() =>
                              handleMenuItemClick(
                                "Reminders"
                              )
                            }
                          >
                            Reminder
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default UserDash;























































