import React, { useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  FiX,
  FiTrash2,
  FiAlertTriangle,
  FiPlus,
  FiEdit,
} from "react-icons/fi";
import { SmartModal } from "../ui/SmartModal";
import { SmartButton } from "../ui/DesignSystem";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import {
  AppleInput,
  AppleTextarea,
  AppleButtonGroup,
  AppleSelect,
} from "../AppleStyleModal";

// Add plan related types
type subscription_plan_type = "Membership" | "PT" | "Class Pack" | "Online";
type billing_cycle = "Weekly" | "Monthly" | "Annually";

interface Plan {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  plan_type: subscription_plan_type;
  price: number;
  billing_cycle: billing_cycle;
  features: string[] | null;
  max_members: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ManagePlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  planName,
}: DeleteConfirmationModalProps) {
  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Plan"
      subtitle={`Are you sure you want to delete the plan "${planName}"? This action cannot be undone.`}
      footer={
        <div className="flex items-center justify-end space-x-3">
          <SmartButton variant="secondary" onClick={onClose}>
            Cancel
          </SmartButton>
          <SmartButton variant="danger" onClick={onConfirm}>
            Delete Plan
          </SmartButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <FiAlertTriangle className="text-red-500 text-2xl" />
          <p className="text-gray-700">
            Are you sure you want to delete the plan &quot;{planName}&quot;? This
            action cannot be undone.
          </p>
        </div>
      </div>
    </SmartModal>
  );
}

export function ManagePlansModal({
  isOpen,
  onClose,
  tenantId,
}: ManagePlansModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    billing_cycle: "monthly",
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("plans")
        .select("*, subscriptions(count)")
        .eq("tenant_id", tenantId)
        .order("name");

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error((error as Error).message || "Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen, fetchPlans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.name || formData.price <= 0) {
        throw new Error(
          "Please fill in all required fields and ensure price is greater than 0",
        );
      }

      if (editingPlan) {
        // Check if plan is in use before allowing price changes
        if (formData.price !== editingPlan.price) {
          const { data: subscriptions } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("plan_id", editingPlan.id)
            .eq("status", "active");

          if (subscriptions && subscriptions.length > 0) {
            throw new Error(
              "Cannot modify price of a plan that has active subscriptions",
            );
          }
        }

        const { error } = await supabase
          .from("plans")
          .update({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            billing_cycle: formData.billing_cycle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPlan.id);

        if (error) throw error;
        toast.success("Plan updated successfully");
      } else {
        const { error } = await supabase.from("plans").insert([
          {
            tenant_id: tenantId,
            name: formData.name,
            description: formData.description,
            price: formData.price,
            billing_cycle: formData.billing_cycle,
          },
        ]);

        if (error) throw error;
        toast.success("Plan created successfully");
      }

      setShowPlanForm(false);
      setEditingPlan(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        billing_cycle: "monthly",
      });
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error((error as Error).message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    try {
      // Check if plan has any subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("plan_id", plan.id);

      if (subscriptions && subscriptions.length > 0) {
        throw new Error("Cannot delete a plan that has subscriptions");
      }

      const { error } = await supabase.from("plans").delete().eq("id", plan.id);

      if (error) throw error;
      toast.success("Plan deleted successfully");
      setShowDeleteConfirmation(false);
      setPlanToDelete(null);
      fetchPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error((error as Error).message || "Failed to delete plan");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title="Manage Subscription Plans"
          subtitle="Create and manage membership plans"
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="secondary" onClick={onClose}>
                Close
              </SmartButton>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Plans List */}
            {!showPlanForm && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Current Plans
                  </h3>
                  <SmartButton
                    onClick={() => setShowPlanForm(true)}
                    className="flex items-center space-x-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Plan
                  </SmartButton>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading plans...</p>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No plans found. Create your first plan to get started.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {plan.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {plan.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm font-medium text-blue-600">
                              {plan.price} BHD
                            </span>
                            <span className="text-sm text-gray-500">
                              {plan.billing_cycle}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                plan.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {plan.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingPlan(plan);
                              setShowPlanForm(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setPlanToDelete(plan);
                              setShowDeleteConfirmation(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Plan Form */}
            {showPlanForm && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingPlan ? "Edit Plan" : "Create New Plan"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowPlanForm(false);
                      setEditingPlan(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppleInput
                      label="Plan Name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      error={""}
                      required
                      placeholder="Enter plan name"
                    />

                    <AppleInput
                      label="Price (BHD)"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      error={""}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <AppleTextarea
                    label="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    error={""}
                    placeholder="Describe the plan..."
                    rows={3}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppleSelect
                      label="Billing Cycle"
                      value={formData.billing_cycle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billing_cycle: e.target.value,
                        })
                      }
                      error={""}
                      required
                    >
                      <option value="">Select billing cycle</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi_annual">Semi-Annual</option>
                      <option value="annual">Annual</option>
                    </AppleSelect>

                    <AppleInput
                      label="Duration (months)"
                      type="number"
                      value={""}
                      onChange={() => {}}
                      error={""}
                      placeholder="12"
                    />
                  </div>

                  <AppleButtonGroup>
                    <SmartButton
                      variant="ghost"
                      onClick={() => {
                        setShowPlanForm(false);
                        setEditingPlan(null);
                      }}
                    >
                      Cancel
                    </SmartButton>
                    <SmartButton
                      type="submit"
                      loading={loading}
                      disabled={loading}
                    >
                      {loading
                        ? "Saving..."
                        : editingPlan
                          ? "Update Plan"
                          : "Create Plan"}
                    </SmartButton>
                  </AppleButtonGroup>
                </form>
              </div>
            )}
          </div>

          <DeleteConfirmationModal
            isOpen={showDeleteConfirmation}
            onClose={() => {
              setShowDeleteConfirmation(false);
              setPlanToDelete(null);
            }}
            onConfirm={() => planToDelete && handleDelete(planToDelete)}
            planName={planToDelete?.name || ""}
          />
        </SmartModal>
      )}
    </AnimatePresence>
  );
}

export default ManagePlansModal;
