// ================================================================
// AdminMockApi.jsx
// ----------------------------------------------------------------
// ADMIN MOCK API ONLY
//
// No backend
// No axios
// No ngrok
// All admin demo data is stored in localStorage
// ================================================================


// ================================================================
// MOCK DELAY
// ================================================================

const DELAY = 300;

const wait = (ms = DELAY) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );


// ================================================================
// COMMON HELPERS
// ================================================================

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(
      `Unable to read ${key}:`,
      error
    );

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
      success: false,
      message,
    },
  };

  return error;
};


// ================================================================
// ID GENERATOR
// ================================================================

let idCounter = Date.now();

const nextId = (prefix = "admin") =>
  `${prefix}_${idCounter++}`;


// ================================================================
// STORAGE KEYS
// ================================================================

const ADMIN_KEYS = {
  PATIENTS:
    "demo_admin_patients",

  NOTIFICATIONS:
    "demo_admin_notifications",

  NOTIFICATION_STATS:
    "demo_admin_notification_stats",

  PROFILE:
    "demo_admin_profile",

  PASSWORD:
    "demo_admin_password",
};


// ================================================================
// FIXED ADMIN ACCOUNT
// ================================================================

export const ADMIN_ACCOUNT = {
  fullName:
    "Healthcare Admin",

  email:
    "admin@gmail.com",

  password:
    "Admin@123",

  role:
    "ADMIN",
};


// ================================================================
// DEFAULT ADMIN PROFILE
// ================================================================

const DEFAULT_ADMIN_PROFILE = {
  name:
    "Healthcare Admin",

  email:
    "admin@gmail.com",

  phone:
    "+91 98765 43210",

  role:
    "System Administrator",
};


// ================================================================
// PASSWORD HELPER
// ================================================================

const getStoredAdminPassword = () =>
  localStorage.getItem(
    ADMIN_KEYS.PASSWORD
  ) ||
  ADMIN_ACCOUNT.password;


// ================================================================
// PROFILE HELPER
// ================================================================

const loadAdminProfile = () => {
  let profile =
    read(
      ADMIN_KEYS.PROFILE,
      null
    );

  if (!profile) {
    profile = {
      ...DEFAULT_ADMIN_PROFILE,
    };

    write(
      ADMIN_KEYS.PROFILE,
      profile
    );
  }

  return profile;
};


// ================================================================
// ADMIN AUTH - LOGIN
// ================================================================

export const loginAdmin = async ({
  email,
  password,
}) => {
  await wait();

  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  const savedPassword =
    getStoredAdminPassword();

  if (
    normalizedEmail !==
      ADMIN_ACCOUNT.email.toLowerCase() ||
    password !== savedPassword
  ) {
    throw apiError(
      "Incorrect admin email or password"
    );
  }

  const profile =
    loadAdminProfile();

  const token =
    `admin-token-${Date.now()}`;

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
    "ADMIN"
  );

  localStorage.setItem(
    "currentUserName",
    profile.name ||
      ADMIN_ACCOUNT.fullName
  );

  return {
    data: {
      success: true,

      token,

      type:
        "Bearer",

      role:
        "ADMIN",

      fullName:
        profile.name ||
        ADMIN_ACCOUNT.fullName,

      email:
        ADMIN_ACCOUNT.email,

      message:
        "Admin login successful!",
    },
  };
};


// ================================================================
// ADMIN AUTH - LOGOUT
// ================================================================

export const logoutAdmin = () => {
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
        "Admin logged out successfully!",
    },
  };
};


// ================================================================
// ADMIN INFO
// Used by AdminDashboard navbar
// ================================================================

export const getAdminInfo = async () => {
  await wait();

  const profile =
    loadAdminProfile();

  const name =
    profile.name ||
    ADMIN_ACCOUNT.fullName;

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return {
    data: {
      success: true,

      name,

      fullName:
        name,

      email:
        profile.email ||
        ADMIN_ACCOUNT.email,

      role:
        "Admin",

      initials,
    },
  };
};


// ================================================================
// DASHBOARD - TOP CARDS
// ================================================================

export const getAdminDashboardCards =
  async (date = new Date()) => {
    await wait();

    const selectedDate =
      date instanceof Date
        ? date
        : new Date(date);

    const day =
      selectedDate.getDate();

    const seed =
      day % 10;

    const medicinesTaken =
      6 +
      (seed % 5);

    const medicinesMissed =
      2 +
      (seed % 3);

    const lowStockAlerts =
      1 +
      (seed % 4);

    const todaysMedicines =
      medicinesTaken +
      medicinesMissed;

    return {
      data: {
        todaysMedicines,

        medicinesTaken,

        medicinesMissed,

        lowStockAlerts,
      },
    };
  };


// ================================================================
// DASHBOARD - SUMMARY
// ================================================================

export const getAdminDailySummary =
  async (date = new Date()) => {
    await wait();

    const selectedDate =
      date instanceof Date
        ? date
        : new Date(date);

    const day =
      selectedDate.getDate();

    const base =
      day % 7;

    const lowStock =
      Math.max(
        0,
        3 -
          (day % 4)
      );

    const outOfStock =
      5 +
      (day % 6);

    return {
      data: {
        medicines:
          2 + base,

        taken:
          Math.max(
            1,
            2 +
              base -
              (day % 3)
          ),

        missed:
          Math.max(
            0,
            day % 3
          ),

        totalAlerts:
          lowStock +
          outOfStock,

        newPatients:
          2 +
          (day % 5),

        blockedPatients:
          1 +
          (day % 4),
      },
    };
  };


// ================================================================
// DASHBOARD - PATIENT STATUS
// ================================================================

export const getAdminPatientStatus =
  async (date = new Date()) => {
    await wait();

    const selectedDate =
      date instanceof Date
        ? date
        : new Date(date);

    const day =
      selectedDate.getDate();

    const active =
      8 +
      (day % 10);

    const inactive =
      3 +
      (day % 5);

    return {
      data: {
        active,

        inactive,

        total:
          active +
          inactive,
      },
    };
  };


// ================================================================
// DASHBOARD - ALERTS
// ================================================================

export const getAdminAlerts =
  async (date = new Date()) => {
    await wait();

    const selectedDate =
      date instanceof Date
        ? date
        : new Date(date);

    const day =
      selectedDate.getDate();

    const base =
      day % 5;

    return {
      data: {
        todayAlerts:
          base + 1,

        medicineAlerts:
          Math.max(
            1,
            base
          ),

        lowStockAlerts:
          Math.max(
            1,
            3 -
              (day % 4)
          ),

        outOfStockAlerts:
          5 +
          (day % 6),
      },
    };
  };


// ================================================================
// DASHBOARD - INVENTORY OVERVIEW
// ================================================================

export const getAdminInventoryOverview =
  async (date = new Date()) => {
    await wait();

    const selectedDate =
      date instanceof Date
        ? date
        : new Date(date);

    const day =
      selectedDate.getDate();

    const inStock =
      10 +
      (day % 10);

    const low =
      3 +
      (day % 5);

    const outOfStock =
      5 +
      (day % 6);

    const expired =
      6 +
      (day % 7);

    return {
      data: {
        inStock,

        low,

        outOfStock,

        expired,

        total:
          inStock +
          low +
          outOfStock +
          expired,
      },
    };
  };


// ================================================================
// DASHBOARD - COMPLETE DATA
// Used by AdminDashboard.jsx
// ================================================================

export const getAdminDashboardData =
  async (date = new Date()) => {
    const [
      cardsResponse,
      summaryResponse,
      patientResponse,
      alertsResponse,
      inventoryResponse,
    ] =
      await Promise.all([
        getAdminDashboardCards(
          date
        ),

        getAdminDailySummary(
          date
        ),

        getAdminPatientStatus(
          date
        ),

        getAdminAlerts(
          date
        ),

        getAdminInventoryOverview(
          date
        ),
      ]);

    return {
      data: {
        success: true,

        cards:
          cardsResponse.data,

        summary:
          summaryResponse.data,

        patientStatus:
          patientResponse.data,

        alerts:
          alertsResponse.data,

        inventory:
          inventoryResponse.data,
      },
    };
  };


// ================================================================
// DEFAULT ADMIN PATIENTS
// ================================================================

const DEFAULT_ADMIN_PATIENTS = [
  {
    id: 1,

    name:
      "Rahul Patil",

    email:
      "rahul.patil@email.com",

    phone:
      "+91 98765 43210",

    age:
      42,

    dob:
      "1984-01-12",

    gender:
      "Male",

    disease:
      "Diabetes",

    address:
      "Pune, Maharashtra",

    status:
      "Active",

    registered:
      "12 Jan 2026",

    lastLogin:
      "Today",
  },

  {
    id: 2,

    name:
      "Sneha Shah",

    email:
      "sneha.shah@email.com",

    phone:
      "+91 87654 32109",

    age:
      35,

    dob:
      "1991-05-18",

    gender:
      "Female",

    disease:
      "Hypertension",

    address:
      "Mumbai, Maharashtra",

    status:
      "Active",

    registered:
      "05 Feb 2026",

    lastLogin:
      "Today",
  },

  {
    id: 3,

    name:
      "Amit Joshi",

    email:
      "amit.joshi@email.com",

    phone:
      "+91 76543 21098",

    age:
      54,

    dob:
      "1972-09-10",

    gender:
      "Male",

    disease:
      "Diabetes",

    address:
      "Nashik, Maharashtra",

    status:
      "Blocked",

    registered:
      "18 Mar 2026",

    lastLogin:
      "2 Days Ago",
  },

  {
    id: 4,

    name:
      "Pooja Mehta",

    email:
      "pooja.mehta@email.com",

    phone:
      "+91 65432 10987",

    age:
      29,

    dob:
      "1997-03-22",

    gender:
      "Female",

    disease:
      "Allergy",

    address:
      "Surat, Gujarat",

    status:
      "Active",

    registered:
      "22 Apr 2026",

    lastLogin:
      "Yesterday",
  },

  {
    id: 5,

    name:
      "Vikram Singh",

    email:
      "vikram.singh@email.com",

    phone:
      "+91 54321 09876",

    age:
      48,

    dob:
      "1978-11-05",

    gender:
      "Male",

    disease:
      "Blood Pressure",

    address:
      "Delhi",

    status:
      "Active",

    registered:
      "10 May 2026",

    lastLogin:
      "Today",
  },

  {
    id: 6,

    name:
      "Neha Verma",

    email:
      "neha.verma@email.com",

    phone:
      "+91 43210 98765",

    age:
      38,

    dob:
      "1988-08-15",

    gender:
      "Female",

    disease:
      "Diabetes",

    address:
      "Indore, Madhya Pradesh",

    status:
      "Blocked",

    registered:
      "15 Jun 2026",

    lastLogin:
      "5 Days Ago",
  },

  {
    id: 7,

    name:
      "Rohit Kumar",

    email:
      "rohit.kumar@email.com",

    phone:
      "+91 32109 87654",

    age:
      31,

    dob:
      "1995-07-28",

    gender:
      "Male",

    disease:
      "Respiratory Infection",

    address:
      "Nagpur, Maharashtra",

    status:
      "Active",

    registered:
      "28 Jul 2026",

    lastLogin:
      "Yesterday",
  },
];


// ================================================================
// PATIENT HELPERS
// ================================================================

const loadAdminPatients = () => {
  let patients =
    read(
      ADMIN_KEYS.PATIENTS,
      null
    );

  if (!patients) {
    patients =
      DEFAULT_ADMIN_PATIENTS.map(
        (patient) => ({
          ...patient,
        })
      );

    write(
      ADMIN_KEYS.PATIENTS,
      patients
    );
  }

  return patients;
};


const saveAdminPatients = (
  patients
) => {
  write(
    ADMIN_KEYS.PATIENTS,
    patients
  );
};


// ================================================================
// PATIENTS - GET
// ================================================================

export const getAdminPatients =
  async () => {
    await wait();

    return {
      data: {
        success: true,

        patients:
          loadAdminPatients(),
      },
    };
  };


// ================================================================
// PATIENTS - STATS
// ================================================================

export const getAdminPatientStats =
  async () => {
    await wait();

    const patients =
      loadAdminPatients();

    const active =
      patients.filter(
        (patient) =>
          patient.status ===
          "Active"
      ).length;

    const blocked =
      patients.filter(
        (patient) =>
          patient.status ===
          "Blocked"
      ).length;

    return {
      data: {
        success: true,

        total:
          patients.length,

        active,

        blocked,
      },
    };
  };


// ================================================================
// PATIENTS - ADD
// ================================================================

export const addAdminPatient =
  async (payload = {}) => {
    await wait();

    const patients =
      loadAdminPatients();

    const email =
      String(
        payload.email || ""
      )
        .trim()
        .toLowerCase();

    const alreadyExists =
      patients.some(
        (patient) =>
          String(
            patient.email || ""
          )
            .trim()
            .toLowerCase() ===
          email
      );

    if (alreadyExists) {
      throw apiError(
        "A patient with this email already exists."
      );
    }

    const newPatient = {
      id:
        nextId("patient"),

      name:
        payload.name ||
        "",

      email,

      phone:
        payload.phone ||
        "",

      age:
        payload.age ||
        "",

      dob:
        payload.dob ||
        "",

      gender:
        payload.gender ||
        "",

      disease:
        payload.disease ||
        "",

      address:
        payload.address ||
        "",

      status:
        "Active",

      registered:
        new Date()
          .toLocaleDateString(
            "en-GB",
            {
              day:
                "2-digit",

              month:
                "short",

              year:
                "numeric",
            }
          ),

      lastLogin:
        "Never",
    };

    patients.unshift(
      newPatient
    );

    saveAdminPatients(
      patients
    );

    return {
      data: {
        success: true,

        message:
          "Patient added successfully!",

        patient:
          newPatient,
      },
    };
  };


// ================================================================
// PATIENTS - BLOCK / ACTIVATE
// ================================================================

export const toggleAdminPatientStatus =
  async (id) => {
    await wait();

    const patients =
      loadAdminPatients();

    const index =
      patients.findIndex(
        (patient) =>
          String(
            patient.id
          ) ===
          String(id)
      );

    if (index === -1) {
      throw apiError(
        "Patient not found"
      );
    }

    const newStatus =
      patients[index].status ===
      "Active"
        ? "Blocked"
        : "Active";

    patients[index] = {
      ...patients[index],

      status:
        newStatus,
    };

    saveAdminPatients(
      patients
    );

    return {
      data: {
        success: true,

        message:
          newStatus ===
          "Blocked"
            ? "Patient blocked successfully!"
            : "Patient activated successfully!",

        patient:
          patients[index],
      },
    };
  };


// ================================================================
// PATIENTS - DELETE
// ================================================================

export const deleteAdminPatient =
  async (id) => {
    await wait();

    const patients =
      loadAdminPatients();

    const exists =
      patients.some(
        (patient) =>
          String(
            patient.id
          ) ===
          String(id)
      );

    if (!exists) {
      throw apiError(
        "Patient not found"
      );
    }

    const updatedPatients =
      patients.filter(
        (patient) =>
          String(
            patient.id
          ) !==
          String(id)
      );

    saveAdminPatients(
      updatedPatients
    );

    return {
      data: {
        success: true,

        message:
          "Patient deleted successfully!",
      },
    };
  };


// ================================================================
// DEFAULT ADMIN NOTIFICATIONS
// ================================================================

const DEFAULT_ADMIN_NOTIFICATIONS = [
  {
    id:
      "an1",

    patient:
      "Shrushti Gorani",

    patientId:
      "PT-1042",

    medicine:
      "Paracetamol 500mg",

    message:
      "Time to take your 1:00 PM dose.",

    sentAt:
      "Today, 1:00 PM",

    status:
      "Delivered",

    createdAt:
      new Date().toISOString(),
  },

  {
    id:
      "an2",

    patient:
      "Kaveri Patil",

    patientId:
      "PT-1088",

    medicine:
      "Metformin 500mg",

    message:
      "Time to take your 1:00 PM dose.",

    sentAt:
      "Today, 1:00 PM",

    status:
      "Pending",

    createdAt:
      new Date(
        Date.now() -
          15 * 60 * 1000
      ).toISOString(),
  },

  {
    id:
      "an3",

    patient:
      "Sunita Deshmukh",

    patientId:
      "PT-1103",

    medicine:
      "Ibuprofen 400mg",

    message:
      "Time to take your 1:00 PM dose.",

    sentAt:
      "Today, 1:00 PM",

    status:
      "Delivered",

    createdAt:
      new Date(
        Date.now() -
          30 * 60 * 1000
      ).toISOString(),
  },

  {
    id:
      "an4",

    patient:
      "Sakshi Joshi",

    patientId:
      "PT-1071",

    medicine:
      "Loratadine 10mg",

    message:
      "Time to take your 1:00 PM dose.",

    sentAt:
      "Today, 1:00 PM",

    status:
      "Pending",

    createdAt:
      new Date(
        Date.now() -
          45 * 60 * 1000
      ).toISOString(),
  },

  {
    id:
      "an5",

    patient:
      "Arjun Shah",

    patientId:
      "PT-1119",

    medicine:
      "Amoxicillin 250mg",

    message:
      "Time to take your 1:00 PM dose.",

    sentAt:
      "Today, 1:00 PM",

    status:
      "Delivered",

    createdAt:
      new Date(
        Date.now() -
          60 * 60 * 1000
      ).toISOString(),
  },
];


// ================================================================
// DEFAULT NOTIFICATION STATS
// ================================================================

const DEFAULT_NOTIFICATION_STATS = {
  sentToday:
    248,

  delivered:
    231,

  pending:
    11,
};


// ================================================================
// NOTIFICATION HELPERS
// ================================================================

const loadAdminNotifications =
  () => {
    let notifications =
      read(
        ADMIN_KEYS.NOTIFICATIONS,
        null
      );

    if (!notifications) {
      notifications =
        DEFAULT_ADMIN_NOTIFICATIONS.map(
          (notification) => ({
            ...notification,
          })
        );

      write(
        ADMIN_KEYS.NOTIFICATIONS,
        notifications
      );
    }

    return notifications;
  };


const saveAdminNotifications =
  (notifications) => {
    write(
      ADMIN_KEYS.NOTIFICATIONS,
      notifications
    );
  };


const loadNotificationStats =
  () => {
    let stats =
      read(
        ADMIN_KEYS.NOTIFICATION_STATS,
        null
      );

    if (!stats) {
      stats = {
        ...DEFAULT_NOTIFICATION_STATS,
      };

      write(
        ADMIN_KEYS.NOTIFICATION_STATS,
        stats
      );
    }

    return stats;
  };


const saveNotificationStats =
  (stats) => {
    write(
      ADMIN_KEYS.NOTIFICATION_STATS,
      stats
    );
  };


// ================================================================
// NOTIFICATIONS - GET
// ================================================================

export const getAdminNotifications =
  async () => {
    await wait();

    return {
      data: {
        success: true,

        notifications:
          loadAdminNotifications(),
      },
    };
  };


// ================================================================
// NOTIFICATIONS - STATS
// ================================================================

export const getAdminNotificationStats =
  async () => {
    await wait();

    const stats =
      loadNotificationStats();

    return {
      data: {
        success: true,

        sentToday:
          Number(
            stats.sentToday
          ) || 0,

        delivered:
          Number(
            stats.delivered
          ) || 0,

        pending:
          Number(
            stats.pending
          ) || 0,
      },
    };
  };


// ================================================================
// NOTIFICATIONS - ADD
// ================================================================

export const addAdminNotification =
  async (payload = {}) => {
    await wait();

    const notifications =
      loadAdminNotifications();

    const status =
      payload.status ||
      "Pending";

    const newNotification = {
      id:
        nextId(
          "notification"
        ),

      patient:
        payload.patient ||
        "Unknown Patient",

      patientId:
        payload.patientId ||
        `PT-${Date.now()
          .toString()
          .slice(-4)}`,

      medicine:
        payload.medicine ||
        "Medicine",

      message:
        payload.message ||
        "Medicine reminder notification.",

      sentAt:
        payload.sentAt ||
        "Just now",

      status,

      createdAt:
        new Date()
          .toISOString(),
    };

    notifications.unshift(
      newNotification
    );

    saveAdminNotifications(
      notifications
    );

    const stats =
      loadNotificationStats();

    const updatedStats = {
      ...stats,

      sentToday:
        (Number(
          stats.sentToday
        ) || 0) + 1,

      delivered:
        (Number(
          stats.delivered
        ) || 0) +
        (
          status ===
          "Delivered"
            ? 1
            : 0
        ),

      pending:
        (Number(
          stats.pending
        ) || 0) +
        (
          status ===
          "Pending"
            ? 1
            : 0
        ),
    };

    saveNotificationStats(
      updatedStats
    );

    return {
      data: {
        success: true,

        message:
          "Notification added successfully!",

        notification:
          newNotification,

        stats:
          updatedStats,
      },
    };
  };


// ================================================================
// NOTIFICATIONS - UPDATE STATUS
// ================================================================

export const updateAdminNotificationStatus =
  async (
    id,
    status
  ) => {
    await wait();

    const notifications =
      loadAdminNotifications();

    const index =
      notifications.findIndex(
        (notification) =>
          String(
            notification.id
          ) ===
          String(id)
      );

    if (index === -1) {
      throw apiError(
        "Notification not found"
      );
    }

    const previousStatus =
      notifications[index].status;

    notifications[index] = {
      ...notifications[index],

      status,
    };

    saveAdminNotifications(
      notifications
    );

    const stats =
      loadNotificationStats();

    let delivered =
      Number(
        stats.delivered
      ) || 0;

    let pending =
      Number(
        stats.pending
      ) || 0;

    if (
      previousStatus ===
      "Delivered"
    ) {
      delivered =
        Math.max(
          0,
          delivered - 1
        );
    }

    if (
      previousStatus ===
      "Pending"
    ) {
      pending =
        Math.max(
          0,
          pending - 1
        );
    }

    if (
      status ===
      "Delivered"
    ) {
      delivered += 1;
    }

    if (
      status ===
      "Pending"
    ) {
      pending += 1;
    }

    const updatedStats = {
      ...stats,
      delivered,
      pending,
    };

    saveNotificationStats(
      updatedStats
    );

    return {
      data: {
        success: true,

        message:
          "Notification status updated successfully!",

        notification:
          notifications[index],

        stats:
          updatedStats,
      },
    };
  };


// ================================================================
// NOTIFICATIONS - DELETE
// ================================================================

export const deleteAdminNotification =
  async (id) => {
    await wait();

    const notifications =
      loadAdminNotifications();

    const notification =
      notifications.find(
        (item) =>
          String(
            item.id
          ) ===
          String(id)
      );

    if (!notification) {
      throw apiError(
        "Notification not found"
      );
    }

    const updatedNotifications =
      notifications.filter(
        (item) =>
          String(
            item.id
          ) !==
          String(id)
      );

    saveAdminNotifications(
      updatedNotifications
    );

    return {
      data: {
        success: true,

        message:
          "Notification deleted successfully!",
      },
    };
  };


// ================================================================
// ADMIN REPORT MOCK DATA
// ================================================================

const DEFAULT_ADMIN_REPORTS = {
  "Rahul Patil": [
    {
      id:
        "rep_rahul_1",

      date:
        "2026-07-05",

      medicine:
        "Metformin 500mg",

      scheduledTime:
        "09:00 AM",

      takenTime:
        "09:05 AM",

      status:
        "Taken",

      remarks:
        "Taken on time",
    },

    {
      id:
        "rep_rahul_2",

      date:
        "2026-07-05",

      medicine:
        "Amlodipine 5mg",

      scheduledTime:
        "08:00 PM",

      takenTime:
        "08:10 PM",

      status:
        "Taken",

      remarks:
        "Taken successfully",
    },

    {
      id:
        "rep_rahul_3",

      date:
        "2026-07-06",

      medicine:
        "Metformin 500mg",

      scheduledTime:
        "09:00 AM",

      takenTime:
        "",

      status:
        "Missed",

      remarks:
        "Dose missed",
    },
  ],


  "Sneha Shah": [
    {
      id:
        "rep_sneha_1",

      date:
        "2026-07-08",

      medicine:
        "Paracetamol 500mg",

      scheduledTime:
        "01:00 PM",

      takenTime:
        "01:04 PM",

      status:
        "Taken",

      remarks:
        "Taken on time",
    },

    {
      id:
        "rep_sneha_2",

      date:
        "2026-07-09",

      medicine:
        "Vitamin D",

      scheduledTime:
        "10:00 AM",

      takenTime:
        "10:15 AM",

      status:
        "Taken",

      remarks:
        "Taken successfully",
    },
  ],


  "Amit Joshi": [
    {
      id:
        "rep_amit_1",

      date:
        "2026-07-10",

      medicine:
        "Metformin 500mg",

      scheduledTime:
        "08:30 AM",

      takenTime:
        "",

      status:
        "Missed",

      remarks:
        "Patient missed dose",
    },

    {
      id:
        "rep_amit_2",

      date:
        "2026-07-11",

      medicine:
        "Atorvastatin 10mg",

      scheduledTime:
        "09:00 PM",

      takenTime:
        "09:12 PM",

      status:
        "Taken",

      remarks:
        "Taken successfully",
    },
  ],


  "Pooja Mehta": [
    {
      id:
        "rep_pooja_1",

      date:
        "2026-07-12",

      medicine:
        "Cetirizine 10mg",

      scheduledTime:
        "09:00 PM",

      takenTime:
        "09:02 PM",

      status:
        "Taken",

      remarks:
        "Taken on time",
    },

    {
      id:
        "rep_pooja_2",

      date:
        "2026-07-13",

      medicine:
        "Paracetamol 500mg",

      scheduledTime:
        "02:00 PM",

      takenTime:
        "",

      status:
        "Missed",

      remarks:
        "Dose not confirmed",
    },
  ],


  "Vikram Singh": [
    {
      id:
        "rep_vikram_1",

      date:
        "2026-07-15",

      medicine:
        "Amlodipine 5mg",

      scheduledTime:
        "08:00 AM",

      takenTime:
        "08:08 AM",

      status:
        "Taken",

      remarks:
        "Taken successfully",
    },
  ],


  "Neha Verma": [
    {
      id:
        "rep_neha_1",

      date:
        "2026-07-18",

      medicine:
        "Metformin 500mg",

      scheduledTime:
        "09:30 AM",

      takenTime:
        "",

      status:
        "Missed",

      remarks:
        "Medicine missed",
    },
  ],


  "Rohit Kumar": [
    {
      id:
        "rep_rohit_1",

      date:
        "2026-07-20",

      medicine:
        "Amoxicillin 250mg",

      scheduledTime:
        "01:00 PM",

      takenTime:
        "01:07 PM",

      status:
        "Taken",

      remarks:
        "Taken successfully",
    },

    {
      id:
        "rep_rohit_2",

      date:
        "2026-07-21",

      medicine:
        "Amoxicillin 250mg",

      scheduledTime:
        "09:00 PM",

      takenTime:
        "09:03 PM",

      status:
        "Taken",

      remarks:
        "Taken on time",
    },
  ],
};


// ================================================================
// REPORT - PATIENT LIST
// ================================================================

export const getAdminReportPatients =
  async () => {
    await wait();

    const patients =
      loadAdminPatients();

    return {
      data: {
        success: true,

        patients:
          patients.map(
            (patient) => ({
              id:
                patient.id,

              name:
                patient.name,
            })
          ),
      },
    };
  };


// ================================================================
// REPORT - GET REPORT DATA
// ================================================================

export const getAdminPatientReport =
  async ({
    patientName = "",
    fromDate = "",
    toDate = "",
    reportType = "monthly",
  } = {}) => {
    await wait();

    const normalizedPatient =
      String(
        patientName || ""
      ).trim();

    // --------------------------------------------------------
    // SELECT PATIENT
    // --------------------------------------------------------

    const selectedReports =
      normalizedPatient
        ? DEFAULT_ADMIN_REPORTS[
            normalizedPatient
          ] || []
        : Object.values(
            DEFAULT_ADMIN_REPORTS
          ).flat();

    // --------------------------------------------------------
    // DATE FILTER
    // --------------------------------------------------------

    const reportData =
      selectedReports.filter(
        (item) => {
          if (
            fromDate &&
            item.date <
              fromDate
          ) {
            return false;
          }

          if (
            toDate &&
            item.date >
              toDate
          ) {
            return false;
          }

          return true;
        }
      );

    return {
      data: {
        success: true,

        reportType,

        reports:
          reportData,
      },
    };
  };


// ================================================================
// DEFAULT ADMIN ACTIVITIES
// ================================================================

const DEFAULT_ADMIN_ACTIVITIES = [
  {
    id:
      "activity_1",

    action:
      "Generated patient health report for Rahul Patil",

    time:
      "2 hours ago",

    type:
      "report",
  },

  {
    id:
      "activity_2",

    action:
      "Managed patient records for 5 patients",

    time:
      "4 hours ago",

    type:
      "manage",
  },

  {
    id:
      "activity_3",

    action:
      "Reviewed patient profile for Vikram Singh",

    time:
      "6 hours ago",

    type:
      "update",
  },

  {
    id:
      "activity_4",

    action:
      "Added new patient: Rahul Patil",

    time:
      "1 day ago",

    type:
      "patient",
  },

  {
    id:
      "activity_5",

    action:
      "Generated monthly report for all patients",

    time:
      "2 days ago",

    type:
      "report",
  },
];


// ================================================================
// ADMIN PROFILE - GET
// ================================================================

export const getAdminProfile =
  async () => {
    await wait();

    const profile =
      loadAdminProfile();

    return {
      data: {
        success: true,

        profile,
      },
    };
  };


// ================================================================
// ADMIN PROFILE - UPDATE
// ================================================================

export const updateAdminProfile =
  async (payload = {}) => {
    await wait();

    const currentProfile =
      loadAdminProfile();

    const updatedProfile = {
      ...currentProfile,

      // Editable
      name:
        payload.name ??
        currentProfile.name,

      phone:
        payload.phone ??
        currentProfile.phone,

      // Fixed
      email:
        ADMIN_ACCOUNT.email,

      role:
        currentProfile.role ||
        "System Administrator",
    };

    write(
      ADMIN_KEYS.PROFILE,
      updatedProfile
    );

    localStorage.setItem(
      "currentUserName",
      updatedProfile.name
    );

    return {
      data: {
        success: true,

        message:
          "Profile updated successfully.",

        profile:
          updatedProfile,
      },
    };
  };


// ================================================================
// ADMIN PROFILE - RECENT ACTIVITIES
// ================================================================

export const getAdminRecentActivities =
  async () => {
    await wait();

    return {
      data: {
        success: true,

        activities:
          DEFAULT_ADMIN_ACTIVITIES,
      },
    };
  };


// ================================================================
// ADMIN PASSWORD - CHANGE
// ================================================================

export const changeAdminPassword =
  async ({
    currentPassword,
    newPassword,
  }) => {
    await wait();

    const savedPassword =
      getStoredAdminPassword();

    if (
      currentPassword !==
      savedPassword
    ) {
      throw apiError(
        "Current password is incorrect."
      );
    }

    if (!newPassword) {
      throw apiError(
        "New password is required."
      );
    }

    if (
      newPassword.length <
      6
    ) {
      throw apiError(
        "New password must be at least 6 characters long."
      );
    }

    if (
      newPassword ===
      currentPassword
    ) {
      throw apiError(
        "New password must be different from current password."
      );
    }

    localStorage.setItem(
      ADMIN_KEYS.PASSWORD,
      newPassword
    );

    return {
      data: {
        success: true,

        message:
          "Password changed successfully.",
      },
    };
  };


// ================================================================
// RESET ADMIN MOCK DATA
// Optional helper for testing
// ================================================================

export const resetAdminMockData =
  async () => {
    await wait();

    write(
      ADMIN_KEYS.PATIENTS,
      DEFAULT_ADMIN_PATIENTS.map(
        (patient) => ({
          ...patient,
        })
      )
    );

    write(
      ADMIN_KEYS.NOTIFICATIONS,
      DEFAULT_ADMIN_NOTIFICATIONS.map(
        (notification) => ({
          ...notification,
        })
      )
    );

    write(
      ADMIN_KEYS.NOTIFICATION_STATS,
      {
        ...DEFAULT_NOTIFICATION_STATS,
      }
    );

    write(
      ADMIN_KEYS.PROFILE,
      {
        ...DEFAULT_ADMIN_PROFILE,
      }
    );

    localStorage.removeItem(
      ADMIN_KEYS.PASSWORD
    );

    return {
      data: {
        success: true,

        message:
          "Admin mock data reset successfully.",
      },
    };
  };
