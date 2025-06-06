import { format, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";

export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return "Today";
    } else if (isTomorrow(date)) {
      return "Tomorrow";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d, yyyy");
    }
  } catch {
    return "Invalid date";
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy • h:mm a");
  } catch {
    return "Invalid date";
  }
};

export const getStatusColor = (
  status: string
): "default" | "primary" | "secondary" | "success" | "warning" | "error" => {
  switch (status) {
    case "completed":
      return "success";
    case "in-progress":
      return "warning";
    case "pending":
      return "default";
    default:
      return "default";
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "pending":
      return "Pending";
    case "in-progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
