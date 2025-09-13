import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { 
  FiHome, 
  FiMapPin, 
  FiUsers, 
  FiUpload, 
  FiCheck, 
  FiArrowRight, 
  FiArrowLeft,
  FiGlobe,
  FiDollarSign,
  FiClock,
  FiMail,
  FiPhone
} from "react-icons/fi";

// ===== ONBOARDING WIZARD =====
export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Gym Info
    gymName: "",
    country: "Saudi Arabia",
    language: "English",
    vatEnabled: true,
    vatNumber: "",
    currency: "SAR",
    timezone: "Asia/Riyadh",
    
    // Step 2: Branch Setup
    branchName: "",
    branchAddress: "",
    branchPhone: "",
    branchEmail: "",
    operatingHours: {
      monday: { open: "06:00", close: "22:00", closed: false },
      tuesday: { open: "06:00", close: "22:00", closed: false },
      wednesday: { open: "06:00", close: "22:00", closed: false },
      thursday: { open: "06:00", close: "22:00", closed: false },
      friday: { open: "06:00", close: "22:00", closed: false },
      saturday: { open: "08:00", close: "20:00", closed: false },
      sunday: { open: "08:00", close: "20:00", closed: false }
    },
    
    // Step 3: Staff Setup
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    trainerName: "",
    trainerEmail: "",
    trainerPhone: "",
    trainerSpecialization: "General Fitness",
    
    // Step 4: Branding
    logo: null as File | null,
    primaryColor: "#155FD9",
    secondaryColor: "#489BFA"
  });

  // Check user on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      // Allow onboarding for users who have signed up but may not have paid flag yet
      // This handles the case where user comes from signup flow
      setUser(user);
    };
    checkUser();
  }, [navigate]);

  // Steps configuration
  const steps = [
    {
      id: 0,
      title: "Gym Information",
      subtitle: "Tell us about your gym",
      icon: <FiHome className="h-6 w-6" />,
      component: <GymInfoStep formData={formData} setFormData={setFormData} />
    },
    {
      id: 1,
      title: "Branch Setup",
      subtitle: "Configure your main location",
      icon: <FiMapPin className="h-6 w-6" />,
      component: <BranchSetupStep formData={formData} setFormData={setFormData} />
    },
    {
      id: 2,
      title: "Staff Setup",
      subtitle: "Add yourself and your team",
      icon: <FiUsers className="h-6 w-6" />,
      component: <StaffSetupStep formData={formData} setFormData={setFormData} />
    },
    {
      id: 3,
      title: "Branding",
      subtitle: "Customize your gym's appearance",
      icon: <FiUpload className="h-6 w-6" />,
      component: <BrandingStep formData={formData} setFormData={setFormData} />
    }
  ];

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Save onboarding data to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Get or create tenant
      let tenantId = user.user_metadata?.tenant_id;
      
      if (!tenantId) {
        // Create tenant if it doesn't exist
        const { data: tenantData, error: tenantCreateError } = await supabase
          .from("tenants")
          .insert({
            name: formData.gymName || "My Gym",
            onboarding_completed: true,
          })
          .select("id")
          .single();

        if (tenantCreateError) throw tenantCreateError;
        tenantId = tenantData.id;

        // Create membership
        await supabase.from("memberships").insert({
          user_id: user.id,
          tenant_id: tenantId,
          role: "admin",
        });

        // Update user metadata
        await supabase.auth.updateUser({
          data: { tenant_id: tenantId }
        });
      } else {
        // Update existing tenant with onboarding data
        const { error: tenantError } = await supabase
          .from("tenants")
          .update({
            name: formData.gymName,
            country: formData.country,
            language: formData.language,
            vat_enabled: formData.vatEnabled,
            vat_number: formData.vatNumber,
            currency: formData.currency,
            timezone: formData.timezone,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", tenantId);

        if (tenantError) throw tenantError;
      }

      // Create branch if branch name is provided
      if (formData.branchName) {
        const { error: branchError } = await supabase
          .from("branches")
          .insert({
            tenant_id: tenantId,
            name: formData.branchName,
            address: formData.branchAddress,
            phone: formData.branchPhone,
            email: formData.branchEmail,
            operating_hours: formData.operatingHours
          });

        if (branchError) throw branchError;
      }

      // Create owner as trainer if owner name is provided
      if (formData.ownerName) {
        const { error: ownerError } = await supabase
          .from("trainers")
          .insert({
            tenant_id: tenantId,
            name: formData.ownerName,
            email: formData.ownerEmail,
            phone: formData.ownerPhone,
            role: "owner",
            specialization: "General Management"
          });

        if (ownerError) throw ownerError;
      }

      // Create additional trainer if provided
      if (formData.trainerName) {
        const { error: trainerError } = await supabase
          .from("trainers")
          .insert({
            tenant_id: tenantId,
            name: formData.trainerName,
            email: formData.trainerEmail,
            phone: formData.trainerPhone,
            role: "trainer",
            specialization: formData.trainerSpecialization
          });

        if (trainerError) throw trainerError;
      }

      // Update user metadata to mark onboarding as completed
      await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          gym_name: formData.gymName
        }
      });

      // Redirect to dashboard with success message
      navigate("/dashboard", { 
        state: { 
          message: "Welcome to MTDRB! Your gym has been successfully set up." 
        } 
      });

    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Mark onboarding as completed without saving detailed data
      await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });
      
      navigate("/dashboard", { 
        state: { 
          message: "Welcome to MTDRB! You can complete your setup later in settings." 
        } 
      });
    } catch (err: any) {
      setError(err.message || "Failed to skip onboarding");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/mtdrb-logo.svg" alt="MTDRB" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Setup Your Gym</h1>
                <p className="text-sm text-gray-500">Complete your gym configuration</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index <= currentStep 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-gray-300 text-gray-400"
                }`}>
                  {index < currentStep ? (
                    <FiCheck className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    index < currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Step Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-center space-x-4">
              {steps[currentStep].icon}
              <div>
                <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
                <p className="text-blue-100">{steps[currentStep].subtitle}</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {steps[currentStep].component}
              </motion.div>
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
                >
                  Skip for now
                </button>
                
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Next
                    <FiArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <FiCheck className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== STEP COMPONENTS =====

function GymInfoStep({ formData, setFormData }: { formData: any; setFormData: any }) {
  const countries = [
    "Saudi Arabia", "UAE", "Bahrain", "Kuwait", "Oman", "Qatar", "Egypt", "Jordan", "Lebanon"
  ];

  const currencies = [
    { code: "SAR", name: "Saudi Riyal" },
    { code: "AED", name: "UAE Dirham" },
    { code: "BHD", name: "Bahraini Dinar" },
    { code: "KWD", name: "Kuwaiti Dinar" },
    { code: "OMR", name: "Omani Rial" },
    { code: "QAR", name: "Qatari Riyal" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gym Name *
          </label>
          <input
            type="text"
            value={formData.gymName}
            onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your gym name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="English">English</option>
            <option value="Arabic">Arabic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            id="vatEnabled"
            checked={formData.vatEnabled}
            onChange={(e) => setFormData({ ...formData, vatEnabled: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="vatEnabled" className="text-sm font-medium text-gray-700">
            Enable VAT/Tax reporting
          </label>
        </div>

        {formData.vatEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VAT Number
            </label>
            <input
              type="text"
              value={formData.vatNumber}
              onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter VAT number"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function BranchSetupStep({ formData, setFormData }: { formData: any; setFormData: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch Name *
          </label>
          <input
            type="text"
            value={formData.branchName}
            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Main Branch"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.branchPhone}
            onChange={(e) => setFormData({ ...formData, branchPhone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+966 50 123 4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={formData.branchEmail}
          onChange={(e) => setFormData({ ...formData, branchEmail: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="info@yourgym.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={formData.branchAddress}
          onChange={(e) => setFormData({ ...formData, branchAddress: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your gym's address"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Operating Hours</h3>
        <div className="space-y-3">
          {Object.entries(formData.operatingHours).map(([day, hours]: [string, any]) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24 text-sm font-medium text-gray-700 capitalize">
                {day}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) => setFormData({
                    ...formData,
                    operatingHours: {
                      ...formData.operatingHours,
                      [day]: { ...hours, closed: !e.target.checked }
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-500">Open</span>
              </div>
              {!hours.closed && (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => setFormData({
                      ...formData,
                      operatingHours: {
                        ...formData.operatingHours,
                        [day]: { ...hours, open: e.target.value }
                      }
                    })}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => setFormData({
                      ...formData,
                      operatingHours: {
                        ...formData.operatingHours,
                        [day]: { ...hours, close: e.target.value }
                      }
                    })}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaffSetupStep({ formData, setFormData }: { formData: any; setFormData: any }) {
  const specializations = [
    "General Fitness", "Weight Training", "Cardio", "Yoga", "Pilates", 
    "CrossFit", "Swimming", "Martial Arts", "Nutrition", "Rehabilitation"
  ];

  return (
    <div className="space-y-8">
      {/* Owner Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.ownerPhone}
              onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+966 50 123 4567"
            />
          </div>
        </div>
      </div>

      {/* Trainer Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Your First Trainer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trainer Name
            </label>
            <input
              type="text"
              value={formData.trainerName}
              onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Trainer's full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <select
              value={formData.trainerSpecialization}
              onChange={(e) => setFormData({ ...formData, trainerSpecialization: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.trainerEmail}
              onChange={(e) => setFormData({ ...formData, trainerEmail: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="trainer@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.trainerPhone}
              onChange={(e) => setFormData({ ...formData, trainerPhone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+966 50 123 4567"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandingStep({ formData, setFormData }: { formData: any; setFormData: any }) {
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gym Logo
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <FiUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Upload your gym's logo (optional)
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="logo-upload"
          />
          <label
            htmlFor="logo-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            Choose File
          </label>
          {formData.logo && (
            <p className="text-sm text-green-600 mt-2">
              ✓ {formData.logo.name} selected
            </p>
          )}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Color Scheme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-600">{formData.primaryColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-600">{formData.secondaryColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center space-x-4 mb-4">
            {formData.logo && (
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500">Logo</span>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">{formData.gymName || "Your Gym"}</h4>
              <p className="text-sm text-gray-600">Gym Management Platform</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <div 
              className="w-6 h-6 rounded"
              style={{ backgroundColor: formData.primaryColor }}
            ></div>
            <div 
              className="w-6 h-6 rounded"
              style={{ backgroundColor: formData.secondaryColor }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
} 