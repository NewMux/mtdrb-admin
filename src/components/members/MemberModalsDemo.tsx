import React, { useState } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash,
  FiUpload,
  FiDownload,
  FiUser,
  FiMail,
  FiTarget,
  FiEye,
  FiZap,
  FiSend,
  FiFileText,
  FiTrendingUp,
  FiDollarSign,
} from "react-icons/fi";
import {
  AddMemberModal,
  EditMemberModal,
  DeleteMemberModal,
  ImportMembersModal,
  ViewMemberProfileModal,
  AssignTrainerModal,
} from "./modals";

const MemberModalsDemo: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("member-123");

  const modalConfigs = [
    {
      id: "add-member",
      title: "Add Member",
      description:
        "Create a new member with smart defaults and smart recommendations",
      icon: FiPlus,
      color: "bg-green-500",
      modal: AddMemberModal,
      props: { isPro: true },
    },
    {
      id: "edit-member",
      title: "Edit Member",
      description: "Update member information with real-time validation",
      icon: FiEdit,
      color: "bg-blue-500",
      modal: EditMemberModal,
      props: { memberId: selectedMemberId, isPro: true },
    },
    {
      id: "delete-member",
      title: "Delete Member",
      description: "Safely remove member with smart warnings and confirmation",
      icon: FiTrash,
      color: "bg-red-500",
      modal: DeleteMemberModal,
      props: { memberId: selectedMemberId },
    },
    {
      id: "import-members",
      title: "Import Members",
      description: "Bulk import members from CSV with smart mapping",
      icon: FiUpload,
      color: "bg-purple-500",
      modal: ImportMembersModal,
      props: { isPro: true },
    },
    {
      id: "view-profile",
      title: "View Profile",
      description: "Comprehensive member profile with tabs and analytics",
      icon: FiUser,
      color: "bg-indigo-500",
      modal: ViewMemberProfileModal,
      props: { memberId: selectedMemberId, isPro: true },
    },
    {
      id: "assign-trainer",
      title: "Assign Trainer",
      description: "Smart-powered trainer matching with availability preview",
      icon: FiTarget,
      color: "bg-orange-500",
      modal: AssignTrainerModal,
      props: { memberId: selectedMemberId, isPro: true },
    },
  ];

  const handleOpenModal = (modalId: string) => {
    setActiveModal(modalId);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleSuccess = () => {
    console.log("Modal action completed successfully");
    // You could add toast notifications here
  };

  const renderModal = () => {
    const config = modalConfigs.find((c) => c.id === activeModal);
    if (!config) return null;

    const ModalComponent = config.modal;
    const props = {
      isOpen: true,
      onClose: handleCloseModal,
      onSuccess: handleSuccess,
      ...config.props,
    };

    return <ModalComponent {...props} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MTDRB Member Management Modals
          </h1>
          <p className="text-gray-600">
            Smart, sliding modals with Apple-inspired design, smart
            recommendations, and real-time validation
          </p>
        </div>

        {/* Pro Features Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <FiZap className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Pro Features Enabled</h2>
          </div>
          <p className="text-blue-100">
            Smart-powered recommendations, smart defaults, and advanced
            analytics are available in this demo.
          </p>
        </div>

        {/* Modal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modalConfigs.map((config) => {
            const Icon = config.icon;
            return (
              <div
                key={config.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleOpenModal(config.id)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-lg ${config.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {config.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Click to open modal
                  </span>
                  <div className="text-xs text-gray-400">
                    {config.props.isPro && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                        Pro
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Overview */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Modal Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Design & UX</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Apple-inspired sliding animations</li>
                <li>• Sticky header and footer</li>
                <li>• Responsive design</li>
                <li>• Real-time validation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">AI & Smart Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Smart-powered recommendations</li>
                <li>• Smart defaults and suggestions</li>
                <li>• Predictive analytics</li>
                <li>• Automated workflows</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Functionality</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-step processes</li>
                <li>• Drag & drop file upload</li>
                <li>• Template system</li>
                <li>• Real-time preview</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How to Use
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • Click on any modal card above to open the corresponding modal
            </p>
            <p>• Each modal demonstrates different features and interactions</p>
            <p>
              • Pro features are enabled to show smart recommendations and
              advanced functionality
            </p>
            <p>
              • All modals include proper validation, loading states, and error
              handling
            </p>
          </div>
        </div>
      </div>

      {/* Render Active Modal */}
      {renderModal()}
    </div>
  );
};

export default MemberModalsDemo;
