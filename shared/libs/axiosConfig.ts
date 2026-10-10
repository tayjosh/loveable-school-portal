import axios, { HttpStatusCode } from "axios";
import { handleError } from "./errorHandler";
import { storage } from "./storage";
import { toast } from "sonner";

const axiosInstance = axios.create({
  // Fallback to localhost backend in development when NEXT_PUBLIC_API_URL isn't set
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = "application/json";
    config.headers["Access-Control-Allow-Origin"] = "*";
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  async (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    // For validation errors, return the original error
    if (status === HttpStatusCode.UnprocessableEntity) {
      return Promise.reject(error);
    }

    // Check for "Invalid token" error with status code 417
    if (
      status === 417 &&
      responseData?.message === "Invalid token" &&
      typeof window !== "undefined"
    ) {
      // Token is invalid, logout the user immediately
      storage.removeToken();
      toast.error("Your session has expired. Please login again.");

      // Redirect to login page
      window.location.href = "/sign-in";

      // Return the original error to prevent further processing
      return Promise.reject(error);
    }

    switch (status) {
      // case HttpStatusCode.Unauthorized:
      //   if (typeof window !== "undefined") {
      //     storage.removeToken();
      //     // window.location.href = "/sign-in";
      //   }
      //   break;
      // Removed automatic redirect for 403 errors to allow components to handle specific cases
      // like "Email not verified" without page refresh
      default:
        break;
    }

    // Handle error display and logging for non-validation errors
    const standardError = handleError(error);

    return Promise.reject(standardError);
  },
);

export default axiosInstance;
