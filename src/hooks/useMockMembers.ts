import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

export interface MockMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  membershipType: string;
  joinDate: string;
  lastVisit: string;
  avatar: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact?: string;
  trainer_id?: string;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  health_conditions?: string[];
  goals?: string[];
  notes?: string;
}

const mockMembersData: MockMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    membershipType: 'Premium',
    joinDate: '2024-01-15',
    lastVisit: '2024-01-20',
    avatar: 'SJ',
    gender: 'female',
    address: '123 Main St, City, State 12345',
    emergency_contact: '+1 (555) 987-6543',
    trainer_id: 'trainer-1',
    fitness_level: 'intermediate',
    health_conditions: [],
    goals: ['weight_loss', 'strength'],
    notes: 'Very motivated member, responds well to positive reinforcement.'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '+1 (555) 234-5678',
    status: 'active',
    membershipType: 'Standard',
    joinDate: '2023-12-10',
    lastVisit: '2024-01-19',
    avatar: 'MC',
    gender: 'male',
    address: '456 Oak Ave, City, State 12345',
    emergency_contact: '+1 (555) 876-5432',
    trainer_id: 'trainer-2',
    fitness_level: 'advanced',
    health_conditions: ['back_pain'],
    goals: ['muscle_gain', 'strength'],
    notes: 'Experienced lifter, prefers early morning sessions.'
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    phone: '+1 (555) 345-6789',
    status: 'inactive',
    membershipType: 'Basic',
    joinDate: '2023-11-05',
    lastVisit: '2024-01-10',
    avatar: 'EW',
    gender: 'female',
    address: '789 Pine St, City, State 12345',
    emergency_contact: '+1 (555) 765-4321',
    trainer_id: '',
    fitness_level: 'beginner',
    health_conditions: ['asthma'],
    goals: ['general_fitness'],
    notes: 'Hasn\'t attended in 3 weeks, needs re-engagement campaign.'
  },
  {
    id: '4',
    name: 'David Rodriguez',
    email: 'david.rodriguez@email.com',
    phone: '+1 (555) 456-7890',
    status: 'active',
    membershipType: 'Premium',
    joinDate: '2024-01-08',
    lastVisit: '2024-01-21',
    avatar: 'DR',
    gender: 'male',
    address: '321 Elm St, City, State 12345',
    emergency_contact: '+1 (555) 654-3210',
    trainer_id: 'trainer-3',
    fitness_level: 'intermediate',
    health_conditions: [],
    goals: ['endurance', 'flexibility'],
    notes: 'Enjoys group classes, particularly yoga and HIIT.'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@email.com',
    phone: '+1 (555) 567-8901',
    status: 'pending',
    membershipType: 'Standard',
    joinDate: '2024-01-22',
    lastVisit: 'Never',
    avatar: 'LT',
    gender: 'female',
    address: '654 Maple Dr, City, State 12345',
    emergency_contact: '+1 (555) 543-2109',
    trainer_id: '',
    fitness_level: 'beginner',
    health_conditions: [],
    goals: ['weight_loss'],
    notes: 'New member, needs orientation and fitness assessment.'
  },
  {
    id: '6',
    name: 'James Anderson',
    email: 'james.anderson@email.com',
    phone: '+1 (555) 678-9012',
    status: 'active',
    membershipType: 'VIP',
    joinDate: '2023-09-15',
    lastVisit: '2024-01-22',
    avatar: 'JA',
    gender: 'male',
    address: '987 Cedar Ln, City, State 12345',
    emergency_contact: '+1 (555) 432-1098',
    trainer_id: 'trainer-1',
    fitness_level: 'advanced',
    health_conditions: ['heart_condition'],
    goals: ['strength', 'muscle_gain'],
    notes: 'VIP member, requires special attention and premium services.'
  },
  {
    id: '7',
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1 (555) 789-0123',
    status: 'active',
    membershipType: 'Student',
    joinDate: '2024-01-05',
    lastVisit: '2024-01-18',
    avatar: 'MG',
    gender: 'female',
    address: '147 Birch Rd, City, State 12345',
    emergency_contact: '+1 (555) 321-0987',
    trainer_id: 'trainer-4',
    fitness_level: 'beginner',
    health_conditions: [],
    goals: ['general_fitness', 'flexibility'],
    notes: 'Student member, prefers evening classes after school.'
  },
  {
    id: '8',
    name: 'Robert Taylor',
    email: 'robert.taylor@email.com',
    phone: '+1 (555) 890-1234',
    status: 'inactive',
    membershipType: 'Basic',
    joinDate: '2023-08-20',
    lastVisit: '2023-12-15',
    avatar: 'RT',
    gender: 'male',
    address: '258 Spruce Way, City, State 12345',
    emergency_contact: '+1 (555) 210-9876',
    trainer_id: '',
    fitness_level: 'intermediate',
    health_conditions: ['knee_injury'],
    goals: ['strength'],
    notes: 'Inactive for over a month, needs re-engagement strategy.'
  },
  {
    id: '9',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@email.com',
    phone: '+1 (555) 901-2345',
    status: 'active',
    membershipType: 'Premium',
    joinDate: '2024-01-12',
    lastVisit: '2024-01-23',
    avatar: 'JL',
    gender: 'female',
    address: '369 Willow St, City, State 12345',
    emergency_contact: '+1 (555) 109-8765',
    trainer_id: 'trainer-2',
    fitness_level: 'intermediate',
    health_conditions: [],
    goals: ['weight_loss', 'cardio'],
    notes: 'Consistent attendee, loves spin classes.'
  },
  {
    id: '10',
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone: '+1 (555) 012-3456',
    status: 'active',
    membershipType: 'Standard',
    joinDate: '2023-10-18',
    lastVisit: '2024-01-21',
    avatar: 'MB',
    gender: 'male',
    address: '741 Oak Dr, City, State 12345',
    emergency_contact: '+1 (555) 098-7654',
    trainer_id: 'trainer-3',
    fitness_level: 'advanced',
    health_conditions: [],
    goals: ['muscle_gain', 'strength'],
    notes: 'Powerlifting enthusiast, very dedicated to training.'
  },
  {
    id: '11',
    name: 'Amanda Davis',
    email: 'amanda.davis@email.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    membershipType: 'Student',
    joinDate: '2024-01-03',
    lastVisit: '2024-01-20',
    avatar: 'AD',
    gender: 'female',
    address: '852 Pine Ave, City, State 12345',
    emergency_contact: '+1 (555) 087-6543',
    trainer_id: 'trainer-4',
    fitness_level: 'beginner',
    health_conditions: [],
    goals: ['general_fitness'],
    notes: 'New to fitness, very enthusiastic about learning.'
  },
  {
    id: '12',
    name: 'Christopher Wilson',
    email: 'christopher.wilson@email.com',
    phone: '+1 (555) 234-5678',
    status: 'inactive',
    membershipType: 'Basic',
    joinDate: '2023-07-25',
    lastVisit: '2023-11-30',
    avatar: 'CW',
    gender: 'male',
    address: '963 Elm Rd, City, State 12345',
    emergency_contact: '+1 (555) 076-5432',
    trainer_id: '',
    fitness_level: 'intermediate',
    health_conditions: ['back_pain'],
    goals: ['strength'],
    notes: 'Haven\'t seen in 2 months, needs follow-up call.'
  },
  {
    id: '13',
    name: 'Rachel Green',
    email: 'rachel.green@email.com',
    phone: '+1 (555) 345-6789',
    status: 'active',
    membershipType: 'Premium',
    joinDate: '2024-01-18',
    lastVisit: '2024-01-24',
    avatar: 'RG',
    gender: 'female',
    address: '147 Maple Ln, City, State 12345',
    emergency_contact: '+1 (555) 065-4321',
    trainer_id: 'trainer-1',
    fitness_level: 'intermediate',
    health_conditions: [],
    goals: ['weight_loss', 'flexibility'],
    notes: 'Yoga enthusiast, very flexible and dedicated.'
  },
  {
    id: '14',
    name: 'Daniel Martinez',
    email: 'daniel.martinez@email.com',
    phone: '+1 (555) 456-7890',
    status: 'active',
    membershipType: 'Standard',
    joinDate: '2023-12-28',
    lastVisit: '2024-01-22',
    avatar: 'DM',
    gender: 'male',
    address: '258 Cedar St, City, State 12345',
    emergency_contact: '+1 (555) 054-3210',
    trainer_id: 'trainer-2',
    fitness_level: 'beginner',
    health_conditions: [],
    goals: ['muscle_gain'],
    notes: 'New to weight training, very coachable.'
  },
  {
    id: '15',
    name: 'Sophie Turner',
    email: 'sophie.turner@email.com',
    phone: '+1 (555) 567-8901',
    status: 'active',
    membershipType: 'VIP',
    joinDate: '2023-06-10',
    lastVisit: '2024-01-23',
    avatar: 'ST',
    gender: 'female',
    address: '369 Birch Ave, City, State 12345',
    emergency_contact: '+1 (555) 043-2109',
    trainer_id: 'trainer-3',
    fitness_level: 'advanced',
    health_conditions: [],
    goals: ['athletic_performance', 'strength'],
    notes: 'Former athlete, very competitive and driven.'
  }
];

export const useMockMembers = () => {
  const [members, setMembers] = useState<MockMember[]>(mockMembersData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof MockMember>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  // Filter and search members
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.phone.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(member => member.status === selectedFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });

    return filtered;
  }, [members, searchTerm, selectedFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  // CRUD Operations
  const addMember = useCallback(async (memberData: Omit<MockMember, 'id'>) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 10% chance of failure
      if (Math.random() < 0.1) {
        throw new Error('Failed to add member. Please try again.');
      }

      const newMember: MockMember = {
        ...memberData,
        id: Date.now().toString(),
        avatar: memberData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        joinDate: new Date().toISOString().split('T')[0],
        lastVisit: 'Never'
      };

      setMembers(prev => [...prev, newMember]);
      toast.success('Member added successfully!');
    } finally {
      setLoading(false);
    }
  }, []);

  const editMember = useCallback(async (id: string, memberData: Partial<MockMember>) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate 5% chance of failure
      if (Math.random() < 0.05) {
        throw new Error('Failed to update member. Please try again.');
      }

      setMembers(prev => prev.map(member =>
        member.id === id ? { ...member, ...memberData } : member
      ));
      
      toast.success('Member updated successfully!');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Simulate 3% chance of failure
      if (Math.random() < 0.03) {
        throw new Error('Failed to delete member. Please try again.');
      }

      setMembers(prev => prev.filter(member => member.id !== id));
      toast.success('Member deleted successfully!');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMemberById = useCallback((id: string) => {
    return members.find(member => member.id === id);
  }, [members]);

  // Search and filter functions
  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const updateFilter = useCallback((filter: string) => {
    setSelectedFilter(filter);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const updateSorting = useCallback((field: keyof MockMember) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortBy]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const updateItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    inactive: members.filter(m => m.status === 'inactive').length,
    newThisMonth: members.filter(m => {
      const joinDate = new Date(m.joinDate);
      const now = new Date();
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
    }).length
  }), [members]);

  return {
    // Data
    members: paginatedMembers,
    allMembers: members,
    filteredMembers,
    
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    updateItemsPerPage,
    goToPage,
    
    // Search and filter
    searchTerm,
    selectedFilter,
    updateSearch,
    updateFilter,
    
    // Sorting
    sortBy,
    sortOrder,
    updateSorting,
    
    // CRUD operations
    addMember,
    editMember,
    deleteMember,
    getMemberById,
    
    // State
    loading,
    stats
  };
}; 