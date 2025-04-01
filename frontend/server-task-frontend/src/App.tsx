import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppHeader from "./components/AppHeader";
import TaskList from "./components/TaskList";
import TaskDetail from "./components/TaskDetail";
import CreateTask from "./components/CreateTask";

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <AppHeader />
          <Routes>
            <Route path="/" element={<TaskList />} />
            <Route path="/task/:taskId" element={<TaskDetail />} />
            <Route path="/create" element={<CreateTask />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
