import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiUser, FiStar, FiBarChart, FiSettings, FiDownload, FiRefreshCw, FiEye, FiEdit, FiTrash2, FiMail, FiClock, FiTarget } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import TrainerTable from '../components/trainers/TrainerTable';
import TrainerKPICards from '../components/trainers/TrainerKPICards';
import SmartTrainerAnalytics from '../components/trainers/SmartTrainerAnalytics';
import TrainerAutomationEngine from '../components/trainers/TrainerAutomationEngine';
import FilterButton from '../components/ui/FilterButton';
import TabsNav from '../components/ui/TabsNav';
import AddButton from '../components/ui/AddButton';
import { SmartButton } from '../components/ui/DesignSystem';

import { mockTrainerTableData } from '../api/mockTrainerData';

// Import all modals
import {
  AddTrainerModal,
  EditTrainerModal,
  DeleteTrainerModal,
  ViewTrainerProfileModal,
  AssignClassesModal,
  ExportTrainerDataModal
} from '../components/trainers/modals';

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

type ModalType = 'add' | 'edit' | 'delete' | 'view' | 'assign' | 'export' | null;

const Trainers: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const [selectedTrainer, setSelectedTrainer] = React.useState<Trainer | null>(null);
  const [trainers, setTrainers] = React.useState<Trainer[]>(mockTrainerTableData || []);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Debug logging for state changes
  React.useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    console.log('Active modal changed to:', activeModal);
  }, [activeModal]);

  // Ensure trainers is always an array
  const safeTrainers = React.useMemo(() => {
    return Array.isArray(trainers) ? trainers : [];
  }, [trainers]);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: FiUser },
    { id: 'analytics', name: 'Analytics', icon: FiBarChart },
    { id: 'list', name: 'Trainer List', icon: FiSettings },
  ];

  const filters = [
    { id: 'all', name: 'All Trainers', count: safeTrainers.length },
    { id: 'active', name: 'Active', count: safeTrainers.filter(t => t.status === 'active').length },
    { id: 'available', name: 'Available', count: safeTrainers.filter(t => t.status === 'available').length },
    { id: 'busy', name: 'Busy', count: safeTrainers.filter(t => t.status === 'busy').length },
  ];

  // Modal handlers with debugging
  const handleOpenModal = (type: ModalType, trainer?: Trainer) => {
    console.log('Opening modal:', type, trainer);
    setActiveModal(type);
    if (trainer) setSelectedTrainer(trainer);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setActiveModal(null);
    setSelectedTrainer(null);
  };

  const handleModalSuccess = () => {
    toast.success('Action completed successfully!');
    handleCloseModal();
    setRefreshKey(prev => prev + 1);
  };

  // Action handlers with debugging
  const handleAddTrainer = () => {
    console.log('Add trainer button clicked');
    handleOpenModal('add');
  };

  const handleEditTrainer = (trainer: Trainer) => {
    console.log('Edit trainer clicked:', trainer.name);
    handleOpenModal('edit', trainer);
  };

  const handleDeleteTrainer = (trainer: Trainer) => {
    console.log('Delete trainer clicked:', trainer.name);
    handleOpenModal('delete', trainer);
  };

  const handleViewTrainer = (trainer: Trainer) => {
    console.log('View trainer clicked:', trainer.name);
    handleOpenModal('view', trainer);
  };

  const handleAssignTrainer = (trainer: Trainer) => {
    console.log('Assign trainer clicked:', trainer.name);
    handleOpenModal('assign', trainer);
  };

  const handleMessageTrainer = (trainer: Trainer) => {
    console.log('Message trainer clicked:', trainer.name);
    handleOpenModal('view', trainer); // Using view modal for now
  };

  const handleScheduleTrainer = (trainer: Trainer) => {
    console.log('Schedule trainer clicked:', trainer.name);
    handleOpenModal('assign', trainer); // Using assign modal for schedule
  };

  const handleExport = async () => {
    console.log('Export button clicked');
    toast.loading('Exporting trainers...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Trainers exported successfully!');
  };

  const handleRefresh = () => {
    console.log('Refresh button clicked');
    setRefreshKey(prev => prev + 1);
    toast.success('Trainer list refreshed!');
  };

  // Tab change handler with debugging
  const handleTabChange = (tabId: string) => {
    console.log('Tab changing to:', tabId);
    setActiveTab(tabId);
  };

  const renderActiveTab = () => {
    console.log('Rendering tab:', activeTab);
    
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <TrainerKPICards />
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Trainers</h3>
                <SmartButton 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleTabChange('list')}
                >
                  View All Trainers
                </SmartButton>
              </div>
              <TrainerTable
                trainers={safeTrainers}
                onEdit={handleEditTrainer}
                onDelete={handleDeleteTrainer}
                onView={handleViewTrainer}
                onAssign={handleAssignTrainer}
                onMessage={handleMessageTrainer}
                onSchedule={handleScheduleTrainer}
              />
            </div>
          </div>
        );



      case 'analytics':
        return (
          <div className="space-y-6">
            <SmartTrainerAnalytics refreshKey={refreshKey} />
          </div>
        );

      case 'list':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trainer Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage all trainers, schedules, and assignments</p>
                </div>
                <div className="flex items-center space-x-3">
                  <SmartButton 
                    variant="secondary" 
                    size="sm" 
                    icon={<FiDownload className="h-4 w-4" />} 
                    onClick={handleExport}
                  >
                    Export
                  </SmartButton>
                  <AddButton label="Add Trainer" onClick={handleAddTrainer} />
                  <SmartButton 
                    variant="secondary" 
                    size="sm" 
                    icon={<FiRefreshCw className="h-4 w-4" />} 
                    onClick={handleRefresh}
                  >
                    Refresh
                  </SmartButton>
                </div>
              </div>
              
              <TrainerTable
                trainers={safeTrainers}
                onEdit={handleEditTrainer}
                onDelete={handleDeleteTrainer}
                onView={handleViewTrainer}
                onAssign={handleAssignTrainer}
                onMessage={handleMessageTrainer}
                onSchedule={handleScheduleTrainer}
              />
            </div>
          </div>
        );

      default:
        console.log('Unknown tab:', activeTab);
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🚀 Smart Trainer Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Intelligent scheduling • Performance tracking • Zero Excel</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <SmartButton 
            variant="secondary" 
            size="sm" 
            icon={<FiTarget className="h-4 w-4" />}
            onClick={() => handleTabChange('list')}
          >
            View Schedule
          </SmartButton>
          <AddButton label="Add Trainer" onClick={handleAddTrainer} />
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
              placeholder="Search trainers by name, specialty, or availability..."
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
        onTabChange={handleTabChange}
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
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'add' && (
          <AddTrainerModal
            isOpen={activeModal === 'add'}
            onClose={handleCloseModal}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === 'edit' && selectedTrainer && (
          <EditTrainerModal
            isOpen={activeModal === 'edit'}
            onClose={handleCloseModal}
            trainer={selectedTrainer}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === 'delete' && selectedTrainer && (
          <DeleteTrainerModal
            isOpen={activeModal === 'delete'}
            onClose={handleCloseModal}
            trainer={selectedTrainer}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === 'view' && selectedTrainer && (
          <ViewTrainerProfileModal
            isOpen={activeModal === 'view'}
            onClose={handleCloseModal}
            trainer={selectedTrainer}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === 'assign' && selectedTrainer && (
          <AssignClassesModal
            isOpen={activeModal === 'assign'}
            onClose={handleCloseModal}
            trainer={selectedTrainer}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === 'export' && (
          <ExportTrainerDataModal
            isOpen={activeModal === 'export'}
            onClose={handleCloseModal}
            onSuccess={handleModalSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trainers;
