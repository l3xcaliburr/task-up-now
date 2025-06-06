import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Fade,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Cancel as CancelIcon,
  ZoomIn as ZoomIcon,
  Label as LabelIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Task, UpdateTaskRequest } from "../../types";
import { getTask } from "../../services/api";
import { useTasks } from "../../hooks/useTasks";
import {
  formatDateTime,
  getStatusColor,
  getStatusLabel,
} from "../../utils/formatters";

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { updateTask, deleteTask, loading, error } = useTasks();

  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [taskLoading, setTaskLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as Task["status"],
    dueDate: "",
  });

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId]);

  const fetchTask = async (id: string) => {
    try {
      setTaskLoading(true);
      const data = await getTask(id);
      setTask(data);
      setFormData({
        title: data.title,
        description: data.description || "",
        status: data.status,
        dueDate: data.dueDate ? data.dueDate.split("T")[0] : "",
      });
    } catch (err) {
      console.error("Failed to load task details:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSave = async () => {
    if (!taskId || !task) return;

    try {
      const updateData: UpdateTaskRequest = {
        ...formData,
        hasNewImage: !!selectedFile,
        filename: selectedFile?.name,
        fileType: selectedFile?.type,
      };

      const updatedTask = await updateTask(
        taskId,
        updateData,
        selectedFile || undefined
      );
      setTask({ ...task, ...updatedTask });
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDelete = async () => {
    if (
      !taskId ||
      !window.confirm("Are you sure you want to delete this task?")
    )
      return;

    try {
      await deleteTask(taskId);
      navigate("/");
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleCancel = () => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      });
    }
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (taskLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <Box textAlign="center">
            <CircularProgress size={48} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading task details...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!task) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Task not found or failed to load
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate("/")}
        >
          Back to Tasks
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/")}
          sx={{ mb: 2 }}
        >
          Back to Tasks
        </Button>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {isEditing ? "Edit Task" : "Task Details"}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {isEditing
                ? "Make changes to your task"
                : "View and manage task information"}
            </Typography>
          </Box>

          {!isEditing && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Fade in={Boolean(error)}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        </Fade>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            {isEditing ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  required
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  multiline
                  rows={4}
                />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={handleInputChange("status")}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleInputChange("dueDate")}
                    sx={{ flex: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* File Upload Section */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Update Image Attachment
                  </Typography>

                  {!selectedFile ? (
                    <Paper
                      sx={{
                        p: 3,
                        textAlign: "center",
                        backgroundColor: "grey.50",
                        border: "2px dashed",
                        borderColor: "grey.300",
                        borderRadius: 2,
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "primary.main",
                          backgroundColor: "primary.50",
                        },
                      }}
                      component="label"
                    >
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <UploadIcon
                        sx={{ fontSize: 40, color: "grey.400", mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Click to upload a new image
                      </Typography>
                    </Paper>
                  ) : (
                    <Card sx={{ maxWidth: 300 }}>
                      <Box sx={{ position: "relative" }}>
                        <img
                          src={previewUrl!}
                          alt="Preview"
                          style={{
                            width: "100%",
                            height: 150,
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          onClick={removeFile}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            backgroundColor: "rgba(0,0,0,0.7)",
                            color: "white",
                            "&:hover": {
                              backgroundColor: "rgba(0,0,0,0.8)",
                            },
                          }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          {selectedFile.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Box>

                <Divider />

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                >
                  <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading === "loading"}
                    startIcon={
                      loading === "loading" ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                  >
                    {loading === "loading" ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {task.title}
                </Typography>

                {task.description && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.6 }}
                  >
                    {task.description}
                  </Typography>
                )}

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
                  <Chip
                    label={getStatusLabel(task.status)}
                    color={getStatusColor(task.status)}
                    sx={{ fontWeight: 500 }}
                  />

                  {task.dueDate && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <CalendarIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {task.imageLabels && task.imageLabels.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <LabelIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        AI-Generated Labels
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {task.imageLabels.map((label, index) => (
                        <Chip
                          key={index}
                          label={label}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="caption" color="text.secondary">
                  Created: {formatDateTime(task.createdAt)}
                  {task.updatedAt !== task.createdAt && (
                    <> • Updated: {formatDateTime(task.updatedAt)}</>
                  )}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { xs: "100%", md: "300px" }, flexShrink: 0 }}>
          {task.imageUrl && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                Attachment
              </Typography>
              <Card
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: 4,
                  },
                  transition: "all 0.2s ease-in-out",
                }}
                onClick={() => setImageDialogOpen(true)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={task.imageUrl}
                  alt="Task attachment"
                  sx={{ objectFit: "cover" }}
                />
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ZoomIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to view full size
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {task.imageUrl && (
            <img
              src={task.imageUrl}
              alt="Task attachment"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default TaskDetail;
