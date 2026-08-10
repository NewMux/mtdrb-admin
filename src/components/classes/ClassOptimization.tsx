import React from "react";
import { FiClock, FiUsers, FiTrendingUp, FiAlertCircle } from "react-icons/fi";

interface Recommendation {
  id: number;
  className: string;
  reason: string;
  impact: string;
}

interface ScheduleRecommendation extends Recommendation {
  currentTime: string;
  suggestedTime: string;
}

interface CapacityRecommendation extends Recommendation {
  currentCapacity: number;
  suggestedCapacity: number;
}

interface WaitlistRecommendation extends Recommendation {
  averageWaitlist: number;
  suggestion: string;
}

interface Props {
  // The optimization data can be passed as a prop if it&apos;s fetched from a parent component
  // For now, it&apos;s calculated within this component
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ClassOptimization(_unusedProps: Props) {
  const calculateOptimalSchedule = (): {
    recommendations: ScheduleRecommendation[];
  } => {
    // This would typically call an Assistant service to optimize the schedule
    // For now, we&apos;ll return mock data
    return {
      recommendations: [
        {
          id: 1,
          className: "Yoga Flow",
          currentTime: "Mon 9:00 AM",
          suggestedTime: "Mon 7:00 AM",
          reason: "Higher attendance potential based on member preferences",
          impact: "+25% projected attendance",
        },
        {
          id: 2,
          className: "HIIT Training",
          currentTime: "Wed 6:00 PM",
          suggestedTime: "Wed 5:30 PM",
          reason: "Better aligned with member work schedules",
          impact: "+15% projected attendance",
        },
      ],
    };
  };

  const calculateCapacityOptimization = (): {
    recommendations: CapacityRecommendation[];
  } => {
    // This would analyze historical booking data to suggest capacity changes
    return {
      recommendations: [
        {
          id: 1,
          className: "Spin Class",
          currentCapacity: 20,
          suggestedCapacity: 25,
          reason: "Consistent waitlist of 5+ people",
          impact: "+$500 monthly revenue",
        },
        {
          id: 2,
          className: "Pilates",
          currentCapacity: 15,
          suggestedCapacity: 12,
          reason: "Optimal instructor attention ratio",
          impact: "Improved satisfaction score",
        },
      ],
    };
  };

  const calculateWaitlistInsights = (): {
    recommendations: WaitlistRecommendation[];
  } => {
    // Analyze waitlist patterns and suggest improvements
    const waitlistRecommendations: WaitlistRecommendation[] = [
      {
        id: 1,
        className: "HIIT Training",
        averageWaitlist: 12,
        suggestion: "Add a second session on Tuesday evenings",
        impact: "Potential $1,200 monthly revenue",
        reason: "High demand during peak hours with consistent waitlist",
      },
      {
        id: 2,
        className: "Yoga Flow",
        averageWaitlist: 8,
        suggestion: "Increase capacity from 15 to 20 participants",
        impact: "Optimize capacity utilization",
        reason: "Room can accommodate additional participants safely",
      },
    ];
    return {
      recommendations: waitlistRecommendations,
    };
  };

  const scheduleOptimization = calculateOptimalSchedule();
  const capacityOptimization = calculateCapacityOptimization();
  const waitlistInsights = calculateWaitlistInsights();

  return (
    <div className="space-y-8">
      {/* Smart Recommendations Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Smart-Powered Optimization Insights
        </h2>
        <p className="text-blue-700">
          Our system has analyzed your class data and member behavior to provide the
          following recommendations for optimizing your class schedule and
          capacity.
        </p>
      </div>

      {/* Schedule Optimization */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiClock className="text-blue-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
              Schedule Optimization
            </h3>
          </div>
          <div className="space-y-4">
            {scheduleOptimization.recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {rec.className}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Current: {rec.currentTime}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Suggested: {rec.suggestedTime}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Capacity Optimization */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiUsers className="text-purple-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
              Capacity Optimization
            </h3>
          </div>
          <div className="space-y-4">
            {capacityOptimization.recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {rec.className}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Current Capacity: {rec.currentCapacity}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Suggested Capacity: {rec.suggestedCapacity}
                    </p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waitlist Insights */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="text-orange-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
              Waitlist Insights
            </h3>
          </div>
          <div className="space-y-4">
            {waitlistInsights.recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {rec.className}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Average Waitlist: {rec.averageWaitlist} members
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {rec.suggestion}
                    </p>
                  </div>
                  <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full">
                    {rec.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertCircle className="text-red-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
              Recommended Actions
            </h3>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-gray-700">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Review and implement schedule changes for Yoga Flow and HIIT
              Training
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Adjust Spin Class capacity and monitor satisfaction metrics
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Evaluate adding additional CrossFit session based on waitlist
              demand
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
