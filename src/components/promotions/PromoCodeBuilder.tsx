import React, { useState } from 'react';
import { FiGift, FiPercent, FiDollarSign, FiCalendar, FiUsers, FiTarget, FiSettings, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface PromoCodeFormData {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  maxUses: number;
  expiryDate: string;
  targetSegment: string;
  description: string;
  minimumPurchase?: number;
  firstTimeOnly: boolean;
  stackable: boolean;
}

const PromoCodeBuilder: React.FC = () => {
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    type: 'percentage',
    value: 0,
    maxUses: 100,
    expiryDate: '',
    targetSegment: 'all',
    description: '',
    minimumPurchase: 0,
    firstTimeOnly: false,
    stackable: false
  });

  const [errors, setErrors] = useState<Partial<PromoCodeFormData>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePromoCode = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      const prefixes = ['FIT', 'GYM', 'MTDRB', 'HEALTH', 'WORKOUT'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const newCode = `${prefix}${numbers}`;
      
      setFormData(prev => ({ ...prev, code: newCode }));
      setIsGenerating(false);
      toast.success('Promo code generated!');
    }, 1000);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PromoCodeFormData> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Promo code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Promo code must be at least 3 characters';
    }

    if (formData.value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    }

    if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }

    if (formData.maxUses <= 0) {
      newErrors.maxUses = 'Maximum uses must be greater than 0';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        newErrors.expiryDate = 'Expiry date must be in the future';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Simulate API call
    toast.success('Promo code created successfully!');
    console.log('Creating promo code:', formData);
  };

  const handleInputChange = (field: keyof PromoCodeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const targetSegments = [
    { value: 'all', label: 'All Members', description: 'Available to everyone' },
    { value: 'new', label: 'New Members', description: 'First-time customers only' },
    { value: 'premium', label: 'Premium Members', description: 'Premium subscription holders' },
    { value: 'inactive', label: 'Inactive Members', description: 'Members who haven\'t visited in 30+ days' },
    { value: 'students', label: 'Students', description: 'Student discount program' },
    { value: 'seniors', label: 'Seniors', description: 'Senior citizen discount' }
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Promo Code</h1>
          <p className="text-gray-600 mt-2">Design discount codes to drive member engagement and revenue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FiGift className="h-5 w-5 text-purple-600 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    className={`flex-1 px-4 py-3 border rounded-xl font-mono text-lg ${
                      errors.code ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                    placeholder="e.g., NEWYEAR2024"
                  />
                  <button
                    type="button"
                    onClick={generatePromoCode}
                    disabled={isGenerating}
                    className="px-4 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl ${
                    errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                  placeholder="e.g., New Year fitness challenge discount"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Discount Settings */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FiPercent className="h-5 w-5 text-green-600 mr-2" />
              Discount Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type"
                      value="percentage"
                      checked={formData.type === 'percentage'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Percentage</div>
                      <div className="text-sm text-gray-500">e.g., 20% off</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type"
                      value="flat"
                      checked={formData.type === 'flat'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Fixed Amount</div>
                      <div className="text-sm text-gray-500">e.g., $50 off</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                    className={`w-full px-4 py-3 border rounded-xl ${
                      errors.value ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                    placeholder={formData.type === 'percentage' ? '20' : '50'}
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {formData.type === 'percentage' ? '%' : '$'}
                  </div>
                </div>
                {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
              </div>

              {/* Minimum Purchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Purchase (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.minimumPurchase || ''}
                    onChange={(e) => handleInputChange('minimumPurchase', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="0"
                    min="0"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage & Expiry */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FiCalendar className="h-5 w-5 text-blue-600 mr-2" />
              Usage & Expiry
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Maximum Uses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Uses *
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => handleInputChange('maxUses', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border rounded-xl ${
                    errors.maxUses ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                  placeholder="100"
                  min="1"
                />
                {errors.maxUses && <p className="text-red-500 text-sm mt-1">{errors.maxUses}</p>}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl ${
                    errors.expiryDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FiTarget className="h-5 w-5 text-orange-600 mr-2" />
              Target Audience
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targetSegments.map((segment) => (
                <label key={segment.value} className="flex items-start space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="targetSegment"
                    value={segment.value}
                    checked={formData.targetSegment === segment.value}
                    onChange={(e) => handleInputChange('targetSegment', e.target.value)}
                    className="text-purple-600 focus:ring-purple-500 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{segment.label}</div>
                    <div className="text-sm text-gray-500">{segment.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FiSettings className="h-5 w-5 text-gray-600 mr-2" />
              Advanced Settings
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.firstTimeOnly}
                  onChange={(e) => handleInputChange('firstTimeOnly', e.target.checked)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-900">First-time customers only</div>
                  <div className="text-sm text-gray-500">Limit to members who have never made a purchase</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.stackable}
                  onChange={(e) => handleInputChange('stackable', e.target.checked)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Stackable with other discounts</div>
                  <div className="text-sm text-gray-500">Allow this code to be used with other promotions</div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
            >
              <FiCheck className="h-5 w-5" />
              <span>Create Promo Code</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoCodeBuilder;
export { PromoCodeBuilder }; 