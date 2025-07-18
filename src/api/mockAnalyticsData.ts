// Mock analytics data for RevenueOverview component
export const mockRevenueOverviewData = {
  timeSeriesData: [
    { period: 'Jan', revenue: 45000, change: 12 },
    { period: 'Feb', revenue: 52000, change: 15 },
    { period: 'Mar', revenue: 48000, change: -8 },
    { period: 'Apr', revenue: 55000, change: 14 },
    { period: 'May', revenue: 58000, change: 5 },
    { period: 'Jun', revenue: 62000, change: 7 }
  ],
  membershipRevenue: [
    { category: 'Premium', amount: 35000, percentage: 56, color: 'bg-blue-500' },
    { category: 'Standard', amount: 20000, percentage: 32, color: 'bg-green-500' },
    { category: 'Basic', amount: 7000, percentage: 12, color: 'bg-yellow-500' }
  ],
  paymentMethodRevenue: [
    { category: 'Credit Card', amount: 40000, percentage: 65, color: 'bg-purple-500' },
    { category: 'Cash', amount: 15000, percentage: 24, color: 'bg-green-500' },
    { category: 'Bank Transfer', amount: 7000, percentage: 11, color: 'bg-blue-500' }
  ],
  sourceRevenue: [
    { category: 'Direct', amount: 35000, percentage: 56, color: 'bg-blue-500' },
    { category: 'Referral', amount: 20000, percentage: 32, color: 'bg-green-500' },
    { category: 'Social Media', amount: 7000, percentage: 12, color: 'bg-purple-500' }
  ],
  topProducts: [
    { name: 'Premium Membership', revenue: 25000, units: 45 },
    { name: 'Personal Training', revenue: 18000, units: 120 },
    { name: 'Group Classes', revenue: 12000, units: 300 },
    { name: 'Equipment Rental', revenue: 5000, units: 80 },
    { name: 'Nutrition Consultation', revenue: 3000, units: 25 }
  ],
  vatSummary: {
    total: 62000,
    collected: 6200,
    refunded: 200,
    net: 6000
  }
};

// Mock analytics data for MemberAnalytics component
export const mockMemberAnalyticsData = {
  funnel: [
    { stage: 'Website Visitors', count: 1000, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Lead Generation', count: 200, percentage: 20, color: 'bg-green-500' },
    { stage: 'Trial Signups', count: 80, percentage: 8, color: 'bg-yellow-500' },
    { stage: 'Active Members', count: 60, percentage: 6, color: 'bg-purple-500' },
    { stage: 'Retained Members', count: 45, percentage: 4.5, color: 'bg-indigo-500' }
  ],
  memberStatus: [
    { status: 'Active', count: 450, percentage: 75, color: '#10B981' },
    { status: 'Trial', count: 80, percentage: 13, color: '#F59E0B' },
    { status: 'Paused', count: 50, percentage: 8, color: '#EF4444' },
    { status: 'Cancelled', count: 20, percentage: 4, color: '#6B7280' }
  ],
  topSpenders: [
    { name: 'Sarah Johnson', email: 'sarah.j@email.com', spend: 2500, joinDate: '2023-01-15', status: 'Active' },
    { name: 'Mike Chen', email: 'mike.c@email.com', spend: 2200, joinDate: '2023-02-20', status: 'Active' },
    { name: 'Emily Rodriguez', email: 'emily.r@email.com', spend: 1900, joinDate: '2023-03-10', status: 'Active' },
    { name: 'David Kim', email: 'david.k@email.com', spend: 1800, joinDate: '2023-01-25', status: 'Active' },
    { name: 'Lisa Thompson', email: 'lisa.t@email.com', spend: 1700, joinDate: '2023-02-05', status: 'Active' }
  ],
  longestMembers: [
    { name: 'John Smith', email: 'john.s@email.com', spend: 1500, joinDate: '2020-06-15', status: 'Active' },
    { name: 'Maria Garcia', email: 'maria.g@email.com', spend: 1400, joinDate: '2020-08-20', status: 'Active' },
    { name: 'Robert Wilson', email: 'robert.w@email.com', spend: 1300, joinDate: '2021-01-10', status: 'Active' },
    { name: 'Jennifer Lee', email: 'jennifer.l@email.com', spend: 1200, joinDate: '2021-03-25', status: 'Active' },
    { name: 'Michael Brown', email: 'michael.b@email.com', spend: 1100, joinDate: '2021-05-15', status: 'Active' }
  ],
  ltvTrend: [
    { month: 'Jan', ltv: 1200 },
    { month: 'Feb', ltv: 1250 },
    { month: 'Mar', ltv: 1300 },
    { month: 'Apr', ltv: 1350 },
    { month: 'May', ltv: 1400 },
    { month: 'Jun', ltv: 1450 }
  ],
  noShows: [
    { name: 'Alex Martinez', count: 3, lastSeen: '2024-06-15' },
    { name: 'Jessica Wang', count: 2, lastSeen: '2024-06-18' },
    { name: 'Ryan O\'Connor', count: 4, lastSeen: '2024-06-12' },
    { name: 'Sophie Turner', count: 1, lastSeen: '2024-06-20' },
    { name: 'Chris Evans', count: 2, lastSeen: '2024-06-16' }
  ]
};

// Mock analytics KPIs
export const mockAnalyticsKPIs = [
  {
    title: "Total Revenue",
    value: "$62,000",
    change: "+7.2%",
    trend: "up" as const,
    icon: "FiDollarSign",
    color: "green" as const
  },
  {
    title: "Active Members",
    value: "450",
    change: "+12.5%",
    trend: "up" as const,
    icon: "FiUsers",
    color: "blue" as const
  },
  {
    title: "Avg. Session",
    value: "24",
    change: "+3.1%",
    trend: "up" as const,
    icon: "FiActivity",
    color: "purple" as const
  },
  {
    title: "Retention Rate",
    value: "87%",
    change: "+2.3%",
    trend: "up" as const,
    icon: "FiTrendingUp",
    color: "green" as const
  }
];

// Mock analytics views
export const mockAnalyticsViews = [
  {
    id: "overview",
    name: "Overview",
    icon: "FiBarChart",
    description: "Complete business overview"
  },
  {
    id: "members",
    name: "Members",
    icon: "FiUsers",
    description: "Member analytics and insights"
  },
  {
    id: "revenue",
    name: "Revenue",
    icon: "FiDollarSign",
    description: "Revenue analysis and trends"
  },
  {
    id: "classes",
    name: "Classes",
    icon: "FiCalendar",
    description: "Class performance metrics"
  },
  {
    id: "trainers",
    name: "Trainers",
    icon: "FiTrendingUp",
    description: "Trainer performance analytics"
  }
]; 