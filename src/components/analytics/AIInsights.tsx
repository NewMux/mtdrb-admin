import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiTrendingUp, FiUsers, FiDollarSign, FiCalendar, FiTarget, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { SmartButton } from '../ui/DesignSystem';

interface Insight {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  action: string;
  category: string;
}

interface AIInsightsProps {
  insights: Insight[];
  onActionClick: (id: string, action: string) => void;
}

const InsightCard = ({ insight, onActionClick }: { insight: Insight; onActionClick: (id: string, action: string) => void }) => {
  const getPriorityColor = () => {
    switch (insight.priority) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-orange-500';
      case 'low':
        return 'border-emerald-500';
      default:
        return 'border-gray-500';
    }
  };

  const getIcon = () => {
    switch (insight.category) {
      case 'revenue':
        return <FiZap className="w-6 h-6 text-emerald-600" />;
      case 'members':
        return <FiCheckCircle className="w-6 h-6 text-blue-600" />;
      case 'operations':
        return <FiAlertCircle className="w-6 h-6 text-orange-600" />;
      default:
        return <FiZap className="w-6 h-6 text-gray-600" />;
    }
  };

  const getPriorityBadgeColor = () => {
    switch (insight.priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-l-4 ${getPriorityColor()} hover:shadow-md transition-all duration-300 ease-in-out`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gray-50">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 tracking-tight">{insight.title}</h3>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeColor()}`}>
          {insight.priority}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{insight.impact}</span>
        <SmartButton
          onClick={() => onActionClick(insight.id, insight.action)}
          variant="primary"
          size="sm"
          className="text-xs"
        >
          {insight.action}
          <FiTrendingUp className="w-3 h-3 ml-1" />
        </SmartButton>
      </div>
    </motion.div>
  );
};

const AskAIModal = ({ isOpen, onClose, onSubmit }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (question: string) => void; 
}) => {
  const [question, setQuestion] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiZap className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Ask AI Assistant</h2>
        </div>
        
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your gym analytics... e.g., 'Why did revenue drop last week?'"
          className="w-full p-4 border border-gray-300 rounded-xl resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <div className="flex gap-3 mt-6">
          <SmartButton
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </SmartButton>
          <SmartButton
            onClick={() => {
              onSubmit(question);
              setQuestion('');
              onClose();
            }}
            variant="primary"
            className="flex-1"
            disabled={!question.trim()}
          >
            Ask AI
          </SmartButton>
        </div>
      </motion.div>
    </div>
  );
};

export default function AIInsights({ insights, onActionClick }: AIInsightsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAskAI = async (question: string) => {
    setIsLoading(true);
    try {
      // Simulate AI API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI response based on question
      let response = '';
      if (question.toLowerCase().includes('revenue')) {
        response = 'Based on your revenue data, I can see a 12.5% increase this month. The main drivers are increased membership signups and higher average transaction values. Consider focusing on retention strategies to maintain this growth.';
      } else if (question.toLowerCase().includes('member')) {
        response = 'Your member analytics show 18 at-risk members who haven\'t attended in 2+ weeks. I recommend sending personalized re-engagement campaigns and offering special incentives to bring them back.';
      } else if (question.toLowerCase().includes('class')) {
        response = 'Class attendance is at 85% average, which is good. However, evening classes (6-8 PM) are consistently full. Consider adding more sessions during peak hours to maximize capacity utilization.';
      } else {
        response = 'I\'ve analyzed your gym\'s performance data. Overall, you\'re showing positive trends with room for optimization. Would you like me to dive deeper into any specific area?';
      }
      
      setAiResponse(response);
      console.log('AI Question:', question);
      console.log('AI Response:', response);
    } catch (error) {
      console.error('AI query failed:', error);
      setAiResponse('Sorry, I encountered an error processing your question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add null/undefined check
  if (!insights || !Array.isArray(insights)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiZap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Insights That Matter</h2>
              <p className="text-sm text-gray-600">AI-powered recommendations for your business</p>
            </div>
          </div>
          <SmartButton
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            icon={<FiZap className="w-4 h-4" />}
          >
            Ask AI
          </SmartButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-48 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                <div className="w-24 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <AskAIModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAskAI}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiZap className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Insights That Matter</h2>
            <p className="text-sm text-gray-600">AI-powered recommendations for your business</p>
          </div>
        </div>
        <SmartButton
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<FiZap className="w-4 h-4" />}
        >
          Ask AI
        </SmartButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <InsightCard insight={insight} onActionClick={onActionClick} />
          </motion.div>
        ))}
      </div>

      <AskAIModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAskAI}
      />
    </div>
  );
}

// Default insights for demonstration
export const defaultInsights: Insight[] = [
  {
    id: '1',
    title: 'Revenue Drop Detected',
    description: 'Revenue dropped 9% compared to last week. This could be due to reduced class attendance.',
    priority: 'high',
    impact: 'High Impact',
    action: 'See Details',
    category: 'revenue'
  },
  {
    id: '2',
    title: 'At-Risk Members',
    description: '18 members flagged as at-risk. They haven\'t attended classes in 2+ weeks.',
    priority: 'medium',
    impact: 'Medium Impact',
    action: 'Start Campaign',
    category: 'members'
  },
  {
    id: '3',
    title: 'Peak Hours Identified',
    description: '6-8 PM classes are consistently full. Consider adding more sessions.',
    priority: 'high',
    impact: 'High Impact',
    action: 'Optimize Schedule',
    category: 'operations'
  },
  {
    id: '4',
    title: 'Trainer Performance',
    description: 'Sarah Ahmed has the highest retention rate. Consider promoting her classes.',
    priority: 'medium',
    impact: 'Medium Impact',
    action: 'View Stats',
    category: 'members'
  },
  {
    id: '5',
    title: 'New Signups Up',
    description: '15% increase in new signups this week. Your marketing campaign is working!',
    priority: 'low',
    impact: 'High Impact',
    action: 'View Campaign',
    category: 'revenue'
  },
  {
    id: '6',
    title: 'Equipment Maintenance',
    description: 'Treadmill #3 needs maintenance. 3 members reported issues.',
    priority: 'medium',
    impact: 'Low Impact',
    action: 'Schedule Repair',
    category: 'operations'
  }
]; 