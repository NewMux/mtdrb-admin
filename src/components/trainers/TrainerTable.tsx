import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiTarget, 
  FiEdit2, FiTrash2, FiEye, FiDownload, FiSend, FiStar 
} from 'react-icons/fi';
import { SmartButton } from '../ui/DesignSystem';

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  rating: number;
  status: 'active' | 'inactive' | 'busy' | 'available';
  classes: number;
  experience: string;
  avatar: string;
}

interface TrainerTableProps {
  trainers?: Trainer[];
  onEdit?: (trainer: Trainer) => void;
  onDelete?: (trainer: Trainer) => void;
  onView?: (trainer: Trainer) => void;
  onAssign?: (trainer: Trainer) => void;
  onMessage?: (trainer: Trainer) => void;
  onSchedule?: (trainer: Trainer) => void;
}

const TrainerTable: React.FC<TrainerTableProps> = ({
  trainers = [],
  onEdit,
  onDelete,
  onView,
  onAssign,
  onMessage,
  onSchedule
}) => {
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'available':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
      case 'busy':
        return 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case 'Yoga & Pilates':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'HIIT & Cardio':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'Strength Training':
        return 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200';
      case 'CrossFit':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'Zumba & Dance':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : i < rating 
              ? 'text-yellow-400 fill-current opacity-50' 
              : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  // Ensure trainers is always an array
  const safeTrainers = Array.isArray(trainers) ? trainers : [];

  if (safeTrainers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <FiUser className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No trainers found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Get started by adding your first trainer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              Trainer
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              Specialty
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {safeTrainers.map((trainer, index) => (
            <motion.tr
              key={trainer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 ${
                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
              }`}
              onMouseEnter={() => setHoveredRow(trainer.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{trainer.avatar}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {trainer.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {trainer.experience} experience
                    </div>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-900 dark:text-white">{trainer.email}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{trainer.phone}</div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecialtyColor(trainer.specialty)}`}>
                  {trainer.specialty}
                </span>
              </td>
              
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {renderStars(trainer.rating)}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {trainer.rating}
                  </span>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trainer.status)}`}>
                    {trainer.status.charAt(0).toUpperCase() + trainer.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {trainer.classes} classes
                  </span>
                </div>
              </td>
              
              <td className="px-6 py-4 text-right">
                <div className={`flex items-center justify-end space-x-2 transition-opacity duration-200 ${
                  hoveredRow === trainer.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <SmartButton size="sm" variant="ghost" icon={<FiEye size={16} />} title="View" onClick={e => { e.stopPropagation(); /* TODO: View handler */ }} />
                  <SmartButton size="sm" variant="ghost" icon={<FiEdit2 size={16} />} title="Edit" onClick={e => { e.stopPropagation(); /* TODO: Edit handler */ }} />
                  <SmartButton size="sm" variant="ghost" icon={<FiSend size={16} />} title="Send Message" onClick={e => { e.stopPropagation(); /* TODO: Message handler */ }} />
                  <SmartButton size="sm" variant="danger" icon={<FiTrash2 size={16} />} title="Delete" onClick={e => { e.stopPropagation(); /* TODO: Delete handler */ }} />
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainerTable; 