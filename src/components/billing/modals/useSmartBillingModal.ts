import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

interface BillingData {
  memberId?: string;
  invoiceId?: string;
  planId?: string;
  amount?: number;
  vatRate?: number;
  currency?: string;
  dueDate?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface SmartSuggestion {
  type: "pricing" | "payment" | "reminder" | "optimization";
  message: string;
  priority: "low" | "medium" | "high";
  action?: string;
}

export const useSmartBillingModal = (initialData?: BillingData) => {
  const [data, setData] = useState<BillingData>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  // Get Pro user status from user profile/membership
  const [isProUser, setIsProUser] = useState(false);
  
  useEffect(() => {
    const checkProStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: membership } = await supabase
          .from("memberships")
          .select("role")
          .eq("user_id", user.id)
          .single();

        // Pro users are owners/admins/managers
        const proRoles = ["owner", "admin", "manager"];
        setIsProUser(proRoles.includes(membership?.role || ""));
      } catch (error) {
        console.error("Error checking Pro status:", error);
        setIsProUser(false);
      }
    };
    checkProStatus();
  }, []);

  // VAT calculation
  const calculateVAT = (amount: number, vatRate: number = 15) => {
    return (amount * vatRate) / 100;
  };

  // Real-time validation
  const validateField = (field: string, value: any): string[] => {
    const errors: string[] = [];

    switch (field) {
      case "amount":
        if (value <= 0) errors.push("Amount must be greater than 0");
        if (value > 100000) errors.push("Amount seems unusually high");
        break;
      case "vatRate":
        if (value < 0 || value > 100)
          errors.push("VAT rate must be between 0-100%");
        break;
      case "dueDate":
        const date = new Date(value);
        if (date < new Date()) errors.push("Due date cannot be in the past");
        break;
      case "memberId":
        if (!value) errors.push("Member selection is required");
        break;
    }

    return errors;
  };

  // Smart-powered suggestions using real data
  const generateSuggestions = async (context: string) => {
    setLoading(true);

    try {
      // Get tenant ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: membership } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!membership?.tenant_id) {
        setLoading(false);
        return;
      }

      const realSuggestions: SmartSuggestion[] = [];

      // Check for overdue invoices
      if (context.includes("member") || context.includes("invoice")) {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("id, member_id, amount, status, due_date")
          .eq("tenant_id", membership.tenant_id)
          .eq("status", "unpaid")
          .lt("due_date", new Date().toISOString().split("T")[0]);

        if (invoices && invoices.length > 0) {
          const overdueCount = invoices.length;
          const totalOverdue = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

          realSuggestions.push({
            id: "overdue-invoices",
            type: "escalation",
            title: "Overdue Invoices",
            description: `${overdueCount} invoice(s) totaling ${totalOverdue.toFixed(2)} are overdue. Recommend payment plan.`,
            confidence: 0.95,
            impact: totalOverdue > 1000 ? "high" : "medium",
            action: "Setup payment plan",
            isPro: false,
          });
        }
      }

      // VAT rate suggestion (standard 15% for UAE)
      if (context.includes("vat") || context.includes("tax")) {
        realSuggestions.push({
          id: "vat-rate",
          type: "optimization",
          title: "VAT Rate",
          description: "VAT rate should be 15% for this service type in UAE.",
          confidence: 1.0,
          impact: "low",
          action: "Apply correct VAT",
          isPro: false,
        });
      }

      // If no real suggestions, use basic defaults
      if (realSuggestions.length === 0) {
        realSuggestions.push({
          id: "default-vat",
          type: "optimization",
          title: "VAT Rate",
          description: "VAT rate should be 15% for this service type.",
          confidence: 1.0,
          impact: "low",
          action: "Apply correct VAT",
          isPro: false,
        });
      }

      setSuggestions(realSuggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // Fallback to empty array on error
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate totals
  const calculateTotals = (subtotal: number, vatRate: number = 15) => {
    const vat = calculateVAT(subtotal, vatRate);
    const total = subtotal + vat;

    return {
      subtotal,
      vat,
      total,
      vatRate,
    };
  };

  // Smart defaults from real data
  const getSmartDefaults = async (memberId?: string) => {
    if (!memberId) {
      return {
        vatRate: 15, // Standard UAE VAT rate
        currency: "AED",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 30 days from now
        paymentTerms: "Net 30",
      };
    }

    try {
      // Get member data from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data: membership } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!membership?.tenant_id) return {};

      const { data: member } = await supabase
        .from("members")
        .select("id, membership_type")
        .eq("id", memberId)
        .eq("tenant_id", membership.tenant_id)
        .single();

      return {
        vatRate: 15, // Standard UAE VAT rate
        currency: "AED",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        paymentTerms: "Net 30",
        membershipType: member?.membership_type,
      };
    } catch (error) {
      console.error("Error fetching member defaults:", error);
      return {
        vatRate: 15,
        currency: "AED",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        paymentTerms: "Net 30",
      };
    }
  };

  // Update data with validation
  const updateData = (updates: Partial<BillingData>) => {
    const newData = { ...data, ...updates };
    setData(newData);

    // Validate all fields
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(updates).forEach(([field, value]) => {
      const fieldErrors = validateField(field, value);
      errors.push(...fieldErrors);
    });

    // Special validations
    if (newData.amount && newData.vatRate) {
      const totals = calculateTotals(newData.amount, newData.vatRate);
      if (totals.total > 50000) {
        warnings.push("Large invoice detected. Consider payment plan.");
      }
    }

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  };

  // Fetch related data from Supabase
  const fetchRelatedData = async (
    type: "member" | "invoice" | "plan",
    id?: string,
  ) => {
    if (!id) return null;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return null;
      }

      const { data: membership } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!membership?.tenant_id) {
        setLoading(false);
        return null;
      }

      if (type === "member") {
        const { data: member } = await supabase
          .from("members")
          .select("id, first_name, last_name, email, phone, membership_type")
          .eq("id", id)
          .eq("tenant_id", membership.tenant_id)
          .single();

        if (member) {
          // Calculate outstanding balance from unpaid invoices
          const { data: unpaidInvoices } = await supabase
            .from("invoices")
            .select("amount")
            .eq("member_id", id)
            .eq("tenant_id", membership.tenant_id)
            .eq("status", "unpaid");

          const outstandingBalance = unpaidInvoices?.reduce(
            (sum, inv) => sum + (Number(inv.amount) || 0),
            0
          ) || 0;

          setLoading(false);
          return {
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            email: member.email,
            phone: member.phone,
            membershipType: member.membership_type,
            outstandingBalance,
          };
        }
      } else if (type === "invoice") {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", id)
          .eq("tenant_id", membership.tenant_id)
          .single();

        if (invoice) {
          setLoading(false);
          return {
            id: invoice.id,
            number: invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`,
            amount: Number(invoice.amount) || 0,
            status: invoice.status,
            dueDate: invoice.due_date,
          };
        }
      }
      // Plans would need a plans table - return null for now
      setLoading(false);
      return null;
    } catch (error) {
      console.error("Error fetching related data:", error);
      setLoading(false);
      return null;
    }
  };

  return {
    data,
    loading,
    validation,
    suggestions,
    isProUser,
    updateData,
    calculateVAT,
    calculateTotals,
    validateField,
    generateSuggestions,
    getSmartDefaults,
    fetchRelatedData,
  };
};
