import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
} from "@mui/material";
import { Add as AddIcon, Assignment as TaskIcon } from "@mui/icons-material";
import { Link as RouterLink, useLocation } from "react-router-dom";

const AppHeader: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 0, sm: 0 } }}>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <TaskIcon sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: "none",
                color: "inherit",
                fontWeight: 600,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                letterSpacing: "-0.01em",
                "&:hover": {
                  opacity: 0.9,
                },
              }}
            >
              TaskUpNow
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            {location.pathname !== "/create" && (
              <Button
                color="inherit"
                component={RouterLink}
                to="/create"
                startIcon={<AddIcon />}
                sx={{
                  borderRadius: 2,
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  fontWeight: 500,
                  textTransform: "none",
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.2)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <Typography
                  variant="button"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  New Task
                </Typography>
                <Typography
                  variant="button"
                  sx={{ display: { xs: "block", sm: "none" } }}
                >
                  New
                </Typography>
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default AppHeader;
