import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiTarget, FiHeart, FiFileText, FiActivity, FiTrendingUp, FiClock } from 'react-icons/fi';
import { SmartModal } from '../../ui/SmartModal';
import { SmartButton } from '../../ui/DesignSystem';
import { MockMember } from '../../../hooks/useMockMembers';

interface ViewMemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: MockMember | null;
  modalRef?: React.RefObject<HTMLDivElement>;
}

const ViewMemberProfileModal: React.FC<ViewMemberProfileModalProps> = ({
  isOpen,
  onClose,
  member,
  modalRef
}) => {
  if (!member) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'pending':
        return 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'Premium':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'Standard':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
      case 'Basic':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'VIP':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Student':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title="Member Profile"
          subtitle={`Viewing profile for ${member.name}`}
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="ghost" onClick={onClose}>
                Close
              </SmartButton>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Header with Avatar and Basic Info */}
            <div className="bg-gradient-to-r from-sky-50 to-rose-50 dark:from-sky-900/20 dark:to-rose-900/20 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{member.avatar}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{member.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMembershipColor(member.membershipType)}`}>
                      {member.membershipType}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFitnessLevelColor(member.fitness_level || 'beginner')}`}>
                      {member.fitness_level?.charAt(0).toUpperCase() + member.fitness_level?.slice(1) || 'Beginner'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiUser className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiMail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{member.email}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiPhone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{member.phone}</p>
                </div>

                {member.address && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiMapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{member.address}</p>
                  </div>
                )}

                {member.emergency_contact && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiPhone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{member.emergency_contact}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Membership Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiCalendar className="w-5 h-5 mr-2" />
                Membership Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiCalendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Join Date</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(member.joinDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiActivity className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Visit</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {member.lastVisit === 'Never' ? 'Never' : new Date(member.lastVisit).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiTrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Membership Type</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{member.membershipType}</p>
                </div>
              </div>
            </div>

            {/* Fitness Profile */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiTarget className="w-5 h-5 mr-2" />
                Fitness Profile
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.goals && member.goals.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiTarget className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fitness Goals</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.goals.map((goal, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.health_conditions && member.health_conditions.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiHeart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Health Conditions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.health_conditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trainer Assignment */}
            {member.trainer_id && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FiUser className="w-5 h-5 mr-2" />
                  Personal Trainer
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-400 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">PT</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Personal Trainer</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Assigned trainer ID: {member.trainer_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {member.notes && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FiFileText className="w-5 h-5 mr-2" />
                  Notes
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{member.notes}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <SmartButton
                variant="secondary"
                onClick={onClose}
              >
                Close
              </SmartButton>
            </div>
          </div>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default ViewMemberProfileModal; 