import * as React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiCheckSquare, FiClock, FiBarChart, FiSettings } from 'react-icons/fi';
import TaskTable from '../components/tasks/TaskTable';
import SmartTaskAnalytics from '../components/tasks/SmartTaskAnalytics';
import TaskAutomationEngine from '../components/tasks/TaskAutomationEngine';
import { AnimatePresence } from 'framer-motion';
import FilterButton from '../components/ui/FilterButton';
import TabsNav from '../components/ui/TabsNav';
import AddButton from '../components/ui/AddButton';
import { SmartButton } from '../components/ui/DesignSystem';
import { AddTaskModal } from '../components/tasks/modals/AddTaskModal';
import { usePageThemeContext } from '../contexts/PageThemeContext';

const Tasks: React.FC = () => {
  const { theme } = usePageThemeContext();
  
  const [activeTab, setActiveTab] = React.useState('overview');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiCheckSquare },
    { id: 'analytics', name: 'Analytics', icon: FiBarChart },
    { id: 'schedule', name: 'Schedule', icon: FiClock },
  ];

  const filters = [
    { id: 'all', name: 'All Tasks', count: 45 },
    { id: 'pending', name: 'Pending', count: 12 },
    { id: 'in-progress', name: 'In Progress', count: 8 },
    { id: 'completed', name: 'Completed', count: 25 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your gym operations and tasks</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <SmartButton variant="secondary" size="sm" icon={<FiClock className="w-4 h-4" />}>
            View Schedule
          </SmartButton>
          <AddButton label="Add Task" onClick={() => {
            console.log('🚀 Tasks: Add Task button clicked');
            setShowAddTaskModal(true);
          }} />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks by title, assignee, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="form-select"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>
            
            <FilterButton />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabsNav
        tabs={tabs.map(tab => ({ id: tab.id, label: tab.name, icon: <tab.icon className="w-4 h-4" /> }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Task Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">45</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center">
                      <FiCheckSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">12</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center">
                      <FiClock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">8</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center">
                      <FiBarChart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">25</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <FiCheckSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Task Table */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tasks</h3>
                  <button className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400">
                    View All Tasks
                  </button>
                </div>
                <TaskTable />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <SmartTaskAnalytics />
            </div>
          )}



          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="text-3xl font-bold text-sky-600">15</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Due Today</div>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="text-3xl font-bold text-gold-600">8</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Due This Week</div>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="text-3xl font-bold text-rose-600">3</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Overdue</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Task Modal */}
              <AddTaskModal
          open={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          onSuccess={() => {
            console.log('✅ Task created successfully');
            // Refresh task list or show success message
          }}
          isPro={true}
        />
    </div>
  );
};

export default Tasks;
