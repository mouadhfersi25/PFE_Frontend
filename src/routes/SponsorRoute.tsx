import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/auth.service";

function SponsorRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  const isSponsor = authService.isSponsor();

  if (!isAuthenticated || !isSponsor) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default SponsorRoute;
