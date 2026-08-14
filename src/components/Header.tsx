import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  styled,
} from "@mui/material";

const StyledAppBar = styled(AppBar)(() => ({
  backgroundColor: "transparent",
  backgroundImage: "linear-gradient(to right, #155FD9, #489BFA)",
  boxShadow: "none",
  borderBottom: "1px solid rgba(123, 189, 254, 0.1)",
  height: "64px",
}));

const StyledToolbar = styled(Toolbar)(() => ({
  justifyContent: "space-between",
  padding: "0 24px",
}));

const StyledAvatar = styled(Avatar)(() => ({
  width: "40px",
  height: "40px",
  border: "2px solid rgba(123, 189, 254, 0.3)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#155FD9",
}));

const PageTitle = styled(Typography)(() => ({
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 500,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}));

export default function Header() {
  return (
    <StyledAppBar position="fixed">
      <StyledToolbar>
        <PageTitle>Dashboard</PageTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <StyledAvatar>JD</StyledAvatar>
        </Box>
      </StyledToolbar>
    </StyledAppBar>
  );
}
