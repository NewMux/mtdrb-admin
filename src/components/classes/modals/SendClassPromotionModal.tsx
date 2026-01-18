import React, { useState, useEffect } from "react";
import {
  FiSend,
} from "react-icons/fi";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";
import { toast } from "react-hot-toast";
import { supabase } from "../../../supabaseClient";

interface SendClassPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  classId?: string;
  isPro?: boolean;
}

interface PromotionFormData {
  title: string;
  message: string;
  targetAudience:
    | "waitlist"
    | "previous_attendees"
    | "all_members"
    | "inactive_members";
  discountPercentage: number;
  validUntil: string;
  channels: string[];
}

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
  lastClass?: string;
}

const SendClassPromotionModal: React.FC<SendClassPromotionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  classId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPro = false,
}) => {
  const [formData, setFormData] = useState<PromotionFormData>({
    title: "",
    message: "",
    targetAudience: "waitlist",
    discountPercentage: 15,
    validUntil: "",
    channels: ["email", "sms"],
  });

  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Fetch members from Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      if (!isOpen) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let tenantId = user.user_metadata?.tenant_id;
        if (!tenantId) {
          const { data: membershipData } = await supabase
            .from("memberships")
            .select("tenant_id")
            .eq("user_id", user.id)
            .single();
          tenantId = membershipData?.tenant_id;
        }

        if (tenantId) {
          const { data, error } = await supabase
            .from("members")
            .select("id, first_name, last_name, email, status")
            .eq("tenant_id", tenantId);

          if (error) throw error;
          
          const formattedMembers: Member[] = (data || []).map((m: { id: string; first_name: string; last_name: string; email: string; status: string }) => ({
            id: m.id,
            name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
            email: m.email,
            status: m.status,
            lastClass: undefined, // TODO: Fetch from class_bookings
          }));
          
          setMembers(formattedMembers);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        setMembers([]);
      }
    };

    if (isOpen) {
      fetchMembers();
      // Set default title and message based on class
      setFormData((prev) => ({
        ...prev,
        title: `Special Offer: ${classId ? "Class Promotion" : "New Classes Available"}`,
        message: `Don&apos;t miss out on our amazing classes! We have special offers just for you.`,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      }));
    }
  }, [isOpen, classId]);

  const handleInputChange = (field: keyof PromotionFormData, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleChannelToggle = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) newErrors.push("Title is required");
    if (!formData.message.trim()) newErrors.push("Message is required");
    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.push("Discount must be between 0-100%");
    }
    if (!formData.validUntil) newErrors.push("Valid until date is required");
    if (formData.channels.length === 0)
      newErrors.push("Select at least one channel");
    if (selectedMembers.length === 0)
      newErrors.push("Select at least one member");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        `Promotion sent to ${selectedMembers.length} members successfully!`,
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error sending promotion:", error);
      toast.error("Failed to send promotion");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMembers = () => {
    switch (formData.targetAudience) {
      case "waitlist":
        return members.filter((m) => m.status === "waitlist");
      case "previous_attendees":
        return members.filter((m) => m.status === "active" && m.lastClass);
      case "inactive_members":
        return members.filter((m) => m.status === "inactive");
      case "all_members":
        return members;
      default:
        return members;
    }
  };

  const filteredMembers = getFilteredMembers();

  return (
    <ColorfulModalUI
      open={isOpen}
      onClose={onClose}
      title="Send Class Promotion"
      subtitle="Create targeted promotions to boost class attendance"
    >
      <div className="space-y-6">
        {/* Promotion Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promotion Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter promotion title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your promotion message..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage
              </label>
              <input
                type="number"
                value={formData.discountPercentage}
                onChange={(e) =>
                  handleInputChange(
                    "discountPercentage",
                    parseInt(e.target.value),
                  )
                }
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) =>
                  handleInputChange("validUntil", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <select
            value={formData.targetAudience}
            onChange={(e) =>
              handleInputChange("targetAudience", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="waitlist">Waitlist Members</option>
            <option value="previous_attendees">Previous Attendees</option>
            <option value="inactive_members">Inactive Members</option>
            <option value="all_members">All Members</option>
          </select>
        </div>

        {/* Communication Channels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Communication Channels
          </label>
          <div className="space-y-2">
            {["email", "sms", "push"].map((channel) => (
              <label key={channel} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.channels.includes(channel)}
                  onChange={() => handleChannelToggle(channel)}
                  className="mr-2"
                />
                <span className="capitalize">{channel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Member Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Members ({selectedMembers.length} selected)
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {filteredMembers.map((member) => (
              <label
                key={member.id}
                className="flex items-center p-2 hover:bg-gray-50 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  className="mr-2"
                />
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    member.status === "active"
                      ? "bg-green-100 text-green-800"
                      : member.status === "waitlist"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {member.status}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            {errors.map((error, index) => (
              <div key={index} className="text-red-700 text-sm">
                {error}
              </div>
            ))}
          </div>
        )}

        {/* Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
          <div className="text-sm text-blue-800">
            <div>
              <strong>Title:</strong> {formData.title}
            </div>
            <div>
              <strong>Discount:</strong> {formData.discountPercentage}%
            </div>
            <div>
              <strong>Valid Until:</strong> {formData.validUntil}
            </div>
            <div>
              <strong>Channels:</strong> {formData.channels.join(", ")}
            </div>
            <div>
              <strong>Recipients:</strong> {selectedMembers.length} members
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-3 mt-6">
        <SmartButton variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </SmartButton>
        <SmartButton
          variant="primary"
          onClick={handleSend}
          loading={loading}
          disabled={loading}
          icon={<FiSend className="h-4 w-4" />}
        >
          Send Promotion
        </SmartButton>
      </div>
    </ColorfulModalUI>
  );
};

export default SendClassPromotionModal;
