// src/components/MenuTabs.js
import React from "react";
import { Box, Tabs, Tab } from "@mui/material";

export function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`menu-tabpanel-${index}`}
      aria-labelledby={`menu-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function MenuTabs({ currentTab, handleTabChange }) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", backgroundColor: "#080831" }}>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        aria-label="Menu"
        textColor="inherit"
        indicatorColor="primary"
        centered
      >
        <Tab label="View Elections" />
        <Tab label="Candidats" />
        <Tab label="Votants" />
        <Tab label="Create Election" />
        <Tab label="Administration" />
        <Tab label="Propriété du contrat" />
      </Tabs>
    </Box>
  );
}