import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

// =========================================================
// PUBLIC ENDPOINTS
// In requests ke liye Bearer token nahi bhejna
// =========================================================

const PUBLIC_ENDPOINTS = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/verify-email",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// =========================================================
// REQUEST INTERCEPTOR
// =========================================================

api.interceptors.request.use(
  (config) => {
    const requestUrl = config.url || "";

    const isPublicEndpoint =
      PUBLIC_ENDPOINTS.some((endpoint) =>
        requestUrl.includes(endpoint)
      );

    // Public auth endpoint hai to Authorization hata do
    if (isPublicEndpoint) {
      if (config.headers) {
        delete config.headers.Authorization;
      }

      return config;
    }

    // Protected APIs ke liye token bhejo
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

// =========================================================
// RESPONSE INTERCEPTOR
// =========================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const requestUrl =
      error.config?.url || "";

    const isPublicEndpoint =
      PUBLIC_ENDPOINTS.some((endpoint) =>
        requestUrl.includes(endpoint)
      );

    // Sirf protected API par 401 aaye tab login clear karo
    if (
      error.response?.status === 401 &&
      !isPublicEndpoint
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userRole");
      localStorage.removeItem("currentUserName");
    }

    return Promise.reject(error);
  }
);

export default api;