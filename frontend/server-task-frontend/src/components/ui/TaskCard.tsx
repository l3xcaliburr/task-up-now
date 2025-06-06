import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Checkbox,
  IconButton,
  Chip,
  Box,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  CalendarToday as CalendarIcon,
  Label as LabelIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { Task } from "../../types";
import {
  formatDate,
  getStatusColor,
  getStatusLabel,
  truncateText,
} from "../../utils/formatters";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onDelete,
}) => {
  const theme = useTheme();
  const isCompleted = task.status === "completed";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this task?")) {
      onDelete(task.taskId);
    }
  };

  const handleToggleStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleStatus(task);
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.1),
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[4],
          borderColor: alpha(theme.palette.primary.main, 0.2),
        },
        opacity: isCompleted ? 0.8 : 1,
        background: isCompleted
          ? alpha(theme.palette.success.main, 0.02)
          : theme.palette.background.paper,
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Checkbox
            checked={isCompleted}
            onChange={handleToggleStatus}
            sx={{
              mt: -0.5,
              "& .MuiSvgIcon-root": { fontSize: 24 },
            }}
            color="success"
          />

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "1.1rem",
                lineHeight: 1.3,
                textDecoration: isCompleted ? "line-through" : "none",
                color: isCompleted ? "text.secondary" : "text.primary",
                mb: 1,
              }}
            >
              {task.title}
            </Typography>

            {task.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  lineHeight: 1.5,
                  textDecoration: isCompleted ? "line-through" : "none",
                }}
              >
                {truncateText(task.description, 150)}
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
              }}
            >
              <Chip
                label={getStatusLabel(task.status)}
                color={getStatusColor(task.status)}
                size="small"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />

              {task.dueDate && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CalendarIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(task.dueDate)}
                  </Typography>
                </Box>
              )}

              {task.imageUrl && (
                <Tooltip title="Has attachment">
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: theme.palette.secondary.main,
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                </Tooltip>
              )}

              {task.imageLabels && task.imageLabels.length > 0 && (
                <Tooltip title={`AI Labels: ${task.imageLabels.join(", ")}`}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <LabelIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">
                      {task.imageLabels.length} labels
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, py: 1.5, pt: 0 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Edit task">
          <IconButton
            component={RouterLink}
            to={`/task/${task.taskId}`}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete task">
          <IconButton
            onClick={handleDelete}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: theme.palette.error.main,
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default TaskCard;
