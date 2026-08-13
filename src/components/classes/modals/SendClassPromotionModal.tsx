import React, { useState, useEffect } from "react";
import {
  FiSend,
} from "react-icons/fi";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";
import { toast } from "react-hot-toast";
import { supabase } from "../../../supabaseClient";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        title: classId
          ? t("classes.specialOfferClassPromotion")
          : t("classes.specialOfferNewClasses"),
        message: t("classes.defaultPromotionMessage"),
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

    if (!formData.title.trim()) newErrors.push(t("classes.titleIsRequired"));
    if (!formData.message.trim()) newErrors.push(t("classes.messageIsRequired"));
    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.push(t("classes.discountMustBeBetween"));
    }
    if (!formData.validUntil) newErrors.push(t("classes.validUntilRequired"));
    if (formData.channels.length === 0)
      newErrors.push(t("classes.selectAtLeastOneChannel"));
    if (selectedMembers.length === 0)
      newErrors.push(t("classes.selectAtLeastOneMember"));

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
        t("classes.promotionSentSuccessfully", { count: selectedMembers.length }),
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error sending promotion:", error);
      toast.error(t("classes.failedToSendPromotion"));
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
      title={t("classes.sendClassPromotion")}
      subtitle={t("classes.createTargetedPromotions")}
    >
      <div className="space-y-6">
        {/* Promotion Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("classes.promotionTitle")}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("classes.enterPromotionTitle")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("classes.message")}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("classes.enterPromotionMessage")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("classes.discountPercentage")}
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
                {t("classes.validUntil")}
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
            {t("classes.targetAudience")}
          </label>
          <select
            value={formData.targetAudience}
            onChange={(e) =>
              handleInputChange("targetAudience", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="waitlist">{t("classes.waitlistMembers")}</option>
            <option value="previous_attendees">{t("classes.previousAttendees")}</option>
            <option value="inactive_members">{t("classes.inactiveMembers")}</option>
            <option value="all_members">{t("classes.allMembers")}</option>
          </select>
        </div>

        {/* Communication Channels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("classes.communicationChannels")}
          </label>
          <div className="space-y-2">
            {[
              { value: "email", label: t("classes.channelEmail") },
              { value: "sms", label: t("classes.channelSms") },
              { value: "push", label: t("classes.channelPush") },
            ].map((channel) => (
              <label key={channel.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.channels.includes(channel.value)}
                  onChange={() => handleChannelToggle(channel.value)}
                  className="mr-2"
                />
                <span>{channel.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Member Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("classes.selectMembersCount", { count: selectedMembers.length })}
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
                  {(() => {
                    const statusMap: Record<string, string> = {
                      active: t("classes.active"),
                      waitlist: t("classes.waitlist"),
                      inactive: t("classes.inactive"),
                    };
                    return statusMap[member.status] || member.status;
                  })()}
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
          <h4 className="font-medium text-blue-900 mb-2">{t("classes.preview")}</h4>
          <div className="text-sm text-blue-800">
            <div>
              <strong>{t("classes.titleLabel")}:</strong> {formData.title}
            </div>
            <div>
              <strong>{t("classes.discountPercentage")}:</strong> {formData.discountPercentage}%
            </div>
            <div>
              <strong>{t("classes.validUntil")}:</strong> {formData.validUntil}
            </div>
            <div>
              <strong>{t("classes.channelsLabel")}:</strong> {formData.channels.join(", ")}
            </div>
            <div>
              <strong>{t("classes.recipientsLabel")}:</strong> {t("classes.membersCount", { count: selectedMembers.length })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-3 mt-6">
        <SmartButton variant="secondary" onClick={onClose} disabled={loading}>
          {t("common.cancel")}
        </SmartButton>
        <SmartButton
          variant="primary"
          onClick={handleSend}
          loading={loading}
          disabled={loading}
          icon={<FiSend className="h-4 w-4" />}
        >
          {t("classes.sendPromotion")}
        </SmartButton>
      </div>
    </ColorfulModalUI>
  );
};

export default SendClassPromotionModal;
