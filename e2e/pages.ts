// The screens a signed-in gym admin uses (the demo backend signs in automatically).
export const MAIN_PAGES: Array<{ path: string; name: string }> = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/dashboard/members", name: "Members" },
  { path: "/dashboard/classes", name: "Classes" },
  { path: "/dashboard/trainers", name: "Trainers" },
  { path: "/dashboard/attendance", name: "Attendance" },
  { path: "/dashboard/attendance/kiosk", name: "Scanner screen" },
  { path: "/dashboard/billing", name: "Billing" },
  { path: "/dashboard/pos", name: "Point of sale" },
  { path: "/dashboard/analytics", name: "Analytics" },
  { path: "/dashboard/plans", name: "Plans" },
  { path: "/dashboard/tasks", name: "Tasks" },
  { path: "/dashboard/branches", name: "Branches" },
  { path: "/dashboard/settings", name: "Settings" },
  { path: "/dashboard/settings?tab=business", name: "Settings: business" },
  { path: "/dashboard/settings?tab=team", name: "Settings: team" },
  { path: "/superadmin", name: "Owner console" },
  { path: "/superadmin/tenants", name: "Owner console: gyms" },
];

export const PUBLIC_PAGES: Array<{ path: string; name: string }> = [
  { path: "/", name: "Landing" },
  { path: "/login", name: "Sign in" },
  { path: "/signup", name: "Sign up" },
  { path: "/forgot-password", name: "Forgot password" },
  { path: "/terms", name: "Terms" },
  { path: "/privacy", name: "Privacy" },
  { path: "/refund", name: "Refund policy" },
];
