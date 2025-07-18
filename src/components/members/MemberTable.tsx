import * as React from 'react';
import { motion } from 'framer-motion';
import { FiMoreHorizontal, FiEdit, FiTrash2, FiEye, FiMail, FiPhone, FiUser, FiChevronUp, FiChevronDown, FiSearch } from 'react-icons/fi';
import { MockMember } from '../../hooks/useMockMembers';
import { SmartButton } from '../ui/DesignSystem';

interface MemberTableProps {
  members: MockMember[];
  onEdit?: (member: MockMember) => void;
  onDelete?: (member: MockMember) => void;
  onView?: (member: MockMember) => void;
  onAssignTrainer?: (member: MockMember) => void;
  loading?: boolean;
  sortBy?: keyof MockMember;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: keyof MockMember) => void;
}

const MemberTable: React.FC<MemberTableProps> = ({
  members,
  onEdit,
  onDelete,
  onView,
  onAssignTrainer,
  loading = false,
  sortBy,
  sortOrder,
  onSort
}) => {
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);
  const [focusedRow, setFocusedRow] = React.useState<string | null>(null);

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

  const handleSort = (field: keyof MockMember) => {
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field: keyof MockMember) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />;
  };

  const getSortLabel = (field: keyof MockMember) => {
    const currentSort = sortBy === field ? sortOrder : 'none';
    return `${field} sorted ${currentSort}`;
  };

  // Enhanced loading state with better UX
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading members...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Please wait while we fetch the latest data</p>
        </div>
      </div>
    );
  }

  // Enhanced empty state with better messaging
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FiUser className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Try adjusting your search or filter criteria to find what you're looking for.
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <FiSearch className="w-4 h-4" />
          <span>Use the search bar above to find specific members</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="Members table">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th 
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                scope="col"
              >
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel('name')}
                  aria-sort={sortBy === 'name' ? sortOrder : 'none'}
                >
                  <span>Member</span>
                  {getSortIcon('name')}
                </button>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                scope="col"
              >
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel('email')}
                  aria-sort={sortBy === 'email' ? sortOrder : 'none'}
                >
                  <span>Contact</span>
                  {getSortIcon('email')}
                </button>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                scope="col"
              >
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel('status')}
                  aria-sort={sortBy === 'status' ? sortOrder : 'none'}
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                scope="col"
              >
                <button
                  onClick={() => handleSort('membershipType')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel('membershipType')}
                  aria-sort={sortBy === 'membershipType' ? sortOrder : 'none'}
                >
                  <span>Membership</span>
                  {getSortIcon('membershipType')}
                </button>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                scope="col"
              >
                <button
                  onClick={() => handleSort('lastVisit')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel('lastVisit')}
                  aria-sort={sortBy === 'lastVisit' ? sortOrder : 'none'}
                >
                  <span>Last Visit</span>
                  {getSortIcon('lastVisit')}
                </button>
              </th>
              <th 
                className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300"
                scope="col"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {members.map((member, index) => (
              <motion.tr
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 ${
                  index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                } ${
                  focusedRow === member.id ? 'ring-2 ring-sky-500 ring-inset' : ''
                }`}
                onMouseEnter={() => setHoveredRow(member.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onFocus={() => setFocusedRow(member.id)}
                onBlur={() => setFocusedRow(null)}
                tabIndex={0}
                role="row"
                aria-label={`Member row for ${member.name}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center"
                      aria-label={`Avatar for ${member.name}`}
                    >
                      <span className="text-white font-medium text-sm">{member.avatar}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Joined {new Date(member.joinDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <a 
                        href={`mailto:${member.email}`}
                        className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                        aria-label={`Send email to ${member.name}`}
                      >
                        {member.email}
                      </a>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <a 
                        href={`tel:${member.phone}`}
                        className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                        aria-label={`Call ${member.name}`}
                      >
                        {member.phone}
                      </a>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}
                    aria-label={`Status: ${member.status}`}
                  >
                    {(member.status || '').charAt(0).toUpperCase() + (member.status || '').slice(1)}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMembershipColor(member.membershipType)}`}
                    aria-label={`Membership type: ${member.membershipType}`}
                  >
                    {member.membershipType}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {member.lastVisit === 'Never' ? 'Never' : new Date(member.lastVisit).toLocaleDateString()}
                  </div>
                </td>
                
                <td className="px-6 py-4 text-right">
                  <div 
                    className={`flex items-center justify-end space-x-1 transition-opacity duration-200 ${
                      hoveredRow === member.id || focusedRow === member.id ? 'opacity-100' : 'opacity-0'
                    }`}
                    role="group"
                    aria-label={`Actions for ${member.name}`}
                  >
                    {onView && (
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        icon={<FiEye className="w-4 h-4" />}
                        onClick={() => onView(member)}
                        className="p-1"
                        title="View Profile"
                        aria-label={`View profile for ${member.name}`}
                      />
                    )}
                    
                    {onEdit && (
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        icon={<FiEdit className="w-4 h-4" />}
                        onClick={() => onEdit(member)}
                        className="p-1"
                        title="Edit Member"
                        aria-label={`Edit ${member.name}`}
                      />
                    )}
                    

                    
                    {onAssignTrainer && (
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        icon={<FiUser className="w-4 h-4" />}
                        onClick={() => onAssignTrainer(member)}
                        className="p-1"
                        title="Assign Trainer"
                        aria-label={`Assign trainer to ${member.name}`}
                      />
                    )}
                    
                    {onDelete && (
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        icon={<FiTrash2 className="w-4 h-4" />}
                        onClick={() => onDelete(member)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Delete Member"
                        aria-label={`Delete ${member.name}`}
                      />
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTable; 