import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the unified Analytics page
    navigate('/analytics?tab=reports');
  }, [navigate]);

  return null;
}
