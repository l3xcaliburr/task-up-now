import { useState, useEffect, useCallback } from "react";
import {
  Task,
  LoadingState,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "../types";
import * as api from "../services/api";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading("loading");
      setError(null);
      const data = await api.getTasks();
      setTasks(data);
      setLoading("success");
    } catch (err) {
      setError("Failed to load tasks. Please try again.");
      setLoading("error");
      console.error("Error fetching tasks:", err);
    }
  }, []);

  const createTask = useCallback(
    async (taskData: CreateTaskRequest, file?: File) => {
      try {
        setLoading("loading");
        setError(null);

        const newTask = await api.createTask(taskData);

        // Handle file upload if present
        if (file && newTask.imageUploadUrl) {
          await api.uploadImage(newTask.imageUploadUrl, file);

          // Trigger image processing
          try {
            await api.processImage(newTask.taskId);
          } catch (processError) {
            console.warn("Image processing failed:", processError);
          }
        }

        // Refresh task list
        await fetchTasks();
        setLoading("success");
        return newTask;
      } catch (err) {
        setError("Failed to create task. Please try again.");
        setLoading("error");
        console.error("Error creating task:", err);
        throw err;
      }
    },
    [fetchTasks]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: UpdateTaskRequest, file?: File) => {
      try {
        setLoading("loading");
        setError(null);

        const updatedTask = await api.updateTask(taskId, updates);

        // Handle new file upload if present
        if (file && updatedTask.imageUploadUrl) {
          await api.uploadImage(updatedTask.imageUploadUrl, file);

          // Trigger image processing
          try {
            await api.processImage(taskId);
          } catch (processError) {
            console.warn("Image processing failed:", processError);
          }
        }

        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.taskId === taskId ? { ...task, ...updatedTask } : task
          )
        );
        setLoading("success");
        return updatedTask;
      } catch (err) {
        setError("Failed to update task. Please try again.");
        setLoading("error");
        console.error("Error updating task:", err);
        throw err;
      }
    },
    []
  );

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setLoading("loading");
      setError(null);

      await api.deleteTask(taskId);

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.taskId !== taskId)
      );
      setLoading("success");
    } catch (err) {
      setError("Failed to delete task. Please try again.");
      setLoading("error");
      console.error("Error deleting task:", err);
      throw err;
    }
  }, []);

  const toggleTaskStatus = useCallback(
    async (task: Task) => {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      return updateTask(task.taskId, { status: newStatus });
    },
    [updateTask]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    clearError,
  };
};
