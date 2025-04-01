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
} from "@mui/material";
import { format } from "date-fns";
import { getTask, updateTask, uploadImage } from "../services/api";
import { SelectChangeEvent } from "@mui/material/Select";

interface Task {
  taskId: string;
  title: string;
  description: string;
  status: string;
  dueDate?: string;
  imageUrl?: string;
  imageKey?: string;
  imageLabels?: string[];
  imageUploadUrl?: string;
}

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    status: "",
    dueDate: "",
  });

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId]);

  const fetchTask = async (id: string) => {
    try {
      setLoading(true);
      const data = await getTask(id);
      setTask(data);
      setFormValues({
        title: data.title,
        description: data.description || "",
        status: data.status,
        dueDate:
          data.dueDate && !isNaN(Date.parse(data.dueDate))
            ? format(new Date(data.dueDate), "yyyy-MM-dd")
            : "",
      });
    } catch (err) {
      setError("Failed to load task details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name as string]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !task) return;

    try {
      setSaving(true);

      const updatedTask = await updateTask(taskId, {
        ...formValues,
        hasNewImage: !!selectedFile,
        filename: selectedFile?.name,
      });

      // If there's a new file to upload and we got an upload URL
      if (selectedFile && updatedTask.imageUploadUrl) {
        await uploadImage(updatedTask.imageUploadUrl, selectedFile);
      }

      setTask(updatedTask);
      setError("");
      navigate("/");
    } catch (err) {
      setError("Failed to update task. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Task not found</Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{ mt: 2 }}
        >
          Back to Tasks
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Task
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formValues.title}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formValues.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formValues.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="inProgress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Due Date"
            name="dueDate"
            type="date"
            value={formValues.dueDate}
            onChange={handleChange}
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Task Image
            </Typography>

            {task.imageUrl && (
              <Box mb={2}>
                <img
                  src={task.imageUrl}
                  alt="Task attachment"
                  style={{ maxWidth: "100%", maxHeight: "300px" }}
                />

                {task.imageLabels && task.imageLabels.length > 0 && (
                  <Box mt={1}>
                    {task.imageLabels.map((label) => (
                      <Chip
                        key={label}
                        label={label}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            <Button variant="outlined" component="label">
              {task.imageUrl ? "Change Image" : "Add Image"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>

            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                New file selected: {selectedFile.name}
              </Typography>
            )}
          </Box>

          <Box mt={3} display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default TaskDetail;
