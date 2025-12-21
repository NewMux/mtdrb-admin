import React, { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiStar, FiSave, FiX } from 'react-icons/fi';
import MTDRBModal, { FormSection, FormField, FormGrid, FullWidthField, Toggle } from './MTDRBModal';

interface ExampleFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  membershipType: 'basic' | 'premium' | 'vip';
  notifications: boolean;
  marketing: boolean;
  emergencyContact: string;
  medicalNotes: string;
}

export const MTDRBModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<ExampleFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    membershipType: 'basic',
    notifications: true,
    marketing: false,
    emergencyContact: '',
    medicalNotes: '',
  });

  const handleInputChange = (field: keyof ExampleFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setIsOpen(false);
  };

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
      >
        Open MTDRB Modal Example
      </button>

      <MTDRBModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New Member"
        subtitle="Create a new member profile with all necessary information"
        maxWidth="4xl"
      >
        {/* Personal Information Section */}
        <FormSection
          title="Personal Information"
          description="Basic member details and contact information"
        >
          <FormGrid>
            <FormField label="First Name" required>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter first name"
              />
            </FormField>

            <FormField label="Last Name" required>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter last name"
              />
            </FormField>

            <FormField label="Email Address" required>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter email address"
              />
            </FormField>

            <FormField label="Phone Number">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter phone number"
              />
            </FormField>

            <FullWidthField>
              <FormField label="Address">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter full address"
                />
              </FormField>
            </FullWidthField>

            <FormField label="Date of Birth">
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </FormField>

            <FormField label="Membership Type" required>
              <select
                value={formData.membershipType}
                onChange={(e) => handleInputChange('membershipType', e.target.value as 'basic' | 'premium' | 'vip')}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Emergency Contact Section */}
        <FormSection
          title="Emergency Contact"
          description="Contact information for emergency situations"
        >
          <FullWidthField>
            <FormField label="Emergency Contact">
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Name and phone number"
              />
            </FormField>
          </FullWidthField>
        </FormSection>

        {/* Medical Information Section */}
        <FormSection
          title="Medical Information"
          description="Important health and medical details"
        >
          <FullWidthField>
            <FormField label="Medical Notes" help="Any relevant medical information or restrictions">
              <textarea
                value={formData.medicalNotes}
                onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                rows={4}
                placeholder="Enter any medical notes or restrictions..."
              />
            </FormField>
          </FullWidthField>
        </FormSection>

        {/* Preferences Section */}
        <FormSection
          title="Preferences"
          description="Communication and notification preferences"
        >
          <div className="space-y-4">
            <Toggle
              checked={formData.notifications}
              onChange={(checked) => handleInputChange('notifications', checked)}
              label="Receive notifications about classes and updates"
            />
            
            <Toggle
              checked={formData.marketing}
              onChange={(checked) => handleInputChange('marketing', checked)}
              label="Receive marketing communications"
            />
          </div>
        </FormSection>
      </MTDRBModal>
    </div>
  );
};

export default MTDRBModalExample; 