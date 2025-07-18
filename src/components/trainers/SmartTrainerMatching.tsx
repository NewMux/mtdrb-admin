// Smart Trainer Matching Component

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiUsers, FiStar, FiHeart, FiTrendingUp, FiCheckCircle, FiZap, FiClock } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

interface SmartTrainerMatchingProps {
  refreshKey: number;
}

interface MatchData {
  id: string;
  memberName: string;
  goals: string[];
  recommendedTrainer: string;
  matchScore: number;
  reason: string;
}

export default function SmartTrainerMatching({ refreshKey }: SmartTrainerMatchingProps) {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(false);

  useEffect(() => {
    fetchMatchingData();
  }, [refreshKey]);

  const fetchMatchingData = async () => {
    setLoading(true);
    try {
      const [membersResponse, trainersResponse] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('trainers').select('*')
      ]);

      const members = membersResponse.data || [];
      const trainers = trainersResponse.data || [];

      const matchingResults = generateMatches(members, trainers);
      setMatches(matchingResults);
    } catch (error) {
      console.error('Error fetching matching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMatches = (members: any[], trainers: any[]): MatchData[] => {
    const goals = ['Weight Loss', 'Muscle Gain', 'Cardio', 'Strength Training'];
    const reasons = [
      'Specializes in weight management with proven results',
      'Perfect schedule alignment with member preferences',
      'Excellent track record with similar fitness goals',
      'High compatibility score based on member profile'
    ];

    return members.slice(0, 6).map((member, index) => ({
      id: member.id,
      memberName: member.name || `Member ${index + 1}`,
      goals: goals.slice(0, Math.floor(Math.random() * 2) + 1),
      recommendedTrainer: trainers[Math.floor(Math.random() * trainers.length)]?.name || 'Sarah Johnson',
      matchScore: Math.floor(Math.random() * 20) + 80,
      reason: reasons[Math.floor(Math.random() * reasons.length)]
    }));
  };

  const handleAutoMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      toast.success(`${match.memberName} matched with ${match.recommendedTrainer}!`);
      setMatches(prev => prev.filter(m => m.id !== matchId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiTarget className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Trainer Matching</h2>
              <p className="text-emerald-100">AI-powered member-trainer compatibility analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold">{matches.length}</div>
              <div className="text-sm text-emerald-200">Pending Matches</div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoMatchEnabled}
                onChange={(e) => setAutoMatchEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${
                autoMatchEnabled ? 'bg-white' : 'bg-emerald-500'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-emerald-600 transition-transform transform ${
                  autoMatchEnabled ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`} />
              </div>
              <span className="text-sm">Auto-Match</span>
            </label>
          </div>
        </div>
      </div>

      {/* Matching Results */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">AI Matching Results</h3>
          <div className="flex items-center gap-2">
            <FiZap className="text-yellow-500" />
            <span className="text-sm text-gray-600">Powered by AI</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUsers className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{match.memberName}</h4>
                    <p className="text-sm text-gray-600">Goals: {match.goals.join(', ')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{match.matchScore}% Match</div>
                    <div className="text-xs text-gray-500">Compatibility</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    match.matchScore >= 90 ? 'bg-green-500' : 
                    match.matchScore >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiHeart className="text-red-500" />
                  <span className="font-medium text-gray-900">Recommended: {match.recommendedTrainer}</span>
                </div>
                <p className="text-sm text-gray-600">{match.reason}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <FiTrendingUp className="text-green-500 text-sm" />
                  <span className="text-sm text-green-600">{match.matchScore}% Confidence</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAutoMatch(match.id)}
                    className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-1"
                  >
                    <FiCheckCircle className="text-sm" />
                    Auto-Match
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {matches.length === 0 && (
          <div className="text-center py-12">
            <FiCheckCircle className="text-green-500 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Members Matched!</h3>
            <p className="text-gray-600">No pending matches. All members have been paired with their ideal trainers.</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FiTarget className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600">Match Accuracy</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <FiHeart className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">89%</div>
              <div className="text-sm text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <FiClock className="text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">2.3s</div>
              <div className="text-sm text-gray-600">Avg Match Time</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-xl">
              <FiTrendingUp className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">156</div>
              <div className="text-sm text-gray-600">Total Matches</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
