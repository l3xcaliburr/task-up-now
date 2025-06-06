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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Fade,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useTasks } from "../../hooks/useTasks";
import { CreateTaskRequest } from "../../types";

interface FormData extends CreateTaskRequest {
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
}

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { createTask, loading, error } = useTasks();

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    dueDate: "",
    status: "pending",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const steps = ["Task Details", "Attachment (Optional)", "Review & Create"];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
    }

    if (formData.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        errors.dueDate = "Due date cannot be in the past";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange =
    (field: keyof FormData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
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

  const handleNext = () => {
    if (activeStep === 0 && !validateForm()) {
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const taskData: CreateTaskRequest = {
        ...formData,
        hasImage: !!selectedFile,
        filename: selectedFile?.name,
        fileType: selectedFile?.type,
      };

      await createTask(taskData, selectedFile || undefined);
      navigate("/");
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              label="Task Title"
              value={formData.title}
              onChange={handleInputChange("title")}
              error={!!validationErrors.title}
              helperText={
                validationErrors.title ||
                `${formData.title.length}/100 characters`
              }
              placeholder="What needs to be done?"
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleInputChange("description")}
              error={!!validationErrors.description}
              helperText={
                validationErrors.description ||
                `${formData.description.length}/500 characters`
              }
              placeholder="Add more details about this task..."
              multiline
              rows={4}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange("dueDate")}
                error={!!validationErrors.dueDate}
                helperText={validationErrors.dueDate}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />

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
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add an Image Attachment
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload an image to help visualize your task. Our AI will
              automatically analyze and tag the image content.
            </Typography>

            {!selectedFile ? (
              <Paper
                sx={{
                  p: 4,
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
                  transition: "all 0.2s ease-in-out",
                }}
                component="label"
              >
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <UploadIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Choose an image
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click to browse or drag and drop
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Supports JPG, PNG, GIF up to 5MB
                </Typography>
              </Paper>
            ) : (
              <Card sx={{ maxWidth: 400, mx: "auto" }}>
                <Box sx={{ position: "relative" }}>
                  <img
                    src={previewUrl!}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: 200,
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
                  <Typography variant="subtitle2" gutterBottom>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Task
            </Typography>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {formData.title}
                </Typography>
                {formData.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {formData.description}
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2">
                      {formData.status.charAt(0).toUpperCase() +
                        formData.status.slice(1)}
                    </Typography>
                  </Box>
                  {formData.dueDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body2">
                        {new Date(formData.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
                {selectedFile && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <ImageIcon color="action" />
                    <Typography variant="body2">
                      Image attachment: {selectedFile.name}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/")}
          sx={{ mb: 2 }}
        >
          Back to Tasks
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          Create New Task
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Break down your work into manageable, actionable tasks
        </Typography>
      </Box>

      {error && (
        <Fade in={Boolean(error)}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        </Fade>
      )}

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>{renderStepContent(activeStep)}</Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>

          <Box>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading === "loading"}
                startIcon={
                  loading === "loading" ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SaveIcon />
                  )
                }
              >
                {loading === "loading" ? "Creating..." : "Create Task"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  activeStep === 0 && Object.keys(validationErrors).length > 0
                }
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateTask;
