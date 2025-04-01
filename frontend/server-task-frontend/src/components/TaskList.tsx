import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Divider,
  CircularProgress,
  Box,
} from "@mui/material";
import { Delete, Edit, Image } from "@mui/icons-material";
import { format } from "date-fns";
import { getTasks, updateTask, deleteTask } from "../services/api";

interface Task {
  taskId: string;
  title: string;
  description: string;
  status: string;
  dueDate?: string;
  imageUrl?: string;
  createdAt: string;
}

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setError("");
    } catch (err) {
      setError("Failed to load tasks. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      await updateTask(task.taskId, { ...task, status: newStatus });
      setTasks(
        tasks.map((t) =>
          t.taskId === task.taskId ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter((task) => task.taskId !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Tasks
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff4f4" }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {tasks.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography>No tasks yet. Create your first task!</Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {tasks.map((task, index) => (
              <React.Fragment key={task.taskId}>
                {index > 0 && <Divider />}
                <ListItem>
                  <Checkbox
                    edge="start"
                    checked={task.status === "completed"}
                    onChange={() => handleToggleStatus(task)}
                  />
                  <ListItemText
                    primary={
                      <Typography
                        style={{
                          textDecoration:
                            task.status === "completed"
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        {task.dueDate && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="textSecondary"
                          >
                            Due: {format(new Date(task.dueDate), "PP")}
                          </Typography>
                        )}
                        {task.imageUrl && (
                          <Box component="span" ml={1}>
                            <Image fontSize="small" color="action" />
                          </Box>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      component={RouterLink}
                      to={`/task/${task.taskId}`}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteTask(task.taskId)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default TaskList;
