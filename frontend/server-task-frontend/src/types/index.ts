export interface Task {
  taskId: string;
  userId: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  imageKey?: string;
  imageUrl?: string;
  imageLabels?: string[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  hasImage?: boolean;
  filename?: string;
  fileType?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: Task["status"];
  hasNewImage?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface TaskListProps {
  tasks?: Task[];
  onTaskUpdate?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
}

export interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface UIState {
  loading: LoadingState;
  error: string | null;
}
