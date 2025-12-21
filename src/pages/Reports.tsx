import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Reports() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the unified Analytics page
    navigate("/dashboard/analytics?tab=reports", { replace: true });
  }, [navigate]);

  return null;
}
