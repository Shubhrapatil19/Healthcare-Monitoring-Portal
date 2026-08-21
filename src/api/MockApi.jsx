// ================================================================
// MockApi.jsx
// USER MOCK API ONLY
// ----------------------------------------------------------------
// No backend
// No axios
// No ngrok
// Everything stored in localStorage
// ================================================================

const DELAY = 300;

const wait = (ms = DELAY) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ================================================================
// COMMON HELPERS
// ================================================================

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);

    return raw
      ? JSON.parse(raw)
      : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error(
      `Unable to write ${key}:`,
      error
    );
  }
};

const apiError = (message) => {
  const error = new Error(message);

  error.response = {
    data: {
      message,
    },
  };

  return error;
};

// ================================================================
// STORAGE KEYS
// ================================================================

const KEYS = {
  MEDICINES: "demo_medicines",
  PENDING: "demo_pendingReminders",
  HISTORY: "demo_historyReminders",
  NOTIFICATIONS: "demo_notifications",
};

// ================================================================
// DATE
// ================================================================

const todayISO = () =>
  new Date()
    .toISOString()
    .slice(0, 10);

// ================================================================
// DEFAULT MEDICINES
// ================================================================

const DEFAULT_MEDICINES = [
  {
    id: "m1",
    name: "Metformin",
    medicineName: "Metformin",
    dosage: "500mg",
    frequency: "Twice a day",
    currentStock: 12,
    minimumStock: 10,
    status: "upcoming",
  },
  {
    id: "m2",
    name: "Paracetamol",
    medicineName: "Paracetamol",
    dosage: "650mg",
    frequency: "Once a day",
    currentStock: 4,
    minimumStock: 10,
    status: "upcoming",
  },
  {
    id: "m3",
    name: "Amlodipine",
    medicineName: "Amlodipine",
    dosage: "5mg",
    frequency: "Once a day",
    currentStock: 20,
    minimumStock: 10,
    status: "upcoming",
  },
];

// ================================================================
// DEFAULT PENDING REMINDERS
// ================================================================

const DEFAULT_PENDING = [
  {
    id: "r1",
    medicineId: "m1",
    medicineName: "Metformin",
    dosage: "500mg",
    time: "09:00",
    date: todayISO(),
    status: "upcoming",
  },
  {
    id: "r2",
    medicineId: "m3",
    medicineName: "Amlodipine",
    dosage: "5mg",
    time: "20:00",
    date: todayISO(),
    status: "upcoming",
  },
];

// ================================================================
// DEFAULT HISTORY
// ================================================================

const DEFAULT_HISTORY = [
  {
    id: "h1",
    medicineId: "m1",
    medicineName: "Metformin",
    dosage: "500mg",
    time: "09:00",
    date: todayISO(),
    status: "taken",
  },
  {
    id: "h2",
    medicineId: "m2",
    medicineName: "Paracetamol",
    dosage: "650mg",
    time: "14:00",
    date: todayISO(),
    status: "missed",
  },
];

// ================================================================
// DEFAULT USER NOTIFICATIONS
// ================================================================

const DEFAULT_NOTIFICATIONS = [
  {
    id: "n1",
    type: "info",
    title: "Medicine Reminder",
    message:
      "It's time to take Metformin 500mg.",
    status: "Unread",
    createdAt:
      new Date().toISOString(),
  },
  {
    id: "n2",
    type: "warning",
    title: "Low Stock Alert",
    message:
      "Paracetamol stock is running low.",
    status: "Unread",
    createdAt:
      new Date(
        Date.now() -
          60 * 60 * 1000
      ).toISOString(),
  },
  {
    id: "n3",
    type: "success",
    title: "Medicine Taken",
    message:
      "Metformin has been marked as taken.",
    status: "Read",
    createdAt:
      new Date(
        Date.now() -
          2 * 60 * 60 * 1000
      ).toISOString(),
  },
  {
    id: "n4",
    type: "critical",
    title: "Missed Medicine",
    message:
      "You missed your Paracetamol dose.",
    status: "Unread",
    createdAt:
      new Date(
        Date.now() -
          3 * 60 * 60 * 1000
      ).toISOString(),
  },
];

// ================================================================
// GENERIC LOAD / SAVE
// ================================================================

const load = (
  key,
  fallback
) => {
  try {
    const raw =
      localStorage.getItem(key);

    if (raw === null) {
      localStorage.setItem(
        key,
        JSON.stringify(fallback)
      );

      return fallback;
    }

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const save = (
  key,
  value
) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error(
      "Storage error:",
      error
    );
  }
};

// ================================================================
// ID GENERATOR
// ================================================================

let idCounter = Date.now();

const nextId = (
  prefix = "id"
) =>
  `${prefix}_${idCounter++}`;

// ================================================================
// DATA HELPERS
// ================================================================

const loadMedicines = () =>
  load(
    KEYS.MEDICINES,
    DEFAULT_MEDICINES
  );

const saveMedicines = (
  value
) =>
  save(
    KEYS.MEDICINES,
    value
  );

const loadPendingReminders =
  () =>
    load(
      KEYS.PENDING,
      DEFAULT_PENDING
    );

const savePendingReminders =
  (value) =>
    save(
      KEYS.PENDING,
      value
    );

const loadHistoryReminders =
  () =>
    load(
      KEYS.HISTORY,
      DEFAULT_HISTORY
    );

const saveHistoryReminders =
  (value) =>
    save(
      KEYS.HISTORY,
      value
    );

// ================================================================
// USER AUTH - REGISTER
// ================================================================

export const registerUser =
  async ({
    fullName,
    email,
    mobile,
    password,
  }) => {
    await wait();

    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    // Reserve Admin email
    if (
      normalizedEmail ===
      "admin@gmail.com"
    ) {
      throw apiError(
        "This email is reserved for the administrator."
      );
    }

    const users =
      read(
        "mockUsers",
        []
      );

    const alreadyExists =
      users.some(
        (user) =>
          String(
            user.email || ""
          )
            .trim()
            .toLowerCase() ===
          normalizedEmail
      );

    if (alreadyExists) {
      throw apiError(
        "This email is already registered."
      );
    }

    users.push({
      fullName,
      email:
        normalizedEmail,
      mobile,
      password,
      role: "USER",
    });

    write(
      "mockUsers",
      users
    );

    return {
      data: {
        success: true,
        role: "USER",
        message:
          "Account created successfully!",
      },
    };
  };

// ================================================================
// USER AUTH - LOGIN
// ================================================================

export const loginUser =
  async ({
    email,
    password,
  }) => {
    await wait();

    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const users =
      read(
        "mockUsers",
        []
      );

    const user =
      users.find(
        (item) =>
          String(
            item.email || ""
          )
            .trim()
            .toLowerCase() ===
          normalizedEmail
      );

    if (
      !user ||
      user.password !==
        password
    ) {
      throw apiError(
        "Incorrect email or password"
      );
    }

    const token =
      `user-token-${Date.now()}`;

    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "isLoggedIn",
      "true"
    );

    localStorage.setItem(
      "userRole",
      "USER"
    );

    localStorage.setItem(
      "currentUserName",
      user.fullName
    );

    write(
      "registeredUser",
      {
        fullName:
          user.fullName,

        email:
          user.email,

        mobile:
          user.mobile,
      }
    );

    return {
      data: {
        success: true,
        token,
        type: "Bearer",
        role: "USER",
        fullName:
          user.fullName,
        email:
          user.email,
        message:
          "Login successful!",
      },
    };
  };

// ================================================================
// USER AUTH - LOGOUT
// ================================================================

export const logoutUser =
  () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "isLoggedIn"
    );

    localStorage.removeItem(
      "userRole"
    );

    localStorage.removeItem(
      "currentUserName"
    );

    return {
      data: {
        success: true,
        message:
          "Logged out successfully!",
      },
    };
  };

// ================================================================
// CONFIRM LOGIN
// ================================================================

export const confirmLoginToken =
  async (token) => {
    await wait();

    if (!token) {
      throw apiError(
        "Invalid confirmation link."
      );
    }

    return {
      data: {
        success: true,
        token,
      },
    };
  };

// ================================================================
// PROFILE - COMPLETE
// ================================================================

export const completeProfile =
  async (payload) => {
    await wait();

    const registeredUser =
      read(
        "registeredUser",
        {}
      );

    const profile = {
      ...payload,

      fullName:
        payload.fullName ||
        registeredUser.fullName ||
        "",

      email:
        payload.email ||
        registeredUser.email ||
        "",

      mobile:
        payload.mobile ||
        registeredUser.mobile ||
        "",



      gender:
        payload.gender ||
        "",

      completed: true,
    };

    write(
      "mockProfile",
      profile
    );

    write(
      "profileData",
      profile
    );

    localStorage.setItem(
      "profileCompleted",
      "true"
    );

    return {
      data: {
        success: true,
        message:
          "Profile completed successfully!",
        ...profile,
      },
    };
  };

// ================================================================
// PROFILE - GET
// ================================================================

export const getProfile =
  async () => {
    await wait();

    const profile =
      read(
        "mockProfile",
        {}
      );

    const registeredUser =
      read(
        "registeredUser",
        {}
      );

    return {
      data: {
        ...profile,

        fullName:
          profile.fullName ||
          registeredUser.fullName ||
          "",

        email:
          profile.email ||
          registeredUser.email ||
          "",

        mobile:
          profile.mobile ||
          registeredUser.mobile ||
          "",
      },
    };
  };

// ================================================================
// PROFILE - UPDATE
// ================================================================

export const updateProfile =
  async (payload) => {
    await wait();

    const existingProfile =
      read(
        "mockProfile",
        {}
      );

    const registeredUser =
      read(
        "registeredUser",
        {}
      );

    const updatedProfile = {
      ...existingProfile,
      ...payload,

      fullName:
        payload.fullName ||
        existingProfile.fullName ||
        registeredUser.fullName ||
        "",

      email:
        payload.email ||
        existingProfile.email ||
        registeredUser.email ||
        "",

      mobile:
        payload.mobile ||
        existingProfile.mobile ||
        registeredUser.mobile ||
        "",



      completed: true,
    };

    write(
      "mockProfile",
      updatedProfile
    );

    write(
      "profileData",
      updatedProfile
    );

    write(
      "registeredUser",
      {
        ...registeredUser,

        fullName:
          updatedProfile.fullName,

        email:
          updatedProfile.email,
      }
    );

    if (
      updatedProfile.fullName
    ) {
      localStorage.setItem(
        "currentUserName",
        updatedProfile.fullName
      );
    }

    localStorage.setItem(
      "profileCompleted",
      "true"
    );

    return {
      data: {
        success: true,
        message:
          "Profile updated successfully!",
        ...updatedProfile,
      },
    };
  };

// ================================================================
// MEDICINES - GET
// ================================================================

export const getMedicines =
  async () => {
    await wait();

    return {
      data: {
        medicines:
          loadMedicines(),
      },
    };
  };

// ================================================================
// MEDICINES - ADD
// ================================================================

export const addMedicine =
  async (payload) => {
    await wait();

    const medicines =
      loadMedicines();

    const medicineName =
      payload.medicineName ||
      payload.name ||
      "Medicine";

    const newMedicine = {
      id:
        nextId("m"),

      ...payload,

      name:
        medicineName,

      medicineName,

      currentStock:
        Number(
          payload.currentStock
        ) || 0,

      minimumStock:
        Number(
          payload.minimumStock
        ) || 0,

      status:
        payload.status ||
        "upcoming",
    };

    medicines.push(
      newMedicine
    );

    saveMedicines(
      medicines
    );

    const reminderTimes =
      Array.isArray(payload.timings) && payload.timings.length > 0
        ? payload.timings.filter(Boolean)
        : [
            payload.timing ||
              String(
                payload.startTiming ||
                  ""
              ).slice(0, 5),
          ].filter(Boolean);

    if (reminderTimes.length > 0) {
      const pending =
        loadPendingReminders();

      reminderTimes.forEach((reminderTime, index) => {
        pending.push({
          id:
            nextId("r"),

          medicineId:
            newMedicine.id,

          medicineName,

          dosage:
            newMedicine.dosage ||
            "",

          time:
            reminderTime,

          doseIndex:
            index + 1,

          frequency:
            newMedicine.frequency ||
            "Once a day",

          date:
            payload.startDate ||
            todayISO(),

          status:
            "upcoming",
        });
      });

      savePendingReminders(
        pending
      );
    }

    return {
      data: {
        success: true,
        message:
          "Medicine added successfully!",
        medicine:
          newMedicine,
      },
    };
  };

// ================================================================
// MEDICINES - UPDATE
// ================================================================

export const updateMedicine =
  async (
    id,
    payload
  ) => {
    await wait();

    const medicines =
      loadMedicines();

    const index =
      medicines.findIndex(
        (medicine) =>
          String(
            medicine.id
          ) ===
          String(id)
      );

    if (
      index === -1
    ) {
      throw apiError(
        "Medicine not found"
      );
    }

    medicines[index] = {
      ...medicines[index],
      ...payload,
    };

    saveMedicines(
      medicines
    );

    return {
      data: {
        success: true,
        medicine:
          medicines[index],
      },
    };
  };

// ================================================================
// MEDICINES - DELETE
// ================================================================

export const deleteMedicine =
  async (id) => {
    await wait();

    const medicines =
      loadMedicines()
        .filter(
          (medicine) =>
            String(
              medicine.id
            ) !==
            String(id)
        );

    saveMedicines(
      medicines
    );

    const pending =
      loadPendingReminders()
        .filter(
          (reminder) =>
            String(
              reminder.medicineId
            ) !==
            String(id)
        );

    savePendingReminders(
      pending
    );

    return {
      data: {
        success: true,
        message:
          "Medicine deleted successfully!",
      },
    };
  };

// ================================================================
// TODAY SCHEDULE
// ================================================================

export const getTodaySchedule =
  async () => {
    await wait();

    const today =
      todayISO();

    const medicines =
      loadMedicines();

    return {
      data:
        loadPendingReminders()
          .filter(
            (reminder) =>
              reminder.date ===
              today
          )
          .map((reminder) => {
            const medicine =
              medicines.find(
                (item) =>
                  String(item.id) ===
                  String(reminder.medicineId)
              );

            return {
              ...reminder,
              frequency:
                reminder.frequency ||
                medicine?.frequency ||
                "Once a day",

              notes:
                reminder.notes ||
                medicine?.notes ||
                medicine?.note ||
                medicine?.instructions ||
                "",
            };
          }),
    };
  };

// ================================================================
// DASHBOARD SUMMARY
// ================================================================

export const getDashboardSummary =
  async () => {
    await wait();

    const today =
      todayISO();

    const medicines =
      loadMedicines();

    const pending =
      loadPendingReminders()
        .filter(
          (item) =>
            item.date ===
            today
        );

    const history =
      loadHistoryReminders()
        .filter(
          (item) =>
            item.date ===
            today
        );

    return {
      data: {
        todayMedicines:
          pending.length +
          history.length,

        taken:
          history.filter(
            (item) =>
              item.status ===
              "taken"
          ).length,

        missed:
          history.filter(
            (item) =>
              item.status ===
              "missed"
          ).length,

        lowStock:
          medicines.filter(
            (medicine) => {
              if (medicine.stockRemoved) {
                return false;
              }

              const current =
                Number(
                  medicine.currentStock
                ) || 0;

              const minimum =
                Number(
                  medicine.minimumStock
                ) || 0;

              return (
                current <
                minimum
              );
            }
          ).length,
      },
    };
  };

// ================================================================
// CALENDAR
// ================================================================

export const getCalendar =
  async () => {
    await wait();

    return {
      data: {
        reminders: [
          ...loadPendingReminders(),
          ...loadHistoryReminders(),
        ],
      },
    };
  };

// ================================================================
// REMINDERS - PENDING
// ================================================================

export const getPendingReminders =
  async () => {
    await wait();

    const today =
      todayISO();

    const medicines =
      loadMedicines();

    return {
      data:
        loadPendingReminders()
          .filter(
            (reminder) =>
              reminder.date ===
              today
          )
          .map((reminder) => {
            const medicine =
              medicines.find(
                (item) =>
                  String(item.id) ===
                  String(reminder.medicineId)
              );

            return {
              ...reminder,
              frequency:
                reminder.frequency ||
                medicine?.frequency ||
                "Once a day",

              notes:
                reminder.notes ||
                medicine?.notes ||
                medicine?.note ||
                medicine?.instructions ||
                "",
            };
          }),
    };
  };

// ================================================================
// REMINDERS - HISTORY
// ================================================================

export const getReminderHistory =
  async () => {
    await wait();

    return {
      data:
        loadHistoryReminders(),
    };
  };

// Compatibility with older UserReport.jsx
export const getHistoryReminders =
  () =>
    loadHistoryReminders();

// ================================================================
// INTERNAL REMINDER HELPER
// ================================================================

const moveReminderToHistory =
  (
    id,
    status
  ) => {
    const pending =
      loadPendingReminders();

    const index =
      pending.findIndex(
        (reminder) =>
          String(
            reminder.id
          ) ===
          String(id)
      );

    if (
      index === -1
    ) {
      throw apiError(
        "Reminder not found"
      );
    }

    const [reminder] =
      pending.splice(
        index,
        1
      );

    savePendingReminders(
      pending
    );

    const history =
      loadHistoryReminders();

    const historyItem = {
      ...reminder,
      status,
    };

    history.push(
      historyItem
    );

    saveHistoryReminders(
      history
    );

    return {
      data: {
        success: true,
        message:
          `Marked as ${status}`,
        reminder:
          historyItem,
      },
    };
  };

// ================================================================
// REMINDER - TAKEN
// ================================================================

export const markReminderTaken =
  async (id) => {
    await wait();

    return moveReminderToHistory(
      id,
      "taken"
    );
  };

// ================================================================
// REMINDER - MISSED
// ================================================================

export const markReminderMissed =
  async (id) => {
    await wait();

    return moveReminderToHistory(
      id,
      "missed"
    );
  };

// ================================================================
// REMINDER - SNOOZE
// ================================================================

export const snoozeReminder =
  async (
    id,
    minutes = 10
  ) => {
    await wait();

    const pending =
      loadPendingReminders();

    const index =
      pending.findIndex(
        (reminder) =>
          String(
            reminder.id
          ) ===
          String(id)
      );

    if (
      index === -1
    ) {
      throw apiError(
        "Reminder not found"
      );
    }

    const currentTime =
      String(
        pending[index]
          .time ||
        "00:00"
      );

    const [
      hours = "0",
      mins = "0",
    ] =
      currentTime
        .split(":");

    const totalMinutes =
      (
        Number(hours) *
          60 +
        Number(mins) +
        Number(minutes)
      ) %
      1440;

    const newHours =
      Math.floor(
        totalMinutes /
          60
      );

    const newMinutes =
      totalMinutes %
      60;

    pending[index] = {
      ...pending[index],

      time:
        `${String(
          newHours
        ).padStart(
          2,
          "0"
        )}:${String(
          newMinutes
        ).padStart(
          2,
          "0"
        )}`,

      status:
        "snoozed",
    };

    savePendingReminders(
      pending
    );

    return {
      data: {
        success: true,
        message:
          "Reminder snoozed",
        reminder:
          pending[index],
      },
    };
  };

// ================================================================
// REMINDER - DELETE
// ================================================================

export const deleteReminder =
  async (id) => {
    await wait();

    const pending =
      loadPendingReminders()
        .filter(
          (reminder) =>
            String(
              reminder.id
            ) !==
            String(id)
        );

    const history =
      loadHistoryReminders()
        .filter(
          (reminder) =>
            String(
              reminder.id
            ) !==
            String(id)
        );

    savePendingReminders(
      pending
    );

    saveHistoryReminders(
      history
    );

    return {
      data: {
        success: true,
        message:
          "Reminder deleted successfully!",
      },
    };
  };

// ================================================================
// INVENTORY - GET
// ================================================================

export const getInventory =
  async () => {
    await wait();

    const stockItems =
      loadMedicines()
        .filter(
          (medicine) =>
            !medicine.stockRemoved
        )
        .map(
          (medicine) => ({
            id:
              medicine.id,

            name:
              medicine.name ||
              medicine
                .medicineName,

            medicineName:
              medicine
                .medicineName ||
              medicine.name,

            dosage:
              medicine.dosage,

            currentStock:
              Number(
                medicine
                  .currentStock
              ) || 0,

            minimumStock:
              Number(
                medicine
                  .minimumStock
              ) || 0,

            expiryDate:
              medicine
                .expiryDate ||
              "",
          })
        );

    return {
      data: {
        stockItems,
      },
    };
  };

// ================================================================
// INVENTORY - ADD STOCK
// ================================================================

export const addStock =
  async (payload) => {
    await wait();

    const medicines =
      loadMedicines();

    const medicineName =
      payload.medicineName ||
      payload.name;

    const index =
      medicines.findIndex(
        (medicine) =>
          String(
            medicine
              .medicineName ||
            medicine.name ||
            ""
          )
            .toLowerCase() ===
          String(
            medicineName ||
            ""
          )
            .toLowerCase()
      );

    if (
      index === -1
    ) {
      throw apiError(
        "Please select an existing medicine."
      );
    }

    medicines[index] = {
      ...medicines[index],

      currentStock:
        Number(
          payload.currentStock
        ) || 0,

      minimumStock:
        Number(
          payload.minimumStock
        ) || 0,

      expiryDate:
        payload.expiryDate ||
        medicines[index]
          .expiryDate ||
        "",

      stockRemoved:
        false,
    };

    saveMedicines(
      medicines
    );

    return {
      data: {
        success: true,
        message:
          "Stock updated successfully!",
        stockItem:
          medicines[index],
      },
    };
  };

// ================================================================
// INVENTORY - UPDATE
// ================================================================

export const updateStock =
  async (
    id,
    payload
  ) => {
    await wait();

    const medicines =
      loadMedicines();

    const index =
      medicines.findIndex(
        (medicine) =>
          String(
            medicine.id
          ) ===
          String(id)
      );

    if (
      index === -1
    ) {
      throw apiError(
        "Stock item not found"
      );
    }

    medicines[index] = {
      ...medicines[index],
      ...payload,
      stockRemoved:
        false,
    };

    saveMedicines(
      medicines
    );

    return {
      data: {
        success: true,
        stockItem:
          medicines[index],
      },
    };
  };

// ================================================================
// INVENTORY - DELETE
// ================================================================

export const deleteStock =
  async (id) => {
    await wait();

    const medicines =
      loadMedicines();

    const index =
      medicines.findIndex(
        (medicine) =>
          String(
            medicine.id
          ) ===
          String(id)
      );

    if (
      index === -1
    ) {
      throw apiError(
        "Stock item not found"
      );
    }

    medicines[index] = {
      ...medicines[index],
      currentStock: 0,
      minimumStock: 0,
      stockRemoved: true,
    };

    saveMedicines(
      medicines
    );

    return {
      data: {
        success: true,
        message:
          "Stock removed successfully!",
      },
    };
  };

// ================================================================
// USER NOTIFICATIONS - GET
// ================================================================

export const getNotifications =
  async () => {
    await wait();

    const notifications =
      load(
        KEYS.NOTIFICATIONS,
        DEFAULT_NOTIFICATIONS
      );

    return {
      data: {
        notifications,
      },
    };
  };

// ================================================================
// USER NOTIFICATION - MARK ONE READ
// ================================================================

export const markNotificationRead =
  async (id) => {
    await wait();

    const notifications =
      load(
        KEYS.NOTIFICATIONS,
        []
      );

    const updated =
      notifications.map(
        (notification) =>
          String(
            notification.id
          ) ===
          String(id)
            ? {
                ...notification,
                status:
                  "Read",
              }
            : notification
      );

    save(
      KEYS.NOTIFICATIONS,
      updated
    );

    return {
      data: {
        success: true,
        message:
          "Notification marked as read",
      },
    };
  };

// ================================================================
// USER NOTIFICATION - MARK ALL READ
// ================================================================

export const markAllNotificationsRead =
  async () => {
    await wait();

    const notifications =
      load(
        KEYS.NOTIFICATIONS,
        []
      );

    const updated =
      notifications.map(
        (notification) => ({
          ...notification,
          status:
            "Read",
        })
      );

    save(
      KEYS.NOTIFICATIONS,
      updated
    );

    return {
      data: {
        success: true,
        message:
          "All notifications marked as read",
      },
    };
  };

