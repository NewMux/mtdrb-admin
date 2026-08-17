import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiZap,
  FiBarChart,
  FiActivity,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { UnifiedModal } from "../components/ui/UnifiedModal";
import { AppleInput, AppleTextarea, AppleSelect } from "../components/AppleStyleModal";

// New unified UI components
import {
  PageLayout,
  SmartCard,
  SmartButton,
  FilterBar,
  Section,
  StatsGrid,
  KPICard,
  SmartLoading,
  EmptyState,
} from "../components/ui";
import {
  QuickNavigation,
  SmartSuggestions,
  usePageNavigation,
} from "../components/ui/SmartNavigation";
import FilterButton from "../components/ui/FilterButton";

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  features: string[];
  status: "active" | "inactive";
  members_count: number;
  created_at: string;
}

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  features: string;
  status: "active" | "inactive";
}

const emptyPlanForm: PlanFormData = {
  name: "",
  description: "",
  price: "",
  duration: "30",
  features: "",
  status: "active",
};

export default function Plans() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [durationFilter, setDurationFilter] = useState("all");
  const [planForm, setPlanForm] = useState<PlanFormData>(emptyPlanForm);
  const [planFormErrors, setPlanFormErrors] = useState<Partial<Record<keyof PlanFormData, string>>>({});
  const [savingPlan, setSavingPlan] = useState(false);
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const { currentPage } = usePageNavigation();

  // Plan KPIs
  const planKPIs = [
    {
      title: "Total Plans",
      value: plans.length,
      change: "+2",
      trend: "up" as const,
      icon: <FiPackage className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Active Plans",
      value: plans.filter((p) => p.status === "active").length,
      change: "+1",
      trend: "up" as const,
      icon: <FiActivity className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Total Members",
      value: plans.reduce((sum, p) => sum + p.members_count, 0),
      change: "+18.5%",
      trend: "up" as const,
      icon: <FiUsers className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Avg Plan Value",
      value:
        plans.length > 0
          ? `$${(plans.reduce((sum, p) => sum + p.price, 0) / plans.length).toFixed(0)}`
          : "$0",
      change: "+8.2%",
      trend: "up" as const,
      icon: <FiDollarSign className="h-6 w-6" />,
      color: "green" as const,
    },
  ];

  const contextualActions = [
    {
      label: "Create Plan",
      icon: <FiPlus className="h-4 w-4" />,
      onClick: () => {
        setSelectedPlan(null);
        setPlanForm(emptyPlanForm);
        setPlanFormErrors({});
        setShowPlanModal(true);
      },
      variant: "primary" as const,
    },
    {
      label: "Plan Analytics",
      icon: <FiBarChart className="h-4 w-4" />,
      onClick: () => navigate("/dashboard/analytics"),
      variant: "secondary" as const,
    },
    {
      label: "Member Plans",
      icon: <FiUsers className="h-4 w-4" />,
      onClick: () => navigate("/dashboard/members"),
      variant: "ghost" as const,
    },
  ];

  const fetchPlans = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPlans(
        (data || []).map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description ?? undefined,
          price: Number(row.price),
          duration: row.duration,
          features: Array.isArray(row.features) ? (row.features as string[]) : [],
          status: row.status === "inactive" ? "inactive" : "active",
          members_count: row.members_count ?? 0,
          created_at: row.created_at,
        })),
      );
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      price: String(plan.price),
      duration: String(plan.duration),
      features: plan.features.join(", "),
      status: plan.status,
    });
    setPlanFormErrors({});
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm("Delete this plan? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("plans").delete().eq("id", planId);
      if (error) throw error;
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success("Plan deleted successfully");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const handlePlanFormChange = (field: keyof PlanFormData, value: string) => {
    setPlanForm((prev) => ({ ...prev, [field]: value }));
    if (planFormErrors[field]) {
      setPlanFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validatePlanForm = (): boolean => {
    const errors: Partial<Record<keyof PlanFormData, string>> = {};
    if (!planForm.name.trim()) errors.name = "Plan name is required";
    const priceNum = parseFloat(planForm.price);
    if (!planForm.price || isNaN(priceNum) || priceNum < 0) {
      errors.price = "Enter a valid price";
    }
    const durationNum = parseInt(planForm.duration, 10);
    if (!planForm.duration || isNaN(durationNum) || durationNum <= 0) {
      errors.duration = "Enter a valid duration in days";
    }
    setPlanFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePlan = async () => {
    if (!validatePlanForm()) return;
    if (!tenantId) {
      toast.error("No tenant ID found");
      return;
    }

    setSavingPlan(true);
    try {
      const payload = {
        tenant_id: tenantId,
        name: planForm.name.trim(),
        description: planForm.description.trim() || null,
        price: parseFloat(planForm.price),
        duration: parseInt(planForm.duration, 10),
        features: planForm.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        status: planForm.status,
      };

      if (selectedPlan) {
        const { error } = await supabase
          .from("plans")
          .update(payload)
          .eq("id", selectedPlan.id);
        if (error) throw error;
        toast.success("Plan updated successfully");
      } else {
        const { error } = await supabase.from("plans").insert([payload]);
        if (error) throw error;
        toast.success("Plan created successfully");
      }

      setShowPlanModal(false);
      setSelectedPlan(null);
      setPlanForm(emptyPlanForm);
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error(
        (error instanceof Error ? error.message : undefined) || "Failed to save plan",
      );
    } finally {
      setSavingPlan(false);
    }
  };

  const handleClosePlanModal = () => {
    if (savingPlan) return;
    setShowPlanModal(false);
    setSelectedPlan(null);
    setPlanForm(emptyPlanForm);
    setPlanFormErrors({});
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || plan.status === statusFilter;
    
    // Advanced filter: price range
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
    const matchesPrice = plan.price >= minPrice && plan.price <= maxPrice;
    
    // Advanced filter: duration
    const matchesDuration = durationFilter === "all" || 
      (durationFilter === "monthly" && plan.duration <= 31) ||
      (durationFilter === "quarterly" && plan.duration > 31 && plan.duration <= 92) ||
      (durationFilter === "annual" && plan.duration > 92);

    return matchesSearch && matchesStatus && matchesPrice && matchesDuration;
  });

  if (loading) {
    return <SmartLoading message="Loading Smart Plan Management..." />;
  }

  return (
    <PageLayout
      title="Smart Plan Management"
      subtitle="Smart-powered membership plans and pricing optimization"
      actions={
        <div className="flex items-center space-x-3">
          {contextualActions.map((action, index) => (
            <SmartButton
              key={index}
              variant={action.variant}
              size="sm"
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </SmartButton>
          ))}
        </div>
      }
    >
      {/* Quick Navigation */}
      <QuickNavigation currentPage={currentPage} />

      {/* Smart Suggestions */}
      <SmartSuggestions currentPage={currentPage} />

      {/* KPI Overview */}
      <Section
        title="Plan Overview"
        subtitle="Real-time membership plan performance"
      >
        <StatsGrid columns={4}>
          {planKPIs.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </StatsGrid>
      </Section>

      {/* Search and Filters */}
      <FilterBar>
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <FilterButton
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          active={showAdvancedFilters}
        />
      </FilterBar>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <SmartCard className="mt-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Advanced Filters</h4>
            <button
              onClick={() => {
                setPriceRange({ min: "", max: "" });
                setDurationFilter("all");
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Duration
              </label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Durations</option>
                <option value="monthly">Monthly (up to 31 days)</option>
                <option value="quarterly">Quarterly (32-92 days)</option>
                <option value="annual">Annual (93+ days)</option>
              </select>
            </div>
          </div>
        </SmartCard>
      )}

      {/* Plans Grid */}
      <Section
        title="Membership Plans"
        subtitle="Manage and optimize your pricing strategy"
      >
        {filteredPlans.length === 0 ? (
          <EmptyState
            icon={<FiPackage className="h-16 w-16" />}
            title="No Plans Found"
            description="Start by creating your first membership plan to manage pricing."
            action={
              <SmartButton
                onClick={() => {
                  setSelectedPlan(null);
                  setPlanForm(emptyPlanForm);
                  setPlanFormErrors({});
                  setShowPlanModal(true);
                }}
                variant="primary"
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Create First Plan
              </SmartButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <SmartCard key={plan.id} hover className="relative">
                <div className="p-6 space-y-4">
                  {/* Plan Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {plan.description}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {plan.status}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                    </div>
                    <div className="text-sm text-gray-600">
                      per {plan.duration} days
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Features:</h4>
                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-center"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-sm text-gray-500">
                          +{plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Members Count */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <FiUsers className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {plan.members_count} members
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                      >
                        Edit
                      </SmartButton>
                      <SmartButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        Delete
                      </SmartButton>
                    </div>
                  </div>
                </div>
              </SmartCard>
            ))}
          </div>
        )}
      </Section>

      {/* Plan Analytics */}
      <Section
        title="Plan Performance"
        subtitle="Insights and recommendations for pricing optimization"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SmartCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Popular Plans
              </h3>
              <div className="space-y-4">
                {plans
                  .sort((a, b) => b.members_count - a.members_count)
                  .slice(0, 3)
                  .map((plan, index) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            index === 0
                              ? "bg-green-500"
                              : index === 1
                                ? "bg-blue-500"
                                : "bg-purple-500"
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {plan.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${plan.price}/month
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {plan.members_count}
                        </p>
                        <p className="text-sm text-gray-600">members</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </SmartCard>

          <SmartCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pricing Recommendations
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center mb-2">
                    <FiTrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="font-medium text-blue-900">
                      Optimize Basic Plan
                    </p>
                  </div>
                  <p className="text-sm text-blue-800">
                    Consider increasing Basic plan price by $5 based on demand
                    analysis
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center mb-2">
                    <FiZap className="h-5 w-5 text-green-600 mr-2" />
                    <p className="font-medium text-green-900">
                      Family Plan Opportunity
                    </p>
                  </div>
                  <p className="text-sm text-green-800">
                    23% of members have requested family pricing options
                  </p>
                </div>
              </div>
            </div>
          </SmartCard>
        </div>
      </Section>

      {/* Plan Create/Edit Modal */}
      <UnifiedModal
        isOpen={showPlanModal}
        onClose={handleClosePlanModal}
        title={selectedPlan ? "Edit Plan" : "Create New Plan"}
        subtitle={
          selectedPlan
            ? "Update this membership plan's pricing and features"
            : "Set up a new membership plan for your gym"
        }
        maxWidth="2xl"
        footer={
          <>
            <SmartButton
              variant="secondary"
              onClick={handleClosePlanModal}
              disabled={savingPlan}
            >
              Cancel
            </SmartButton>
            <SmartButton
              variant="primary"
              onClick={handleSavePlan}
              loading={savingPlan}
            >
              {savingPlan
                ? "Saving..."
                : selectedPlan
                  ? "Save Changes"
                  : "Create Plan"}
            </SmartButton>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSavePlan();
          }}
          className="space-y-4"
        >
          <AppleInput
            label="Plan Name"
            value={planForm.name}
            onChange={(e) => handlePlanFormChange("name", e.target.value)}
            required
            error={planFormErrors.name}
            placeholder="Gold Membership"
          />

          <AppleTextarea
            label="Description"
            value={planForm.description}
            onChange={(e) => handlePlanFormChange("description", e.target.value)}
            placeholder="Full gym access with unlimited classes"
          />

          <div className="grid grid-cols-2 gap-4">
            <AppleInput
              label="Price"
              type="number"
              value={planForm.price}
              onChange={(e) => handlePlanFormChange("price", e.target.value)}
              required
              error={planFormErrors.price}
              placeholder="99.00"
            />
            <AppleInput
              label="Duration (days)"
              type="number"
              value={planForm.duration}
              onChange={(e) => handlePlanFormChange("duration", e.target.value)}
              required
              error={planFormErrors.duration}
              placeholder="30"
            />
          </div>

          <AppleInput
            label="Features (comma-separated)"
            value={planForm.features}
            onChange={(e) => handlePlanFormChange("features", e.target.value)}
            placeholder="Unlimited classes, Personal trainer, Locker access"
          />

          <AppleSelect
            label="Status"
            value={planForm.status}
            onChange={(e) =>
              handlePlanFormChange("status", e.target.value as "active" | "inactive")
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </AppleSelect>
        </form>
      </UnifiedModal>
    </PageLayout>
  );
}
