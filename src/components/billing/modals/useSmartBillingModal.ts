import { useState, useEffect } from 'react';

interface BillingData {
  memberId?: string;
  invoiceId?: string;
  planId?: string;
  amount?: number;
  vatRate?: number;
  currency?: string;
  dueDate?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface AISuggestion {
  type: 'pricing' | 'payment' | 'reminder' | 'optimization';
  message: string;
  priority: 'low' | 'medium' | 'high';
  action?: string;
}

export const useSmartBillingModal = (initialData?: BillingData) => {
  const [data, setData] = useState<BillingData>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isProUser, setIsProUser] = useState(true); // Mock Pro user status

  // VAT calculation
  const calculateVAT = (amount: number, vatRate: number = 15) => {
    return (amount * vatRate) / 100;
  };

  // Real-time validation
  const validateField = (field: string, value: any): string[] => {
    const errors: string[] = [];

    switch (field) {
      case 'amount':
        if (value <= 0) errors.push('Amount must be greater than 0');
        if (value > 100000) errors.push('Amount seems unusually high');
        break;
      case 'vatRate':
        if (value < 0 || value > 100) errors.push('VAT rate must be between 0-100%');
        break;
      case 'dueDate':
        const date = new Date(value);
        if (date < new Date()) errors.push('Due date cannot be in the past');
        break;
      case 'memberId':
        if (!value) errors.push('Member selection is required');
        break;
    }

    return errors;
  };

  // AI-powered suggestions
  const generateSuggestions = async (context: string) => {
    setLoading(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockSuggestions: AISuggestion[] = [
      {
        type: 'pricing',
        message: 'Similar services in your area average $75-85. Consider adjusting pricing.',
        priority: 'medium',
        action: 'Update pricing'
      },
      {
        type: 'payment',
        message: 'Member has 2 overdue invoices. Recommend payment plan.',
        priority: 'high',
        action: 'Setup payment plan'
      },
      {
        type: 'optimization',
        message: 'VAT rate should be 15% for this service type.',
        priority: 'low',
        action: 'Apply correct VAT'
      }
    ];

    setSuggestions(mockSuggestions);
    setLoading(false);
  };

  // Auto-calculate totals
  const calculateTotals = (subtotal: number, vatRate: number = 15) => {
    const vat = calculateVAT(subtotal, vatRate);
    const total = subtotal + vat;
    
    return {
      subtotal,
      vat,
      total,
      vatRate
    };
  };

  // Smart defaults
  const getSmartDefaults = (memberId?: string) => {
    if (!memberId) return {};
    
    // Mock member data
    return {
      vatRate: 15,
      currency: 'AED',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      paymentTerms: 'Net 30'
    };
  };

  // Update data with validation
  const updateData = (updates: Partial<BillingData>) => {
    const newData = { ...data, ...updates };
    setData(newData);

    // Validate all fields
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(updates).forEach(([field, value]) => {
      const fieldErrors = validateField(field, value);
      errors.push(...fieldErrors);
    });

    // Special validations
    if (newData.amount && newData.vatRate) {
      const totals = calculateTotals(newData.amount, newData.vatRate);
      if (totals.total > 50000) {
        warnings.push('Large invoice detected. Consider payment plan.');
      }
    }

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  };

  // Fetch related data
  const fetchRelatedData = async (type: 'member' | 'invoice' | 'plan', id?: string) => {
    if (!id) return null;
    
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = {
      member: {
        id,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+971501234567',
        membershipType: 'Premium',
        outstandingBalance: 250
      },
      invoice: {
        id,
        number: 'INV-2024-001',
        amount: 1500,
        status: 'pending',
        dueDate: '2024-02-15'
      },
      plan: {
        id,
        name: 'Premium Fitness',
        price: 299,
        duration: 'monthly',
        features: ['Gym Access', 'Personal Training', 'Classes']
      }
    };

    setLoading(false);
    return mockData[type];
  };

  return {
    data,
    loading,
    validation,
    suggestions,
    isProUser,
    updateData,
    calculateVAT,
    calculateTotals,
    validateField,
    generateSuggestions,
    getSmartDefaults,
    fetchRelatedData
  };
}; 