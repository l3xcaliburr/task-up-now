import axios from "axios";

// Replace with your actual API endpoint from CDK deployment
const API_URL = "https://4yxnjzum6h.execute-api.us-east-1.amazonaws.com/prod/";

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // In a real app, you would include authentication headers here
    Authorization: "demo-user",
  },
});

export const getTasks = async () => {
  const response = await api.get("/tasks");
  return response.data;
};

export const getTask = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (taskData: any) => {
  const response = await api.post("/tasks", taskData);
  return response.data;
};

export const updateTask = async (taskId: string, taskData: any) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId: string) => {
  await api.delete(`/tasks/${taskId}`);
};

export const uploadImage = async (uploadUrl: string, file: File) => {
  try {
    console.log("Uploading image to S3...");

    // Use fetch API directly instead of axios
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from S3:", errorText);
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    console.log("Image upload successful");
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const processImage = async (taskId: string) => {
  const response = await api.post(`/tasks/${taskId}/process-image`);
  return response.data;
};
