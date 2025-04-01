import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";

const AppHeader = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          style={{ flexGrow: 1, textDecoration: "none", color: "white" }}
        >
          ServerTask
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/create"
            startIcon={<AddIcon />}
          >
            New Task
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
