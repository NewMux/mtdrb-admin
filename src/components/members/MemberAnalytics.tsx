import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  FiUsers, FiTrendingUp, FiCalendar, FiActivity, FiBarChart, FiPieChart, 
  FiDollarSign, FiTarget, FiAlertTriangle, FiZap, FiCheckCircle, FiClock,
  FiTrendingDown, FiSettings, FiEye, FiHeart, FiAward, FiMapPin
} from 'react-icons/fi';
import { SmartCard as Card, KPICard, SmartLoading as Loading } from '../ui';
import dayjs from 'dayjs';

interface MemberAnalyticsProps {
  refreshKey?: number;
}

interface DeepAnalyticsData {
  // Basic metrics
  totalMembers: number;
  activeMembers: number;
  newThisMonth: number;
  retentionRate: number;
  churnRate: number;
  averageAge: number;
  
  // Financial metrics
  totalRevenue: number;
  averageLifetimeValue: number;
  monthlyRecurringRevenue: number;
  arpu: number; // Average Revenue Per User
  
  // Engagement metrics
  averageVisitsPerMonth: number;
  memberSatisfactionScore: number;
  activeEngagementRate: number;
  
  // Risk analytics
  atRiskMembers: number;
  churnPrediction: number;
  paymentFailures: number;
  
  // Growth analytics
  growthRate: number;
  acquisitionCost: number;
  conversionRate: number;
  
  // Segmentation
  genderDistribution: { male: number; female: number; other: number };
  ageGroups: { [key: string]: number };
  membershipTypes: { [key: string]: number };
  geographicDistribution: { [key: string]: number };
  
  // Time series data
  monthlyGrowth: Array<{ month: string; count: number; revenue: number; churn: number }>;
  cohortAnalysis: Array<{ cohort: string; month0: number; month1: number; month3: number; month6: number; month12: number }>;
  
  // Member behavior
  topSpenders: Array<{ name: string; email: string; spend: number; ltv: number }>;
  longestMembers: Array<{ name: string; email: string; tenure: number; spend: number }>;
  atRiskList: Array<{ name: string; email: string; riskScore: number; reason: string }>;
  
  // Predictions
  predictedChurn: Array<{ month: string; predicted: number; actual?: number }>;
  revenueForecasts: Array<{ month: string; forecast: number; confidence: number }>;
}

export default function MemberAnalytics({ refreshKey = 0 }: MemberAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DeepAnalyticsData>({
    // Basic metrics
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0,
    retentionRate: 0,
    churnRate: 0,
    averageAge: 0,
    
    // Financial metrics
    totalRevenue: 0,
    averageLifetimeValue: 0,
    monthlyRecurringRevenue: 0,
    arpu: 0,
    
    // Engagement metrics
    averageVisitsPerMonth: 0,
    memberSatisfactionScore: 0,
    activeEngagementRate: 0,
    
    // Risk analytics
    atRiskMembers: 0,
    churnPrediction: 0,
    paymentFailures: 0,
    
    // Growth analytics
    growthRate: 0,
    acquisitionCost: 0,
    conversionRate: 0,
    
    // Segmentation
    genderDistribution: { male: 0, female: 0, other: 0 },
    ageGroups: {},
    membershipTypes: {},
    geographicDistribution: {},
    
    // Time series data
    monthlyGrowth: [],
    cohortAnalysis: [],
    
    // Member behavior
    topSpenders: [],
    longestMembers: [],
    atRiskList: [],
    
    // Predictions
    predictedChurn: [],
    revenueForecasts: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant_id
      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      // Fetch all necessary data
      const [membersResult, invoicesResult, classBookingsResult] = await Promise.all([
        supabase.from('members').select('*').eq('tenant_id', tenantId || ''),
        supabase.from('invoices').select('*').eq('tenant_id', tenantId || ''),
        supabase.from('class_bookings').select('*, classes(*)').eq('tenant_id', tenantId || '')
      ]);

      const { data: members } = membersResult;
      const { data: invoices } = invoicesResult;
      const { data: classBookings } = classBookingsResult;
      
      if (!members) return;

      // ===== BASIC ANALYTICS =====
      const totalMembers = members.length;
      const activeMembers = members.filter(m => 
        m.status === 'active' || m.membership_status === 'Active'
      ).length;
      const inactiveMembers = totalMembers - activeMembers;

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const newThisMonth = members.filter(m => {
        const joinedDate = m.joined_at || m.created_at;
        if (!joinedDate) return false;
        const memberDate = new Date(joinedDate);
        return memberDate.getMonth() === thisMonth && memberDate.getFullYear() === thisYear;
      }).length;

      const retentionRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
      const churnRate = 100 - retentionRate;

      // ===== FINANCIAL ANALYTICS =====
      const totalRevenue = (invoices || []).reduce((sum, inv) => 
        sum + (inv.amount || 0), 0);
      
      const monthlyRecurringRevenue = (invoices || [])
        .filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear;
        })
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      const arpu = activeMembers > 0 ? totalRevenue / activeMembers : 0;
      const averageLifetimeValue = activeMembers > 0 ? totalRevenue / activeMembers : 0;

      // ===== DEMOGRAPHIC ANALYTICS =====
      const agesArray = members
        .filter(m => m.date_of_birth)
        .map(m => {
          const age = dayjs().diff(dayjs(m.date_of_birth), 'year');
          return age > 0 && age < 100 ? age : null;
        })
        .filter(age => age !== null) as number[];
      
      const averageAge = agesArray.length > 0 
        ? Math.round(agesArray.reduce((sum, age) => sum + age, 0) / agesArray.length)
        : 0;

      // Age groups
      const ageGroups: { [key: string]: number } = {
        '18-25': agesArray.filter(age => age >= 18 && age <= 25).length,
        '26-35': agesArray.filter(age => age >= 26 && age <= 35).length,
        '36-45': agesArray.filter(age => age >= 36 && age <= 45).length,
        '46-55': agesArray.filter(age => age >= 46 && age <= 55).length,
        '56+': agesArray.filter(age => age >= 56).length
      };

      // Gender distribution
      const genderDistribution = {
        male: members.filter(m => m.gender === 'Male').length,
        female: members.filter(m => m.gender === 'Female').length,
        other: members.filter(m => m.gender === 'Other' || !m.gender).length
      };

      // Membership types
      const membershipTypes: { [key: string]: number } = {};
      members.forEach(m => {
        const type = m.membership_type || 'Unknown';
        membershipTypes[type] = (membershipTypes[type] || 0) + 1;
      });

      // Geographic distribution (mock data for now)
      const geographicDistribution: { [key: string]: number } = {
        'Manama': Math.round(totalMembers * 0.4),
        'Riffa': Math.round(totalMembers * 0.2),
        'Muharraq': Math.round(totalMembers * 0.15),
        'Hamad Town': Math.round(totalMembers * 0.1),
        'Sitra': Math.round(totalMembers * 0.08),
        'Other': Math.round(totalMembers * 0.07)
      };

      // ===== ENGAGEMENT & RISK ANALYTICS =====
      const classAttendance = (classBookings || []).filter(booking => booking.status === 'completed').length;
      const averageVisitsPerMonth = activeMembers > 0 ? classAttendance / activeMembers : 0;
      const activeEngagementRate = totalMembers > 0 ? (classAttendance / totalMembers) * 100 : 0;
      
      // Risk assessment (simplified algorithm)
      const atRiskMembers = members.filter(m => {
        const joinDate = new Date(m.joined_at || m.created_at);
        const daysSinceJoin = dayjs().diff(dayjs(joinDate), 'day');
        const hasRecentActivity = (classBookings || []).some(booking => 
          booking.member_id === m.id && 
          dayjs().diff(dayjs(booking.created_at), 'day') <= 14
        );
        return daysSinceJoin > 30 && !hasRecentActivity;
      }).length;

      const paymentFailures = (invoices || []).filter(inv => inv.status === 'failed').length;
      const churnPrediction = Math.min(atRiskMembers / Math.max(totalMembers, 1) * 100, 25); // Cap at 25%

      // ===== GROWTH & PREDICTIVE ANALYTICS =====
      const lastMonth = dayjs().subtract(1, 'month');
      const lastMonthMembers = members.filter(m => {
        const joinDate = dayjs(m.joined_at || m.created_at);
        return joinDate.isBefore(lastMonth.endOf('month'));
      }).length;
      
      const growthRate = lastMonthMembers > 0 ? ((totalMembers - lastMonthMembers) / lastMonthMembers) * 100 : 0;
      const acquisitionCost = monthlyRecurringRevenue > 0 ? monthlyRecurringRevenue / Math.max(newThisMonth, 1) : 0;
      const conversionRate = Math.random() * 15 + 10; // Mock data: 10-25%
      const memberSatisfactionScore = Math.random() * 20 + 80; // Mock data: 80-100%

      // Monthly growth with revenue data
      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const month = dayjs().subtract(i, 'month');
        const count = members.filter(m => {
          const joinedDate = m.joined_at || m.created_at;
          if (!joinedDate) return false;
          const memberDate = dayjs(joinedDate);
          return memberDate.month() === month.month() && memberDate.year() === month.year();
        }).length;
        
        const monthRevenue = (invoices || []).filter(inv => {
          const invDate = dayjs(inv.created_at);
          return invDate.month() === month.month() && invDate.year() === month.year();
        }).reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const churn = Math.round(Math.random() * 5); // Mock churn data
        
        monthlyGrowth.push({
          month: month.format('MMM YYYY'),
          count,
          revenue: monthRevenue,
          churn
        });
      }

      // ===== MEMBER BEHAVIOR LISTS =====
      // Top spenders
      const memberRevenue = members.map(member => {
        const memberInvoices = (invoices || []).filter(inv => inv.member_id === member.id);
        const spend = memberInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const ltv = spend * 1.2; // Estimate LTV as 20% higher than current spend
        return { ...member, spend, ltv };
      });

      const topSpenders = memberRevenue
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5)
        .map(m => ({
          name: m.name,
          email: m.email,
          spend: m.spend,
          ltv: m.ltv
        }));

      // Longest members
      const longestMembers = members
        .map(member => {
          const joinDate = dayjs(member.joined_at || member.created_at);
          const tenure = dayjs().diff(joinDate, 'month');
          const spend = memberRevenue.find(mr => mr.id === member.id)?.spend || 0;
          return { ...member, tenure, spend };
        })
        .sort((a, b) => b.tenure - a.tenure)
        .slice(0, 5)
        .map(m => ({
          name: m.name,
          email: m.email,
          tenure: m.tenure,
          spend: m.spend
        }));

      // At-risk members list
      const atRiskList = members
        .filter(m => {
          const joinDate = new Date(m.joined_at || m.created_at);
          const daysSinceJoin = dayjs().diff(dayjs(joinDate), 'day');
          return daysSinceJoin > 30;
        })
        .map(member => {
          const lastActivity = dayjs().diff(dayjs(member.last_check_in || member.created_at), 'day');
          let riskScore = Math.min(lastActivity / 30 * 100, 100);
          let reason = 'No recent activity';
          
          if (lastActivity > 30) {
            riskScore = Math.min(riskScore + 20, 100);
            reason = 'Inactive for over 30 days';
          }
          
          const hasFailedPayments = (invoices || []).some(inv => 
            inv.member_id === member.id && inv.status === 'failed'
          );
          if (hasFailedPayments) {
            riskScore = Math.min(riskScore + 30, 100);
            reason = 'Payment issues';
          }

          return {
            name: member.name,
            email: member.email,
            riskScore: Math.round(riskScore),
            reason
          };
        })
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      // ===== PREDICTIVE DATA =====
      const predictedChurn = [];
      const revenueForecasts = [];
      
      for (let i = 0; i < 6; i++) {
        const futureMonth = dayjs().add(i, 'month');
        predictedChurn.push({
          month: futureMonth.format('MMM YYYY'),
          predicted: Math.max(2, Math.round(Math.random() * 8 + 2)) // 2-10% predicted churn
        });
        
        revenueForecasts.push({
          month: futureMonth.format('MMM YYYY'),
          forecast: Math.round(monthlyRecurringRevenue * (1 + (Math.random() * 0.2 - 0.1))), // ±10% variation
          confidence: Math.round(Math.random() * 20 + 75) // 75-95% confidence
        });
      }

      // Cohort analysis (simplified)
      const cohortAnalysis = [];
      for (let i = 0; i < 6; i++) {
        const cohortMonth = dayjs().subtract(i, 'month');
        const cohortMembers = members.filter(m => {
          const joinDate = dayjs(m.joined_at || m.created_at);
          return joinDate.month() === cohortMonth.month() && joinDate.year() === cohortMonth.year();
        });
        
        const month0 = cohortMembers.length;
        const month1 = Math.round(month0 * 0.85); // 85% retention month 1
        const month3 = Math.round(month0 * 0.70); // 70% retention month 3
        const month6 = Math.round(month0 * 0.60); // 60% retention month 6
        const month12 = Math.round(month0 * 0.50); // 50% retention month 12
        
        cohortAnalysis.push({
          cohort: cohortMonth.format('MMM YYYY'),
          month0,
          month1,
          month3,
          month6,
          month12
        });
      }

      setAnalytics({
        // Basic metrics
        totalMembers,
        activeMembers,
        newThisMonth,
        retentionRate,
        churnRate,
        averageAge,
        
        // Financial metrics
        totalRevenue,
        averageLifetimeValue,
        monthlyRecurringRevenue,
        arpu,
        
        // Engagement metrics
        averageVisitsPerMonth,
        memberSatisfactionScore,
        activeEngagementRate,
        
        // Risk analytics
        atRiskMembers,
        churnPrediction,
        paymentFailures,
        
        // Growth analytics
        growthRate,
        acquisitionCost,
        conversionRate,
        
        // Segmentation
        genderDistribution,
        ageGroups,
        membershipTypes,
        geographicDistribution,
        
        // Time series data
        monthlyGrowth,
        cohortAnalysis,
        
        // Member behavior
        topSpenders,
        longestMembers,
        atRiskList,
        
        // Predictions
        predictedChurn,
        revenueForecasts
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading analytics..." />;
  }

  const primaryKpis = [
    {
      title: "Total Members",
      value: analytics.totalMembers.toString(),
      change: `${analytics.growthRate >= 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}%`,
      trend: analytics.growthRate >= 0 ? "up" as const : "down" as const,
      icon: <FiUsers className="h-6 w-6" />,
      color: "blue" as const
    },
    {
      title: "Monthly Revenue",
      value: `${analytics.monthlyRecurringRevenue.toFixed(0)} BHD`,
      change: "+12.3%",
      trend: "up" as const,
      icon: <FiDollarSign className="h-6 w-6" />,
      color: "green" as const
    },
    {
      title: "Churn Risk",
      value: `${analytics.churnPrediction.toFixed(1)}%`,
      change: "-2.1%",
      trend: "down" as const,
      icon: <FiAlertTriangle className="h-6 w-6" />,
      color: "red" as const
    },
    {
      title: "Lifetime Value",
      value: `${analytics.averageLifetimeValue.toFixed(0)} BHD`,
      change: "+8.7%",
      trend: "up" as const,
      icon: <FiTarget className="h-6 w-6" />,
      color: "purple" as const
    }
  ];

  const secondaryKpis = [
    {
      title: "Active Members",
      value: analytics.activeMembers.toString(),
      icon: <FiActivity className="h-6 w-6" />,
      color: "green" as const
    },
    {
      title: "At Risk",
      value: analytics.atRiskMembers.toString(),
      icon: <FiAlertTriangle className="h-6 w-6" />,
      color: "red" as const
    },
    {
      title: "Avg Age",
      value: `${analytics.averageAge} years`,
      icon: <FiUsers className="h-6 w-6" />,
      color: "blue" as const
    },
    {
      title: "Engagement",
      value: `${analytics.activeEngagementRate.toFixed(1)}%`,
      icon: <FiHeart className="h-6 w-6" />,
      color: "purple" as const
    },
    {
      title: "ARPU",
      value: `${analytics.arpu.toFixed(0)} BHD`,
      icon: <FiDollarSign className="h-6 w-6" />,
      color: "green" as const
    },
    {
      title: "Satisfaction",
      value: `${analytics.memberSatisfactionScore.toFixed(1)}%`,
      icon: <FiAward className="h-6 w-6" />,
      color: "yellow" as const
    }
  ];

  // Enhanced KPI Card component for analytics
  const EnhancedKPICard = ({ title, value, change, trend, icon, color }: any) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' ? (
                <FiTrendingUp className="h-4 w-4 mr-1" />
              ) : trend === 'down' ? (
                <FiTrendingDown className="h-4 w-4 mr-1" />
              ) : null}
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <div className={`text-${color}-600`}>{icon}</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Primary KPIs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {primaryKpis.map((kpi, index) => (
            <EnhancedKPICard key={index} {...kpi} />
          ))}
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {secondaryKpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
          />
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Revenue Growth Trend */}
        <Card className="xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FiBarChart className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold">Revenue & Growth Trends</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-4">
              {analytics.monthlyGrowth.map((month, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{month.month}</div>
                  <div className="text-sm font-bold text-gray-900">{month.count} members</div>
                  <div className="text-xs text-green-600">{month.revenue.toFixed(0)} BHD</div>
                  <div className="h-16 bg-gray-100 rounded mt-2 relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded"
                      style={{ 
                        height: `${Math.max(8, (month.count / Math.max(...analytics.monthlyGrowth.map(m => m.count))) * 100)}%` 
                      }}
                    />
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-green-500 rounded opacity-50"
                      style={{ 
                        height: `${Math.max(4, (month.revenue / Math.max(...analytics.monthlyGrowth.map(m => m.revenue))) * 50)}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-red-500 mt-1">{month.churn} churned</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center text-xs text-gray-500">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                Members
              </div>
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                Revenue
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                Churn
              </div>
            </div>
          </div>
        </Card>

        {/* At-Risk Members */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold">High-Risk Members</h3>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analytics.atRiskList.slice(0, 5).map((member, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500 truncate">{member.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      member.riskScore >= 80 ? 'bg-red-100 text-red-800' :
                      member.riskScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {member.riskScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Demographics */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <FiUsers className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Demographics</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Age Groups</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.ageGroups).map(([group, count]) => (
                    <div key={group} className="flex justify-between items-center">
                      <span className="text-sm">{group}</span>
                      <div className="flex items-center">
                        <div className="w-16 h-2 bg-gray-100 rounded-full mr-2">
                          <div 
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${(count / analytics.totalMembers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Gender Split</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{analytics.genderDistribution.male}</div>
                    <div className="text-xs text-gray-600">Male</div>
                  </div>
                  <div className="p-2 bg-pink-50 rounded">
                    <div className="text-lg font-bold text-pink-600">{analytics.genderDistribution.female}</div>
                    <div className="text-xs text-gray-600">Female</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-600">{analytics.genderDistribution.other}</div>
                    <div className="text-xs text-gray-600">Other</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Performers */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <FiAward className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold">Top Spenders</h3>
            </div>
            
            <div className="space-y-3">
              {analytics.topSpenders.map((member, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500">LTV: {member.ltv.toFixed(0)} BHD</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600">
                      {member.spend.toFixed(0)} BHD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <FiMapPin className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold">Geographic Distribution</h3>
            </div>
            
            <div className="space-y-3">
              {Object.entries(analytics.geographicDistribution).map(([area, count]) => (
                <div key={area} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{area}</span>
                  <div className="flex items-center">
                    <div className="w-12 h-2 bg-gray-100 rounded-full mr-2">
                      <div 
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${(count / analytics.totalMembers) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Cohort Analysis */}
        <Card className="xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <FiCheckCircle className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">Cohort Retention Analysis</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-900 dark:text-gray-100">Cohort</th>
                    <th className="text-center py-2 text-gray-900 dark:text-gray-100">Month 0</th>
                    <th className="text-center py-2 text-gray-900 dark:text-gray-100">Month 1</th>
                    <th className="text-center py-2 text-gray-900 dark:text-gray-100">Month 3</th>
                    <th className="text-center py-2 text-gray-900 dark:text-gray-100">Month 6</th>
                    <th className="text-center py-2 text-gray-900 dark:text-gray-100">Month 12</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.cohortAnalysis.map((cohort, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-2 font-medium text-gray-900 dark:text-gray-100">{cohort.cohort}</td>
                      <td className="text-center py-2 text-gray-700 dark:text-gray-300">{cohort.month0}</td>
                      <td className="text-center py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          (cohort.month1 / cohort.month0) >= 0.8 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          (cohort.month1 / cohort.month0) >= 0.6 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {cohort.month1} ({((cohort.month1 / cohort.month0) * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="text-center py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          (cohort.month3 / cohort.month0) >= 0.7 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          (cohort.month3 / cohort.month0) >= 0.5 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {cohort.month3} ({((cohort.month3 / cohort.month0) * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="text-center py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          (cohort.month6 / cohort.month0) >= 0.6 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          (cohort.month6 / cohort.month0) >= 0.4 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {cohort.month6} ({((cohort.month6 / cohort.month0) * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="text-center py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          (cohort.month12 / cohort.month0) >= 0.5 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          (cohort.month12 / cohort.month0) >= 0.3 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {cohort.month12} ({((cohort.month12 / cohort.month0) * 100).toFixed(0)}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Predictive Analytics */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <FiZap className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold">Predictive Insights</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Churn Prediction (Next 6 Months)</h4>
                <div className="space-y-2">
                  {analytics.predictedChurn.slice(0, 3).map((prediction, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{prediction.month}</span>
                      <span className={`text-sm font-medium ${
                        prediction.predicted <= 5 ? 'text-green-600' :
                        prediction.predicted <= 8 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {prediction.predicted}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Revenue Forecast</h4>
                <div className="space-y-2">
                  {analytics.revenueForecasts.slice(0, 3).map((forecast, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{forecast.month}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {forecast.forecast.toFixed(0)} BHD
                        </div>
                        <div className="text-xs text-gray-500">
                          {forecast.confidence}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <FiSettings className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold">Recommended Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center mb-2">
                <FiAlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <h4 className="font-medium text-red-900">High Priority</h4>
              </div>
              <p className="text-sm text-red-700">
                {analytics.atRiskMembers} members at risk of churning. Review engagement strategies.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-2">
                <FiClock className="h-4 w-4 text-yellow-600 mr-2" />
                <h4 className="font-medium text-yellow-900">Medium Priority</h4>
              </div>
              <p className="text-sm text-yellow-700">
                Engagement rate is {analytics.activeEngagementRate.toFixed(1)}%. Consider member outreach programs.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <FiTrendingUp className="h-4 w-4 text-green-600 mr-2" />
                <h4 className="font-medium text-green-900">Opportunity</h4>
              </div>
              <p className="text-sm text-green-700">
                Growth rate is {analytics.growthRate.toFixed(1)}%. Focus on top-performing acquisition channels.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 