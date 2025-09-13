import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiTarget,
  FiHeart,
  FiFileText,
  FiCamera,
  FiX,
  FiSave,
} from "react-icons/fi";
import { SmartModal } from "./ui/SmartModal";
import { SmartButton } from "./ui/DesignSystem";
import { api } from "../api/client";
import type { UserProfile } from "../types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const profileData = await api.fetchUserProfile();
      setProfile(profileData);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError("");
    try {
      const updatedProfile = await api.updateUserProfile(profile);
      if (updatedProfile) {
        setProfile(updatedProfile);
        // Close modal after successful save
        setTimeout(() => onClose(), 1000);
      } else {
        setError("Failed to save profile");
      }
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  if (loading) {
    return (
      <SmartModal isOpen={isOpen} onClose={onClose} title="Profile">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SmartModal>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title="User Profile"
          subtitle="View and manage your profile information"
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="secondary" onClick={onClose}>
                Close
              </SmartButton>
            </div>
          }
        >
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {profile?.first_name?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition">
                  <FiCamera size={14} />
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile?.first_name || ""}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-200 ease-out"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile?.last_name || ""}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-200 ease-out"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 text-base font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile?.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-200 ease-out"
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center space-x-2"
              >
                <FiX size={16} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave size={16} />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </SmartModal>
      )}
    </AnimatePresence>
  );
}
