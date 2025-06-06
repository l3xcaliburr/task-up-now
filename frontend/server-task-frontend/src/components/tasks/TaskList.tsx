import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Fab,
  Fade,
  Paper,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Assignment as TaskIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useTasks } from "../../hooks/useTasks";

import TaskCard from "../ui/TaskCard";

type FilterTab = "all" | "pending" | "in-progress" | "completed";

const TaskList: React.FC = () => {
  const { tasks, loading, error, deleteTask, toggleTaskStatus, clearError } =
    useTasks();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.imageLabels &&
        task.imageLabels.some((label) =>
          label.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && task.status === activeTab;
  });

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: FilterTab) => {
    setActiveTab(newValue);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const EmptyState: React.FC<{ hasSearch: boolean }> = ({ hasSearch }) => (
    <Paper
      sx={{
        p: 6,
        textAlign: "center",
        backgroundColor: "grey.50",
        border: "2px dashed",
        borderColor: "grey.300",
        borderRadius: 3,
      }}
    >
      <TaskIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {hasSearch ? "No tasks match your search" : "No tasks yet"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {hasSearch
          ? "Try adjusting your search terms or filters"
          : "Create your first task to get started organizing your work"}
      </Typography>
      {!hasSearch && (
        <Button
          component={RouterLink}
          to="/create"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ mt: 1 }}
        >
          Create Your First Task
        </Button>
      )}
    </Paper>
  );

  if (loading === "loading" && tasks.length === 0) {
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
              Loading your tasks...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: "linear-gradient(135deg, #1565c0 0%, #7c4dff 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          My Tasks
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Stay organized and get things done
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Fade in={Boolean(error)}>
          <Alert
            severity="error"
            onClose={clearError}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          placeholder="Search tasks by title, description, or AI labels..."
          value={searchTerm}
          onChange={handleSearch}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              minWidth: "auto",
              px: 2,
            },
          }}
        >
          <Tab label={`All (${taskCounts.all})`} value="all" />
          <Tab label={`Pending (${taskCounts.pending})`} value="pending" />
          <Tab
            label={`In Progress (${taskCounts["in-progress"]})`}
            value="in-progress"
          />
          <Tab
            label={`Completed (${taskCounts.completed})`}
            value="completed"
          />
        </Tabs>
      </Paper>

      {/* Task List */}
      <Box>
        {filteredTasks.length === 0 ? (
          <EmptyState hasSearch={Boolean(searchTerm)} />
        ) : (
          <Fade in={true}>
            <Box>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.taskId}
                  task={task}
                  onToggleStatus={toggleTaskStatus}
                  onDelete={deleteTask}
                />
              ))}
            </Box>
          </Fade>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        component={RouterLink}
        to="/create"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          boxShadow: 3,
          "&:hover": {
            transform: "scale(1.1)",
            boxShadow: 6,
          },
          transition: "all 0.2s ease-in-out",
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default TaskList;
