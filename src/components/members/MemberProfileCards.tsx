import React from 'react';
import { 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiCalendar, 
  FiTrendingUp, 
  FiDollarSign, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiFileText, 
  FiTarget,
  FiAward,
  FiClock,
  FiSend,
  FiArrowRight,
  FiStar,
  FiActivity,
  FiTrendingDown
} from 'react-icons/fi';

// Types for member data
interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profile_picture_url?: string;
  membership_status: 'active' | 'trial' | 'suspended' | 'cancelled' | 'expired';
  membership_plan?: string;
  membership_expiry?: string;
  created_at: string;
}

interface EngagementData {
  score: number;
  checkins_per_week: number;
  is_high_performer: boolean;
  at_risk_count: number;
}

interface BillingData {
  lifetime_value: number;
  last_payment_date?: string;
  last_payment_status: 'paid' | 'pending' | 'failed';
  total_invoices: number;
}

interface GoalData {
  primary_goal: string;
  progress_percentage: number;
  next_milestone: string;
  goal_type: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength';
}

interface RiskData {
  churn_risk_score: number;
  churn_risk_level: 'low' | 'medium' | 'high';
  active_alerts: Array<{
    id: string;
    type: 'missed_payment' | 'low_attendance' | 'expired_document';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// Profile Summary Card Component
interface ProfileSummaryCardProps {
  member: Member;
  className?: string;
}

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({ member, className = '' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'trial': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trial': return 'Trial';
      case 'suspended': return 'Suspended';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] p-6 border border-gray-100 ${className}`}>
      <div className="flex items-start space-x-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-lg ring-4 ring-blue-50">
            {member.profile_picture_url ? (
              <img 
                src={member.profile_picture_url} 
                alt={`${member.name}'s profile`}
                className="w-16 h-16 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <FiUser className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-3">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {member.name}
            </h2>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(member.membership_status)}`}>
              {getStatusText(member.membership_status)}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-5">
            {member.phone && (
              <div className="flex items-center space-x-3 text-sm text-gray-600 group">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FiPhone className="w-4 h-4 text-blue-600" />
                </div>
                <a 
                  href={`tel:${member.phone}`}
                  className="hover:text-blue-600 transition-colors font-medium"
                  aria-label={`Call ${member.name}`}
                >
                  {member.phone}
                </a>
              </div>
            )}
            {member.email && (
              <div className="flex items-center space-x-3 text-sm text-gray-600 group">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FiMail className="w-4 h-4 text-blue-600" />
                </div>
                <a 
                  href={`mailto:${member.email}`}
                  className="hover:text-blue-600 transition-colors font-medium"
                  aria-label={`Email ${member.name}`}
                >
                  {member.email}
                </a>
              </div>
            )}
          </div>

          {/* Membership Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <FiCalendar className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{member.membership_plan || 'Standard Plan'}</p>
                {member.membership_expiry && (
                  <p className="text-xs text-gray-500">Expires {new Date(member.membership_expiry).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Engagement Card Component
interface EngagementCardProps {
  data: EngagementData;
  className?: string;
}

export const EngagementCard: React.FC<EngagementCardProps> = ({ data, className = '' }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50';
    if (score >= 60) return 'bg-amber-50';
    return 'bg-red-50';
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] p-6 border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <FiTrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Engagement Overview</h3>
      </div>

      {/* Main Score */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-100"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - data.score / 100)}`}
              className={`${getScoreRingColor(data.score)} transition-all duration-1000`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-20 h-20 rounded-full ${getScoreBgColor(data.score)} flex items-center justify-center`}>
              <span className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                {data.score}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-2xl">
          <div className="text-xl font-bold text-gray-900 mb-1">{data.checkins_per_week}</div>
          <div className="text-xs text-gray-500 font-medium">Check-ins/week</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-2xl">
          {data.is_high_performer ? (
            <div className="flex flex-col items-center">
              <FiAward className="w-5 h-5 text-amber-500 mb-1" />
              <span className="text-xs font-medium text-amber-700">High Performer</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FiStar className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Standard</span>
            </div>
          )}
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-2xl">
          {data.at_risk_count > 0 ? (
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 bg-red-500 rounded-full mb-1 flex items-center justify-center">
                <span className="text-xs text-white font-bold">{data.at_risk_count}</span>
              </div>
              <span className="text-xs font-medium text-red-700">At Risk</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FiCheckCircle className="w-5 h-5 text-emerald-500 mb-1" />
              <span className="text-xs text-emerald-700">No risks</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Billing Card Component
interface BillingCardProps {
  data: BillingData;
  onViewInvoices?: () => void;
  className?: string;
}

export const BillingCard: React.FC<BillingCardProps> = ({ data, onViewInvoices, className = '' }) => {
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500';
      case 'pending': return 'bg-amber-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] p-6 border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <FiDollarSign className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Billing Summary</h3>
      </div>

      {/* Lifetime Value */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900 mb-2">
          ${data.lifetime_value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500 font-medium">Lifetime Value</div>
      </div>

      {/* Payment Info */}
      <div className="space-y-4 mb-6">
        {data.last_payment_date && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-600 font-medium">Last Payment</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor(data.last_payment_status)}`}></div>
              <span className="text-sm font-medium text-gray-900">
                {new Date(data.last_payment_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <span className="text-sm text-gray-600 font-medium">Total Invoices</span>
          <span className="text-sm font-bold text-gray-900">{data.total_invoices}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onViewInvoices}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="View all invoices"
      >
        <FiFileText className="w-4 h-4" />
        <span>View Invoices</span>
        <FiArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// Goals & Progress Card Component
interface GoalsProgressCardProps {
  data: GoalData;
  className?: string;
}

export const GoalsProgressCard: React.FC<GoalsProgressCardProps> = ({ data, className = '' }) => {
  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'weight_loss': return '⚖️';
      case 'muscle_gain': return '💪';
      case 'endurance': return '🏃';
      case 'strength': return '🏋️';
      default: return '🎯';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] p-6 border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
          <FiCheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Goals & Progress</h3>
      </div>

      {/* Goal Info */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">{getGoalIcon(data.goal_type)}</span>
          <h4 className="text-lg font-semibold text-gray-900">{data.primary_goal}</h4>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-bold text-gray-900">{data.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(data.progress_percentage)}`}
              style={{ width: `${data.progress_percentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-700 font-medium">Next milestone: {data.next_milestone}</p>
        </div>
      </div>

      {/* Progress Chart Placeholder */}
      <div className="h-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <div className="flex items-center space-x-2 text-gray-500">
          <FiActivity className="w-4 h-4" />
          <span className="text-xs font-medium">Progress trend chart</span>
        </div>
      </div>
    </div>
  );
};

// Risk & Alerts Card Component
interface RiskAlertsCardProps {
  data: RiskData;
  onSendMessage?: () => void;
  className?: string;
}

export const RiskAlertsCard: React.FC<RiskAlertsCardProps> = ({ data, onSendMessage, className = '' }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'missed_payment': return '💳';
      case 'low_attendance': return '📊';
      case 'expired_document': return '📄';
      default: return '⚠️';
    }
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] p-6 border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <FiAlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Risk & Alerts</h3>
      </div>

      {/* Churn Risk */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">Churn Risk Score</span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getRiskColor(data.churn_risk_level)}`}>
            {data.churn_risk_score}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              data.churn_risk_level === 'high' ? 'bg-red-500' :
              data.churn_risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${data.churn_risk_score}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500">
          {data.churn_risk_level === 'high' ? 'High risk of churn' :
           data.churn_risk_level === 'medium' ? 'Moderate risk' : 'Low risk'}
        </p>
      </div>

      {/* Active Alerts */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-gray-900">Active Alerts</h4>
        {data.active_alerts.length > 0 ? (
          <div className="space-y-2">
            {data.active_alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-sm">{getAlertIcon(alert.type)}</span>
                <span className="text-xs text-gray-700 flex-1 font-medium">{alert.message}</span>
                <div className={`w-2 h-2 rounded-full ${
                  alert.severity === 'high' ? 'bg-red-500' :
                  alert.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <FiCheckCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">No active alerts</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={onSendMessage}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label="Send re-engagement message"
      >
        <FiSend className="w-4 h-4" />
        <span>Send Re-engagement</span>
      </button>
    </div>
  );
};

// Loading Skeleton Components
export const ProfileCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-3xl shadow-sm p-6 animate-pulse border border-gray-100 ${className}`}>
    <div className="flex items-start space-x-5">
      <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="h-16 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>
  </div>
);

export const EngagementCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-3xl shadow-sm p-6 animate-pulse border border-gray-100 ${className}`}>
    <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
    <div className="flex justify-center mb-8">
      <div className="w-28 h-28 bg-gray-200 rounded-full"></div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-16 bg-gray-200 rounded-2xl"></div>
      <div className="h-16 bg-gray-200 rounded-2xl"></div>
      <div className="h-16 bg-gray-200 rounded-2xl"></div>
    </div>
  </div>
);

// Main Container Component
interface MemberProfileCardsProps {
  member: Member;
  engagementData: EngagementData;
  billingData: BillingData;
  goalData: GoalData;
  riskData: RiskData;
  isLoading?: boolean;
  onViewInvoices?: () => void;
  onSendMessage?: () => void;
}

export const MemberProfileCards: React.FC<MemberProfileCardsProps> = ({
  member,
  engagementData,
  billingData,
  goalData,
  riskData,
  isLoading = false,
  onViewInvoices,
  onSendMessage
}) => {
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfileCardSkeleton />
          <EngagementCardSkeleton />
          <EngagementCardSkeleton />
          <EngagementCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileSummaryCard member={member} />
        <EngagementCard data={engagementData} />
        <BillingCard data={billingData} onViewInvoices={onViewInvoices} />
        <GoalsProgressCard data={goalData} />
        <RiskAlertsCard data={riskData} onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};

export default MemberProfileCards; 