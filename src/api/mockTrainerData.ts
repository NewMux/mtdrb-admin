import { Trainer } from '../types';

// Mock trainers with detailed data
export const mockTrainers: Trainer[] = [
  {
    id: 'trainer-001',
    tenant_id: 't1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@fit.com',
    phone: '+1234567890',
    status: 'active',
    specialties: ['Strength Training', 'HIIT', 'Weight Loss'],
    bio: 'Certified personal trainer with 8 years experience in strength training and HIIT.',
    profile_image_url: 'https://example.com/sarah.jpg',
    hourly_rate: 45,
    rating: 4.8,
    experience_level: 'Advanced',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-06-20T10:00:00Z'
  },
  {
    id: 'trainer-002',
    tenant_id: 't1',
    name: 'Mike Chen',
    email: 'mike.chen@fit.com',
    phone: '+1234567891',
    status: 'active',
    specialties: ['Yoga', 'Pilates', 'Flexibility'],
    bio: 'Yoga instructor specializing in vinyasa and restorative practices.',
    profile_image_url: 'https://example.com/mike.jpg',
    hourly_rate: 40,
    rating: 4.9,
    experience_level: 'Intermediate',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-06-19T10:00:00Z'
  },
  {
    id: 'trainer-003',
    tenant_id: 't1',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@fit.com',
    phone: '+1234567892',
    status: 'active',
    specialties: ['Cardio', 'Spinning', 'Endurance'],
    bio: 'Cardio specialist with expertise in spinning and endurance training.',
    profile_image_url: 'https://example.com/emily.jpg',
    hourly_rate: 42,
    rating: 4.7,
    experience_level: 'Advanced',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-06-18T10:00:00Z'
  },
  {
    id: 'trainer-004',
    tenant_id: 't1',
    name: 'David Kim',
    email: 'david.kim@fit.com',
    phone: '+1234567893',
    status: 'active',
    specialties: ['CrossFit', 'Functional Training', 'Sports Performance'],
    bio: 'CrossFit Level 2 trainer with background in sports performance.',
    profile_image_url: 'https://example.com/david.jpg',
    hourly_rate: 50,
    rating: 4.6,
    experience_level: 'Expert',
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-06-17T10:00:00Z'
  },
  {
    id: 'trainer-005',
    tenant_id: 't1',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@fit.com',
    phone: '+1234567894',
    status: 'active',
    specialties: ['Senior Fitness', 'Rehabilitation', 'Low Impact'],
    bio: 'Specialized in senior fitness and post-rehabilitation training.',
    profile_image_url: 'https://example.com/lisa.jpg',
    hourly_rate: 38,
    rating: 4.9,
    experience_level: 'Intermediate',
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2024-06-16T10:00:00Z'
  },
  {
    id: 'trainer-006',
    tenant_id: 't1',
    name: 'Alex Martinez',
    email: 'alex.martinez@fit.com',
    phone: '+1234567895',
    status: 'pending',
    specialties: ['Boxing', 'MMA', 'Combat Sports'],
    bio: 'Former professional boxer with 10 years coaching experience.',
    profile_image_url: 'https://example.com/alex.jpg',
    hourly_rate: 55,
    rating: 4.5,
    experience_level: 'Expert',
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z'
  },
  {
    id: 'trainer-007',
    tenant_id: 't1',
    name: 'Jessica Wang',
    email: 'jessica.wang@fit.com',
    phone: '+1234567896',
    status: 'active',
    specialties: ['Nutrition', 'Weight Management', 'Wellness'],
    bio: 'Certified nutritionist and wellness coach with holistic approach.',
    profile_image_url: 'https://example.com/jessica.jpg',
    hourly_rate: 48,
    rating: 4.8,
    experience_level: 'Advanced',
    created_at: '2024-03-10T10:00:00Z',
    updated_at: '2024-06-14T10:00:00Z'
  },
  {
    id: 'trainer-008',
    tenant_id: 't1',
    name: 'Ryan O\'Connor',
    email: 'ryan.oconnor@fit.com',
    phone: '+1234567897',
    status: 'inactive',
    specialties: ['Powerlifting', 'Strength', 'Bodybuilding'],
    bio: 'Competitive powerlifter and bodybuilding specialist.',
    profile_image_url: 'https://example.com/ryan.jpg',
    hourly_rate: 52,
    rating: 4.4,
    experience_level: 'Expert',
    created_at: '2024-03-20T10:00:00Z',
    updated_at: '2024-06-13T10:00:00Z'
  }
];

// Mock trainers for TrainerTable component (simplified interface)
export const mockTrainerTableData = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@mtdrb.com',
    phone: '+1 (555) 123-4567',
    specialty: 'Yoga & Pilates',
    rating: 4.9,
    status: 'active' as const,
    classes: 24,
    experience: '5 years',
    avatar: 'SJ',
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@mtdrb.com',
    phone: '+1 (555) 234-5678',
    specialty: 'HIIT & Cardio',
    rating: 4.8,
    status: 'busy' as const,
    classes: 18,
    experience: '3 years',
    avatar: 'MC',
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma.wilson@mtdrb.com',
    phone: '+1 (555) 345-6789',
    specialty: 'Strength Training',
    rating: 4.7,
    status: 'available' as const,
    classes: 15,
    experience: '4 years',
    avatar: 'EW',
  },
  {
    id: '4',
    name: 'David Rodriguez',
    email: 'david.rodriguez@mtdrb.com',
    phone: '+1 (555) 456-7890',
    specialty: 'CrossFit',
    rating: 4.6,
    status: 'active' as const,
    classes: 20,
    experience: '6 years',
    avatar: 'DR',
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@mtdrb.com',
    phone: '+1 (555) 567-8901',
    specialty: 'Zumba & Dance',
    rating: 4.5,
    status: 'inactive' as const,
    classes: 12,
    experience: '2 years',
    avatar: 'LT',
  },
];

// Mock trainer analytics data
export const mockTrainerAnalytics = {
  totalTrainers: 8,
  activeTrainers: 6,
  todaySessions: 24,
  topRatedTrainer: { name: 'Mike Chen', rating: 4.9 },
  averageRating: 4.7,
  averageHourlyRate: 46.25,
  totalRevenue: 125000,
  monthlyGrowth: 12.5
};

// Mock trainer performance data
export const mockTrainerPerformance = [
  {
    id: 'trainer-001',
    name: 'Sarah Johnson',
    rating: 4.8,
    sessions: 85,
    revenue: 3825,
    retention: 92,
    efficiency: 88,
    growth: 15,
    specialties: ['Strength Training', 'HIIT', 'Weight Loss']
  },
  {
    id: 'trainer-002',
    name: 'Mike Chen',
    rating: 4.9,
    sessions: 92,
    revenue: 3680,
    retention: 95,
    efficiency: 91,
    growth: 22,
    specialties: ['Yoga', 'Pilates', 'Flexibility']
  },
  {
    id: 'trainer-003',
    name: 'Emily Rodriguez',
    rating: 4.7,
    sessions: 78,
    revenue: 3276,
    retention: 89,
    efficiency: 85,
    growth: 8,
    specialties: ['Cardio', 'Spinning', 'Endurance']
  },
  {
    id: 'trainer-004',
    name: 'David Kim',
    rating: 4.6,
    sessions: 95,
    revenue: 4750,
    retention: 87,
    efficiency: 93,
    growth: 18,
    specialties: ['CrossFit', 'Functional Training', 'Sports Performance']
  },
  {
    id: 'trainer-005',
    name: 'Lisa Thompson',
    rating: 4.9,
    sessions: 68,
    revenue: 2584,
    retention: 96,
    efficiency: 90,
    growth: 12,
    specialties: ['Senior Fitness', 'Rehabilitation', 'Low Impact']
  },
  {
    id: 'trainer-007',
    name: 'Jessica Wang',
    rating: 4.8,
    sessions: 72,
    revenue: 3456,
    retention: 94,
    efficiency: 87,
    growth: 20,
    specialties: ['Nutrition', 'Weight Management', 'Wellness']
  }
];

// Mock automation workflows for trainers
export const mockTrainerAutomationWorkflows = [
  {
    id: 'wf-001',
    name: 'Smart Scheduling Optimizer',
    description: 'Automatically optimize trainer schedules based on demand patterns and availability',
    type: 'scheduling' as const,
    status: 'active' as const,
    successRate: 94,
    triggerCount: 156,
    revenue: 3200,
    icon: 'FiCalendar',
    color: 'blue'
  },
  {
    id: 'wf-002',
    name: 'Performance Monitoring',
    description: 'Track trainer performance metrics and trigger alerts for intervention',
    type: 'performance' as const,
    status: 'active' as const,
    successRate: 88,
    triggerCount: 89,
    revenue: 2400,
    icon: 'FiTrendingUp',
    color: 'green'
  },
  {
    id: 'wf-003',
    name: 'Member-Trainer Matching',
    description: 'AI-powered matching system to pair members with ideal trainers',
    type: 'matching' as const,
    status: 'active' as const,
    successRate: 92,
    triggerCount: 234,
    revenue: 4100,
    icon: 'FiTarget',
    color: 'purple'
  },
  {
    id: 'wf-004',
    name: 'Communication Automation',
    description: 'Automated messages, reminders, and follow-ups for trainers and members',
    type: 'communication' as const,
    status: 'paused' as const,
    successRate: 76,
    triggerCount: 67,
    revenue: 1800,
    icon: 'FiMessageSquare',
    color: 'orange'
  },
  {
    id: 'wf-005',
    name: 'Capacity Management',
    description: 'Automatically adjust class sizes and trainer workloads for optimal utilization',
    type: 'scheduling' as const,
    status: 'active' as const,
    successRate: 91,
    triggerCount: 123,
    revenue: 2900,
    icon: 'FiUsers',
    color: 'emerald'
  }
];

// Mock trainer insights
export const mockTrainerInsights = [
  {
    type: 'workload' as const,
    title: 'Trainer Workload Distribution',
    data: [
      { name: 'Sarah Johnson', sessions: 85, utilization: 95 },
      { name: 'Mike Chen', sessions: 92, utilization: 88 },
      { name: 'Emily Rodriguez', sessions: 78, utilization: 82 },
      { name: 'David Kim', sessions: 95, utilization: 97 },
      { name: 'Lisa Thompson', sessions: 68, utilization: 75 },
      { name: 'Jessica Wang', sessions: 72, utilization: 80 }
    ],
    insight: 'Sarah Johnson is operating at 95% capacity - consider redistributing load'
  },
  {
    type: 'performance' as const,
    title: 'Performance Analytics',
    data: [
      { name: 'Sarah Johnson', rating: 4.8, revenue: 3825 },
      { name: 'Mike Chen', rating: 4.9, revenue: 3680 },
      { name: 'Emily Rodriguez', rating: 4.7, revenue: 3276 },
      { name: 'David Kim', rating: 4.6, revenue: 4750 },
      { name: 'Lisa Thompson', rating: 4.9, revenue: 2584 },
      { name: 'Jessica Wang', rating: 4.8, revenue: 3456 }
    ],
    insight: 'Top performers show 23% higher client retention rates'
  }
];

// Mock AI recommendations
export const mockTrainerAIRecommendations = [
  '🎯 Peak demand detected 6-8 PM - consider adding evening trainers',
  '📈 High-performing trainers ready for advanced certifications',
  '⚡ Automated scheduling could improve efficiency by 25%',
  '🔄 Cross-training opportunities identified for skill diversification',
  '💡 Jessica Wang shows exceptional nutrition expertise - consider specialized programs',
  '📊 David Kim\'s CrossFit classes at 97% capacity - expansion recommended'
];

// Mock performance metrics
export const mockPerformanceMetrics = [
  {
    name: 'Average Rating',
    current: 4.7,
    previous: 4.5,
    target: 4.8,
    trend: 'up' as const
  },
  {
    name: 'Session Completion',
    current: 94,
    previous: 91,
    target: 95,
    trend: 'up' as const
  },
  {
    name: 'Member Retention',
    current: 87,
    previous: 89,
    target: 90,
    trend: 'down' as const
  },
  {
    name: 'Revenue per Trainer',
    current: 6800,
    previous: 6200,
    target: 7500,
    trend: 'up' as const
  },
  {
    name: 'Client Utilization',
    current: 82,
    previous: 78,
    target: 85,
    trend: 'up' as const
  },
  {
    name: 'Training Efficiency',
    current: 91,
    previous: 92,
    target: 95,
    trend: 'down' as const
  }
];

// Mock revenue data
export const mockRevenueData = [
  { month: 'Jan', revenue: 15000, sessions: 120 },
  { month: 'Feb', revenue: 16500, sessions: 135 },
  { month: 'Mar', revenue: 18000, sessions: 150 },
  { month: 'Apr', revenue: 19500, sessions: 165 },
  { month: 'May', revenue: 21000, sessions: 180 },
  { month: 'Jun', revenue: 22500, sessions: 195 }
];

// Mock automation metrics
export const mockAutomationMetrics = [
  {
    label: 'Active Workflows',
    value: 4,
    change: 12,
    icon: 'FiZap',
    color: 'blue'
  },
  {
    label: 'Success Rate',
    value: 88,
    change: 8,
    icon: 'FiCheckCircle',
    color: 'green'
  },
  {
    label: 'Total Triggers',
    value: 669,
    change: 23,
    icon: 'FiActivity',
    color: 'purple'
  },
  {
    label: 'Revenue Impact',
    value: 14400,
    change: 15,
    icon: 'FiTrendingUp',
    color: 'yellow'
  }
]; 