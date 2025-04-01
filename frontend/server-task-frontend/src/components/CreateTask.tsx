import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { createTask, uploadImage } from "../services/api";

const CreateTask = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
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

    try {
      setSaving(true);

      const newTask = await createTask({
        ...formValues,
        hasImage: !!selectedFile,
        filename: selectedFile?.name,
      });

      // If there's a file to upload and we got an upload URL
      if (selectedFile && newTask.imageUploadUrl) {
        await uploadImage(newTask.imageUploadUrl, selectedFile);
      }

      setError("");
      navigate("/");
    } catch (err) {
      setError("Failed to create task. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Task
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
              Task Image (Optional)
            </Typography>

            <Button variant="outlined" component="label">
              Select Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>

            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                File selected: {selectedFile.name}
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
              {saving ? <CircularProgress size={24} /> : "Create Task"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateTask;
