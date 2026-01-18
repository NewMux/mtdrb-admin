import React from "react";
import { SmartCard, SmartButton } from "../ui/DesignSystem";
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
} from "react-icons/fi";

interface QuickActionsHubProps {
  refreshKey: number;
}

export const QuickActionsHub: React.FC<QuickActionsHubProps> = () => {
  interface QuickAction {
    title: string;
    icon: React.ReactNode;
    variant: "primary" | "secondary" | "success" | "warning" | "danger" | "ghost";
    onClick: () => void;
  }

  const quickActions: QuickAction[] = [
    {
      title: "Add Member",
      icon: <FiUsers className="h-5 w-5" />,
      variant: "primary",
      onClick: () => {},
    },
    {
      title: "Schedule Class",
      icon: <FiCalendar className="h-5 w-5" />,
      variant: "secondary",
      onClick: () => {},
    },
    {
      title: "Process Payment",
      icon: <FiDollarSign className="h-5 w-5" />,
      variant: "secondary",
      onClick: () => {},
    },
  ];

  return (
    <SmartCard className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Quick Actions
      </h3>
      <div className="flex flex-col gap-3">
        {quickActions.map((action, idx) => (
          <SmartButton
            key={idx}
            variant={action.variant}
            size="md"
            icon={action.icon}
            iconPosition="left"
            fullWidth
            className="rounded-xl"
            onClick={action.onClick}
          >
            {action.title}
          </SmartButton>
        ))}
      </div>
    </SmartCard>
  );
};
