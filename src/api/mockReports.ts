// Mock API for Reports page data
// Provides realistic gym analytics data for development

export interface KPIStats {
  generatedReports: { value: number; trend: string };
  downloads: { value: number; trend: string };
  scheduledReports: { value: number; trend: string };
  autoReports: { value: number; trend: string };
}

export interface SmartInsight {
  id: string;
  title: string;
  cause: string;
  suggestion: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: 'trainer' | 'member' | 'class' | 'revenue';
  icon: string;
  badge?: 'New' | 'Actioned';
}

export interface ChartMetrics {
  revenue: number[];
  churn: number[];
  attendance: number[];
  period: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'trainer' | 'financial' | 'operational' | 'member';
  icon: string;
  color: string;
  popularity: number;
  filters: Record<string, any>;
}

// Mock API functions
export const getKPIStats = async (): Promise<KPIStats> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    generatedReports: { value: 148, trend: "+8.2%" },
    downloads: { value: 452, trend: "+16%" },
    scheduledReports: { value: 12, trend: "+3" },
    autoReports: { value: 32, trend: "+10" },
  };
};

export const getSmartInsights = async (): Promise<SmartInsight[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return [
    {
      id: '1',
      title: "Trainer attendance dropped 12%",
      cause: "2 unplanned absences in busiest slots",
      suggestion: "Reassign peak hours or hire backup trainer",
      action: "Create Task",
      priority: 'high',
      category: 'trainer',
      icon: '👨‍🏫',
      badge: 'New'
    },
    {
      id: '2',
      title: "New member churn up 18%",
      cause: "Lack of onboarding follow-up",
      suggestion: "Auto-schedule welcome call",
      action: "Create Campaign",
      priority: 'high',
      category: 'member',
      icon: '📈',
      badge: 'New'
    },
    {
      id: '3',
      title: "Evening class bookings exceeded 95% capacity",
      cause: "Only 2 classes after 6 PM",
      suggestion: "Add 1 more 7 PM slot",
      action: "Schedule Class",
      priority: 'medium',
      category: 'class',
      icon: '🏋️‍♀️'
    },
    {
      id: '4',
      title: "Revenue per member increased 23%",
      cause: "Premium class packages performing well",
      suggestion: "Expand premium offerings to other time slots",
      action: "Create Package",
      priority: 'low',
      category: 'revenue',
      icon: '💰'
    }
  ];
};

export const getChartMetrics = async (): Promise<ChartMetrics> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    revenue: [1000, 1250, 1100, 1500, 1750, 1600],
    churn: [5, 8, 10, 12, 11, 7],
    attendance: [60, 65, 58, 75, 80, 82],
    period: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  };
};

export const getReportTemplates = async (): Promise<ReportTemplate[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return [
    {
      id: '1',
      name: 'Trainer Performance',
      description: 'Individual trainer metrics and revenue analysis',
      category: 'trainer',
      icon: '👨‍🏫',
      color: 'blue',
      popularity: 95,
      filters: { type: 'trainer', period: 'monthly', includeRevenue: true }
    },
    {
      id: '2',
      name: 'Branch Profitability',
      description: 'Revenue vs expenses by location',
      category: 'financial',
      icon: '🏢',
      color: 'green',
      popularity: 88,
      filters: { type: 'financial', period: 'quarterly', includeExpenses: true }
    },
    {
      id: '3',
      name: 'Attendance Trends',
      description: 'Class capacity and member engagement',
      category: 'operational',
      icon: '📊',
      color: 'purple',
      popularity: 82,
      filters: { type: 'operational', period: 'weekly', includeCapacity: true }
    },
    {
      id: '4',
      name: 'Churn by Class',
      description: 'Member retention analysis by class type',
      category: 'member',
      icon: '📉',
      color: 'orange',
      popularity: 76,
      filters: { type: 'member', period: 'monthly', includeChurn: true }
    }
  ];
};

export const getWeeklySummary = async (): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const summaries = [
    "Your gym grew 14% this week 🚀",
    "Revenue up 8% with 12 new members 🎉",
    "Class attendance at 87% - great engagement! 💪",
    "Trainer satisfaction score: 4.8/5 ⭐"
  ];
  
  return summaries[Math.floor(Math.random() * summaries.length)];
};

export const getBranches = async (): Promise<Array<{ id: string; name: string }>> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return [
    { id: 'all', name: 'All Branches' },
    { id: 'main', name: 'Main Branch' },
    { id: 'downtown', name: 'Downtown Location' },
    { id: 'suburb', name: 'Suburban Branch' }
  ];
};

export const getMetricTypes = async (): Promise<Array<{ id: string; name: string }>> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return [
    { id: 'all', name: 'All Metrics' },
    { id: 'revenue', name: 'Revenue' },
    { id: 'members', name: 'Members' },
    { id: 'classes', name: 'Classes' },
    { id: 'trainers', name: 'Trainers' }
  ];
}; 