import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import type { User } from "@supabase/supabase-js";
import { 
  FiHome, 
  FiMapPin, 
  FiUsers, 
  FiUpload, 
  FiCheck, 
  FiArrowRight, 
  FiArrowLeft,
} from "react-icons/fi";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  DEFAULT_TIMEZONE,
  DEFAULT_VAT_RATE,
} from "../config/runtimeConfig";

// Pull a human-readable message out of an unknown thrown value, checking the
// common shapes Supabase errors can take (message, nested error.message, code).
function extractErrorMessage(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const errObj = err as Record<string, unknown>;
  if (typeof errObj.message === "string" && errObj.message) {
    return errObj.message;
  }
  if (errObj.error && typeof errObj.error === "object") {
    const nested = errObj.error as Record<string, unknown>;
    if (typeof nested.message === "string" && nested.message) {
      return nested.message;
    }
  }
  if (typeof errObj.code === "string" && errObj.code) {
    return errObj.code;
  }
  return undefined;
}

interface OnboardingFormData {
  // Step 1: Gym Info
  gymName: string;
  country: string;
  language: string;
  vatEnabled: boolean;
  vatNumber: string;
  currency: string;
  timezone: string;

  // Step 2: Branch Setup
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  branchEmail: string;
  operatingHours: Record<
    "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
    { open: string; close: string; closed: boolean }
  >;

  // Step 3: Staff Setup
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  trainerName: string;
  trainerEmail: string;
  trainerPhone: string;
  trainerSpecialization: string;

  // Step 4: Branding
  logo: File | null;
}

type SetOnboardingFormData = React.Dispatch<React.SetStateAction<OnboardingFormData>>;

// ===== ONBOARDING WIZARD =====
export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Gym Info
    gymName: "",
    country: "",
    language: DEFAULT_LANGUAGE,
    vatEnabled: DEFAULT_VAT_RATE > 0,
    vatNumber: "",
    currency: DEFAULT_CURRENCY,
    timezone: DEFAULT_TIMEZONE,
    
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
    logo: null as File | null
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

      // Prefill owner name, email, and gym name from user metadata/credentials
      setFormData(prev => ({
        ...prev,
        ownerName: prev.ownerName || user.user_metadata?.name || "",
        ownerEmail: prev.ownerEmail || user.email || "",
        gymName: prev.gymName || user.user_metadata?.gym_name || ""
      }));
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        if (import.meta.env.DEV) console.error("Error getting user:", userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        if (import.meta.env.DEV) console.error("No user found");
        throw new Error("User not found. Please sign in again.");
      }

      // Get or create tenant from the database-backed membership.
      const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      let tenantId = membership?.tenant_id;
      
      if (!tenantId) {
        // Create tenant and membership using RPC function (bypasses RLS)
        const { data: tenantIdData, error: tenantCreateError } = await supabase
          .rpc('create_tenant_with_membership', {
            p_tenant_name: formData.gymName || "My Gym",
            p_user_role: 'admin',
            p_tenant_metadata: {
              country: formData.country,
              language: formData.language,
              vat_enabled: formData.vatEnabled,
              vat_number: formData.vatNumber,
              currency: formData.currency,
              timezone: formData.timezone,
              onboarding_completed: true
            }
          });

        if (tenantCreateError) {
          if (import.meta.env.DEV) console.error("Error creating tenant:", tenantCreateError);
          throw new Error(`Failed to create organization: ${tenantCreateError.message}`);
        }
        
        if (!tenantIdData) {
          throw new Error("Failed to create organization: No tenant ID returned");
        }
        
        tenantId = tenantIdData;

      } else {
        // Update existing tenant with onboarding data
        // Store additional data in metadata JSONB field
        const { error: tenantError } = await supabase
          .from("tenants")
          .update({
            name: formData.gymName,
            metadata: {
              country: formData.country,
              language: formData.language,
              vat_enabled: formData.vatEnabled,
              vat_number: formData.vatNumber,
              currency: formData.currency,
              timezone: formData.timezone,
              onboarding_completed: true
            }
          })
          .eq("id", tenantId);

        if (tenantError) {
          console.error("Error updating tenant:", tenantError);
          // Continue anyway - metadata update is not critical
        }
      }

      // Create or update gym settings for the tenant
      try {
        const { error: settingsError } = await supabase
          .from("gym_settings")
          .upsert({
            tenant_id: tenantId,
            currency: formData.currency || DEFAULT_CURRENCY,
            vat_enabled: formData.vatEnabled,
            vat_rate: formData.vatEnabled ? DEFAULT_VAT_RATE : 0.0,
            metadata: {
              country: formData.country,
              language: formData.language,
              timezone: formData.timezone,
            },
            updated_at: new Date().toISOString()
          }, {
            onConflict: "tenant_id"
          });

        if (settingsError) {
          console.error("Error creating/updating gym settings:", settingsError);
        }
      } catch (err) {
        console.error("Failed to save gym settings:", err);
      }

      // Create branch if branch name is provided
      // Note: branches table may not exist in all setups, so we'll store in tenant metadata if needed
      if (formData.branchName) {
        try {
          const { error: branchError } = await supabase
            .from("branches")
            .insert({
              tenant_id: tenantId,
              name: formData.branchName,
              address: formData.branchAddress || null,
              phone: formData.branchPhone || null,
              email: formData.branchEmail || null,
              is_active: true
            });

          if (branchError) {
            // If branches table doesn't exist, store in tenant metadata instead
            if (import.meta.env.DEV) console.warn("Branches table not available, storing in tenant metadata:", branchError);
            const { error: metadataError } = await supabase
              .from("tenants")
              .update({
                metadata: {
                  branch: {
                    name: formData.branchName,
                    address: formData.branchAddress,
                    phone: formData.branchPhone,
                    email: formData.branchEmail,
                    operating_hours: formData.operatingHours
                  }
                }
              })
              .eq("id", tenantId);
            
            if (metadataError) {
              if (import.meta.env.DEV) console.error("Error storing branch in metadata:", metadataError);
              // Continue anyway - branch info is optional
            }
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error("Error creating branch:", err);
          // Continue anyway - branch creation is optional
        }
      }

      // Create owner as trainer if owner name is provided
      if (formData.ownerName) {
        // Split name into first and last name
        const nameParts = formData.ownerName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const ownerEmail = formData.ownerEmail.trim()
          ? formData.ownerEmail.trim()
          : user.email || `owner_${Date.now()}@yourgym.com`;

        const { error: ownerError } = await supabase
          .from("trainers")
          .insert({
            tenant_id: tenantId,
            first_name: firstName,
            last_name: lastName,
            email: ownerEmail,
            phone: formData.ownerPhone || null,
            status: "active",
            specialties: ["General Management"],
            hourly_rate: 0
          });

        if (ownerError) {
          console.error("Error creating owner trainer:", ownerError);
          // Don't throw - this is optional, continue with onboarding
        }
      }

      // Create additional trainer if provided
      if (formData.trainerName) {
        // Split name into first and last name
        const nameParts = formData.trainerName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const trainerEmail = formData.trainerEmail.trim()
          ? formData.trainerEmail.trim()
          : `trainer_${Math.random().toString(36).substring(2, 11)}_${Date.now()}@yourgym.com`;

        const { error: trainerError } = await supabase
          .from("trainers")
          .insert({
            tenant_id: tenantId,
            first_name: firstName,
            last_name: lastName,
            email: trainerEmail,
            phone: formData.trainerPhone || null,
            status: "active",
            specialties: [formData.trainerSpecialization || "General Fitness"],
            hourly_rate: 0
          });

        if (trainerError) {
          if (import.meta.env.DEV) console.error("Error creating trainer:", trainerError);
          // Don't throw - this is optional, continue with onboarding
        }
      }

      // Update user metadata to mark onboarding as completed
      await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          gym_name: formData.gymName
        }
      });

      // Show success message
      toast.success("Welcome to MTDRB! Your gym has been successfully set up.");
      
      // Redirect to dashboard with success message
      navigate("/dashboard", { 
        replace: true,
        state: { 
          message: "Welcome to MTDRB! Your gym has been successfully set up." 
        } 
      });

    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Onboarding completion error:", err);
      const errorMessage = extractErrorMessage(err) || "Failed to complete onboarding";
      setError(errorMessage);
      toast.error(errorMessage);
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
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || "Failed to skip onboarding");
    } finally {
      setLoading(false);
    }
  };

  const isRTL = formData.language === "Arabic";

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/mtdrb-logo.svg" alt="MTDRB" className="h-8 w-auto" />
              <div className="text-start">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Setup Your Gym</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Complete your gym configuration</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index <= currentStep 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400"
                }`}>
                  {index < currentStep ? (
                    <FiCheck className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-16 h-0.5 mx-2 ${
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
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
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleComplete();
                    }}
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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

function GymInfoStep({ formData, setFormData }: { formData: OnboardingFormData; setFormData: SetOnboardingFormData }) {
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

function BranchSetupStep({ formData, setFormData }: { formData: OnboardingFormData; setFormData: SetOnboardingFormData }) {
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
          {Object.entries(formData.operatingHours).map(([day, hours]) => (
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

function StaffSetupStep({ formData, setFormData }: { formData: OnboardingFormData; setFormData: SetOnboardingFormData }) {
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

function BrandingStep({ formData, setFormData }: { formData: OnboardingFormData; setFormData: SetOnboardingFormData }) {
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Gym Logo
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
          <FiUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Upload your gym&apos;s logo (optional)
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

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Your gym&apos;s branding will use the default MTDRB color scheme. You can customize other settings later in the Settings page.
        </p>
      </div>
    </div>
  );
} 