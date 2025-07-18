// Smart Promotion Insights API
// Provides AI-driven campaign recommendations and analytics

export interface SmartInsight {
  id: string;
  title: string;
  detectedIssue: string;
  recommendedAction: string;
  actionCTA: string;
  priority: 'high' | 'medium' | 'low';
  category: 'churn' | 'acquisition' | 'engagement' | 'revenue';
  expectedImpact: string;
  confidence: number;
  dataPoints: number;
  lastUpdated: Date;
}

export interface CampaignRecommendation {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  expectedReach: number;
  expectedROI: number;
  channels: string[];
  discount: {
    type: 'percentage' | 'fixed' | 'free';
    value: number;
  };
  duration: number;
  confidence: number;
  reasoning: string[];
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  actions: string[];
  conditions: string[];
  category: string;
  expectedConversion: number;
  expectedRevenue: number;
}

// Mock API functions - in production, these would call real AI services
export const getSmartPromotionInsights = async (): Promise<SmartInsight[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    {
      id: 'churn-risk-high',
      title: 'Churn risk high for new members',
      detectedIssue: '42% of new members haven\'t engaged in 7 days',
      recommendedAction: 'Send welcome incentive now',
      actionCTA: 'Launch Campaign',
      priority: 'high',
      category: 'churn',
      expectedImpact: 'Reduce churn by 35%',
      confidence: 0.89,
      dataPoints: 1247,
      lastUpdated: new Date()
    },
    {
      id: 'referral-opportunity',
      title: 'Referral program underused',
      detectedIssue: 'Only 12% of active members referred in last 60 days',
      recommendedAction: 'Trigger double credit campaign',
      actionCTA: 'Create Referral Promo',
      priority: 'medium',
      category: 'acquisition',
      expectedImpact: 'Increase referrals by 200%',
      confidence: 0.76,
      dataPoints: 892,
      lastUpdated: new Date()
    },
    {
      id: 'peak-performance',
      title: 'Peak class performance opportunity',
      detectedIssue: 'Tuesday 2-4 PM classes only 60% full',
      recommendedAction: 'Send targeted class promotion',
      actionCTA: 'Create Class Promo',
      priority: 'medium',
      category: 'engagement',
      expectedImpact: 'Fill 85% of peak classes',
      confidence: 0.82,
      dataPoints: 567,
      lastUpdated: new Date()
    },
    {
      id: 'birthday-campaign',
      title: 'Birthday campaign optimization',
      detectedIssue: 'Birthday promotions show 45% higher conversion',
      recommendedAction: 'Expand birthday automation',
      actionCTA: 'Optimize Automation',
      priority: 'low',
      category: 'revenue',
      expectedImpact: 'Increase revenue by 25%',
      confidence: 0.91,
      dataPoints: 234,
      lastUpdated: new Date()
    },
    {
      id: 'seasonal-opportunity',
      title: 'Seasonal campaign opportunity',
      detectedIssue: 'No campaigns planned for upcoming holidays',
      recommendedAction: 'Create seasonal promotion calendar',
      actionCTA: 'Plan Campaigns',
      priority: 'medium',
      category: 'revenue',
      expectedImpact: 'Generate $8,500 in holiday revenue',
      confidence: 0.78,
      dataPoints: 445,
      lastUpdated: new Date()
    },
    {
      id: 'low-engagement',
      title: 'Low engagement members identified',
      detectedIssue: '156 members haven\'t visited in 30+ days',
      recommendedAction: 'Send re-engagement campaign',
      actionCTA: 'Win Back Members',
      priority: 'high',
      category: 'retention',
      expectedImpact: 'Re-engage 40% of inactive members',
      confidence: 0.85,
      dataPoints: 678,
      lastUpdated: new Date()
    }
  ];
};

export const getCampaignRecommendations = async (): Promise<CampaignRecommendation[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: 'referral-booster',
      name: 'Referral Booster Campaign',
      description: 'Increase member referrals with double rewards and social proof',
      targetAudience: 'Active members (3+ visits/week)',
      expectedReach: 180,
      expectedROI: 4.2,
      channels: ['email', 'sms', 'in-app'],
      discount: {
        type: 'fixed',
        value: 50
      },
      duration: 30,
      confidence: 0.87,
      reasoning: [
        'Only 12% of active members referred in last 60 days',
        'Referral campaigns show 3.2x higher conversion',
        'Double rewards increase referral rate by 180%'
      ]
    },
    {
      id: 'new-member-welcome',
      name: 'New Member Welcome Series',
      description: 'Reduce churn with personalized onboarding and early wins',
      targetAudience: 'New members (< 30 days)',
      expectedReach: 45,
      expectedROI: 3.8,
      channels: ['email', 'sms'],
      discount: {
        type: 'percentage',
        value: 20
      },
      duration: 7,
      confidence: 0.92,
      reasoning: [
        '42% of new members haven\'t engaged in 7 days',
        'Welcome campaigns reduce churn by 35%',
        'Personalized messaging increases engagement 2.4x'
      ]
    },
    {
      id: 'churn-recovery',
      name: 'Churn Recovery Campaign',
      description: 'Re-engage inactive members with compelling comeback offers',
      targetAudience: 'Inactive members (> 14 days)',
      expectedReach: 67,
      expectedROI: 5.1,
      channels: ['email', 'sms', 'phone'],
      discount: {
        type: 'percentage',
        value: 50
      },
      duration: 14,
      confidence: 0.84,
      reasoning: [
        '156 members haven\'t visited in 30+ days',
        'Win-back campaigns show 45% success rate',
        '50% discount increases re-engagement by 3x'
      ]
    },
    {
      id: 'peak-class-push',
      name: 'Peak Class Push',
      description: 'Fill underbooked classes with targeted time-based promotions',
      targetAudience: 'Low-engagement members',
      expectedReach: 120,
      expectedROI: 2.9,
      channels: ['email', 'push'],
      discount: {
        type: 'percentage',
        value: 30
      },
      duration: 3,
      confidence: 0.79,
      reasoning: [
        'Tuesday 2-4 PM classes only 60% full',
        'Time-based promotions increase attendance 2.1x',
        'Targeted messaging improves conversion by 40%'
      ]
    }
  ];
};

export const getAutomationWorkflows = async (): Promise<AutomationWorkflow[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return [
    {
      id: 'birthday-automation',
      name: 'Birthday Celebration Automation',
      description: 'Personalized birthday promotions with special offers',
      triggers: ['Member birthday approaching'],
      actions: ['Send birthday email', 'Offer birthday discount', 'Personalized message'],
      conditions: ['Birthday within 3 days', 'Member active in last 6 months'],
      category: 'engagement',
      expectedConversion: 67.8,
      expectedRevenue: 5100
    },
    {
      id: 'churn-rescue',
      name: 'Churn Rescue Automation',
      description: 'Re-engage inactive members with personalized incentives',
      triggers: ['Member inactive for 10+ days'],
      actions: ['Send win-back email', 'Offer 50% discount', 'Personalized SMS'],
      conditions: ['No check-ins in 10 days', 'Previous engagement > 3 months'],
      category: 'retention',
      expectedConversion: 28.3,
      expectedRevenue: 6800
    },
    {
      id: 'referral-automation',
      name: 'Smart Referral Rewards',
      description: 'Automated referral promotion with dynamic rewards',
      triggers: ['Member refers friend'],
      actions: ['Send referral bonus', 'Track referral progress', 'Celebrate milestone'],
      conditions: ['Referral joins gym', 'Both members active'],
      category: 'acquisition',
      expectedConversion: 42.1,
      expectedRevenue: 3400
    },
    {
      id: 'seasonal-automation',
      name: 'Seasonal Promotion Automation',
      description: 'Auto-launch seasonal promotions based on calendar events',
      triggers: ['Holiday approaching', 'Seasonal milestone'],
      actions: ['Launch seasonal campaign', 'Send themed emails', 'Social media posts'],
      conditions: ['Within 7 days of holiday', 'Previous campaign success > 60%'],
      category: 'revenue',
      expectedConversion: 31.7,
      expectedRevenue: 8900
    }
  ];
};

export const generateAICopy = async (campaignType: string, targetAudience: string, discount: any): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const copyTemplates = {
    'referral': [
      "🎉 Refer a friend and both get $50 off! Share the fitness love and earn rewards together.",
      "🔥 Double the gains! Refer a friend and you both get exclusive member benefits.",
      "💪 Building a stronger community starts with you! Refer a friend and both save $50.",
      "🚀 Your network is your net worth! Refer friends and unlock special rewards together."
    ],
    'welcome': [
      "🎉 Welcome to the family! Get 20% off your first month and start your fitness journey.",
      "🔥 Ready to crush your goals? Get 20% off your first month and join our champions!",
      "💪 New here? Start strong with 20% off your first month. Your transformation begins now!",
      "🚀 Welcome to greatness! Get 20% off your first month and discover what you're capable of."
    ],
    'winback': [
      "💝 We miss you! Come back with 50% off and rediscover your fitness passion.",
      "🔥 Ready to get back in the game? 50% off your comeback month awaits!",
      "💪 Your fitness journey isn't over! Get 50% off and reignite your motivation.",
      "🚀 Time to make a comeback! 50% off your return month - let's get you back on track."
    ],
    'seasonal': [
      "🎄 Holiday fitness special! Get 30% off and stay healthy during the festive season.",
      "🔥 New Year, New You! Start 2024 strong with our exclusive fitness offer.",
      "💪 Summer body starts now! Get 30% off and prepare for your best season yet.",
      "🚀 Spring into action! Get 30% off and embrace the season of new beginnings."
    ]
  };
  
  return copyTemplates[campaignType as keyof typeof copyTemplates] || [
    "🎉 Exclusive offer just for you! Don't miss out on this amazing deal.",
    "🔥 Limited time offer! Take advantage of this special promotion.",
    "💪 Transform your fitness journey with this exclusive deal.",
    "🚀 Unlock your potential with this special offer."
  ];
};

export const calculateExpectedROI = async (campaignData: any): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simple ROI calculation based on campaign parameters
  const baseROI = 3.2;
  const audienceMultiplier = campaignData.audience === 'new-members' ? 1.2 : 
                            campaignData.audience === 'inactive-members' ? 1.5 : 1.0;
  const channelMultiplier = campaignData.channels.length > 2 ? 1.1 : 1.0;
  const discountMultiplier = campaignData.discount.type === 'percentage' ? 
                            (100 - campaignData.discount.value) / 100 : 0.8;
  
  return Math.round((baseROI * audienceMultiplier * channelMultiplier * discountMultiplier) * 10) / 10;
};

export const getCampaignPerformance = async (campaignId: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    id: campaignId,
    name: 'Sample Campaign',
    status: 'active',
    sent: 1250,
    opened: 784,
    clicked: 234,
    converted: 89,
    revenue: 4450,
    roi: 3.2,
    openRate: 62.7,
    clickRate: 29.8,
    conversionRate: 38.0,
    cost: 125,
    netProfit: 4325
  };
};

export const getRealTimeMetrics = async (): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    activeCampaigns: 8,
    totalRevenue: 12450,
    conversionRate: 24.5,
    membersReached: 921,
    todayConversions: 23,
    todayRevenue: 1150,
    trendingUp: true,
    lastUpdated: new Date()
  };
}; 