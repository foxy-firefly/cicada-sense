import { Navigate, Route, Routes } from "react-router-dom";
import { MonitoringWorkspaceScreen } from "../presentation/monitoring-workspace-screen.js";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MonitoringWorkspaceScreen />} path="/" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
