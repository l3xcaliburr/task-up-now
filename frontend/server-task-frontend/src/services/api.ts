import axios, { AxiosInstance, AxiosResponse } from "axios";
import { Task, CreateTaskRequest, UpdateTaskRequest } from "../types";

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001"; // Default to local development

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config) => {
    // In production, this should get a real JWT token from authentication
    // For demo purposes, we'll use a session-based identifier
    const demoUserId =
      localStorage.getItem("demo-user-id") ||
      `demo-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("demo-user-id", demoUserId);
    config.headers.Authorization = demoUserId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // You can handle specific error codes here
    if (error.response?.status === 401) {
      // Handle unauthorized access
      // For example, redirect to login
    }

    return Promise.reject(error);
  }
);

// API Functions
export const getTasks = async (): Promise<Task[]> => {
  try {
    const response = await apiClient.get<Task[]>("/tasks");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    throw new Error(
      "Failed to load tasks. Please check your connection and try again."
    );
  }
};

export const getTask = async (taskId: string): Promise<Task> => {
  try {
    const response = await apiClient.get<Task>(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch task ${taskId}:`, error);
    throw new Error("Failed to load task details. Please try again.");
  }
};

export const createTask = async (
  taskData: CreateTaskRequest
): Promise<Task & { imageUploadUrl?: string }> => {
  try {
    const response = await apiClient.post<Task & { imageUploadUrl?: string }>(
      "/tasks",
      taskData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create task:", error);
    throw new Error(
      "Failed to create task. Please check your input and try again."
    );
  }
};

export const updateTask = async (
  taskId: string,
  taskData: UpdateTaskRequest
): Promise<Task & { imageUploadUrl?: string }> => {
  try {
    const response = await apiClient.put<Task & { imageUploadUrl?: string }>(
      `/tasks/${taskId}`,
      taskData
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update task ${taskId}:`, error);
    throw new Error("Failed to update task. Please try again.");
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await apiClient.delete(`/tasks/${taskId}`);
  } catch (error) {
    console.error(`Failed to delete task ${taskId}:`, error);
    throw new Error("Failed to delete task. Please try again.");
  }
};

export const uploadImage = async (
  uploadUrl: string,
  file: File
): Promise<void> => {
  try {
    console.log("Uploading image to S3...", {
      fileName: file.name,
      size: file.size,
    });

    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("S3 upload error response:", errorText);
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    console.log("Image upload successful");
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
};

export const processImage = async (taskId: string): Promise<Task> => {
  try {
    const response = await apiClient.post<Task>(
      `/tasks/${taskId}/process-image`
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to process image for task ${taskId}:`, error);
    // Don't throw here as image processing is not critical
    console.warn("Image processing failed, but task was created successfully");
    throw error;
  }
};

// Utility function to check if API is healthy
export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get("/health");
    return true;
  } catch {
    return false;
  }
};

export default apiClient;
