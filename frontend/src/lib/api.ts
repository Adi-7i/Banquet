import axios from "axios";

// Base URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Create axios instance
export const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // If using cookies/sessions
});

// Request interceptor: Attach token
api.interceptors.request.use(
    (config) => {
        // Check if we have a token in localStorage (or your preferred storage)
        // Note: ideally use a cohesive auth hook to manage this
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle 401s
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Handle token refresh logic here if needed
            // For now, we might just redirect to login or clear storage
            // In a real app, try to refresh token:
            /*
            try {
              const refreshToken = localStorage.getItem("refreshToken");
              const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
              localStorage.setItem("accessToken", data.accessToken);
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              return api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout
            }
            */

            if (typeof window !== "undefined") {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                // Optional: Redirect to login
                window.location.href = "/login";
            }
        }

        // Normalize error message
        const message = error.response?.data?.message || error.message || "Something went wrong";

        // You might want to throw a custom error object or just the axios error
        // Attaching the message to the error object for easier access
        error.formattedMessage = Array.isArray(message) ? message[0] : message;

        return Promise.reject(error);
    }
);
