import React from "react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Shows its children only to people whose role allows `permission` (any of, for
 * a list). Built-in roles always see them. This hides buttons; the database is
 * what actually refuses the action.
 */
export default function Can({
  permission,
  children,
}: {
  permission: string | readonly string[];
  children: React.ReactNode;
}) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : null;
}
