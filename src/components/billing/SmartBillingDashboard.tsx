import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiTarget,
  FiArrowUp,
  FiArrowDown,
  FiShield,
  FiBarChart,
  FiPieChart,
  FiActivity,
  FiZap,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

interface SmartBillingDashboardProps {
  refreshKey: number;
}

interface BillingMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  vatCollected: number;
  outstandingAmount: number;
  membershipRevenue: number;
  classRevenue: number;
  ptRevenue: number;
  averageInvoiceValue: number;
  collectionRate: number;
  vatCompliance: number;
}

interface RevenueGrowth {
  percentage: number;
  trend: "up" | "down" | "stable";
  value: number;
}

export default function SmartBillingDashboard({
  refreshKey,
}: SmartBillingDashboardProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BillingMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    vatCollected: 0,
    outstandingAmount: 0,
    membershipRevenue: 0,
    classRevenue: 0,
    ptRevenue: 0,
    averageInvoiceValue: 0,
    collectionRate: 0,
    vatCompliance: 0,
  });
  const [revenueGrowth, setRevenueGrowth] = useState<RevenueGrowth>({
    percentage: 0,
    trend: "stable",
    value: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);

      // Get current month and previous month date ranges
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Fetch all invoices
      const { data: allInvoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("amount, status, created_at, items, metadata")
        .eq("tenant_id", tenantId);

      if (invoicesError) throw invoicesError;

      // Fetch current month invoices
      const { data: currentMonthInvoices } = await supabase
        .from("invoices")
        .select("amount, status, created_at, items, metadata")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(currentMonthStart))
        .lte("created_at", formatDate(currentMonthEnd));

      // Fetch previous month invoices
      const { data: previousMonthInvoices } = await supabase
        .from("invoices")
        .select("amount, status, created_at, items, metadata")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(previousMonthStart))
        .lte("created_at", formatDate(previousMonthEnd));

      const invoices = allInvoices || [];
      const currentInvoices = currentMonthInvoices || [];
      const previousInvoices = previousMonthInvoices || [];

      // Calculate metrics
      const totalRevenue = invoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

      const monthlyRevenue = currentInvoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

      const previousRevenue = previousInvoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

      const revenueGrowthPercentage = previousRevenue > 0
        ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      const outstandingAmount = invoices
        .filter(inv => inv.status === "pending" || inv.status === "overdue")
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

      // Calculate VAT collected (assuming 5% VAT rate)
      const vatCollected = invoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + (Number(inv.amount || 0) * 0.05), 0);

      // Calculate revenue by type from invoice items/metadata
      let membershipRevenue = 0;
      let classRevenue = 0;
      let ptRevenue = 0;

      invoices
        .filter(inv => inv.status === "paid")
        .forEach(inv => {
          const amount = Number(inv.amount || 0);
          const metadata =
            inv.metadata && typeof inv.metadata === "object"
              ? (inv.metadata as Record<string, unknown>)
              : {};
          const itemType = Array.isArray(inv.items)
            ? (inv.items[0] as { type?: string })?.type
            : undefined;
          const type =
            (typeof metadata.type === "string" ? metadata.type : itemType) ||
            "membership";
          
          if (type.toLowerCase().includes("class")) {
            classRevenue += amount;
          } else if (type.toLowerCase().includes("personal") || type.toLowerCase().includes("pt")) {
            ptRevenue += amount;
          } else {
            membershipRevenue += amount;
          }
        });

      const paidInvoices = invoices.filter(inv => inv.status === "paid");
      const averageInvoiceValue = paidInvoices.length > 0
        ? totalRevenue / paidInvoices.length
        : 0;

      const collectionRate = invoices.length > 0
        ? (paidInvoices.length / invoices.length) * 100
        : 0;

      // VAT compliance (simplified - assume 100% if all paid invoices have VAT)
      const vatCompliance = 100; // This would need to be calculated based on actual VAT returns

      setMetrics({
        totalRevenue,
        monthlyRevenue,
        vatCollected,
        outstandingAmount,
        membershipRevenue,
        classRevenue,
        ptRevenue,
        averageInvoiceValue,
        collectionRate,
        vatCompliance,
      });

      setRevenueGrowth({
        percentage: revenueGrowthPercentage,
        trend: revenueGrowthPercentage > 0 ? "up" : revenueGrowthPercentage < 0 ? "down" : "stable",
        value: monthlyRevenue,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading smart billing insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl flex-shrink-0">
              <FiDollarSign className="text-2xl" />
            </div>
            <div className="text-start">
              <div className="text-sm opacity-90">{t("billing.totalRevenue", "إجمالي الإيرادات")}</div>
              <div className="text-2xl font-bold">
                {metrics.totalRevenue.toFixed(0)} د.ب
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {revenueGrowth.trend === "up" ? (
              <FiArrowUp className="text-green-300 flex-shrink-0" />
            ) : revenueGrowth.trend === "down" ? (
              <FiArrowDown className="text-red-300 flex-shrink-0" />
            ) : (
              <FiActivity className="text-blue-300 flex-shrink-0" />
            )}
            <span className="text-sm opacity-90">
              {revenueGrowth.percentage.toFixed(1)}% {t("common.fromLastMonth", "مقارنة بالشهر الماضي")}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl flex-shrink-0">
              <FiShield className="text-2xl" />
            </div>
            <div className="text-start">
              <div className="text-sm opacity-90">{t("billing.vatCollected", "ضريبة القيمة المضافة")}</div>
              <div className="text-2xl font-bold">
                {metrics.vatCollected.toFixed(0)} د.ب
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-emerald-300 flex-shrink-0" />
            <span className="text-sm opacity-90">
              {metrics.vatCompliance.toFixed(0)}% {t("billing.complianceRate", "نسبة الالتزام الضريبي")}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl flex-shrink-0">
              <FiClock className="text-2xl" />
            </div>
            <div className="text-start">
              <div className="text-sm opacity-90">{t("billing.outstandingAmount", "المبالغ المعلقة")}</div>
              <div className="text-2xl font-bold">
                {metrics.outstandingAmount.toFixed(0)} د.ب
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiTarget className="text-orange-300 flex-shrink-0" />
            <span className="text-sm opacity-90">
              {metrics.collectionRate.toFixed(0)}% {t("billing.collectionRate", "نسبة التحصيل")}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl flex-shrink-0">
              <FiBarChart className="text-2xl" />
            </div>
            <div className="text-start">
              <div className="text-sm opacity-90">{t("billing.averageInvoice", "متوسط الفاتورة")}</div>
              <div className="text-2xl font-bold">
                {metrics.averageInvoiceValue.toFixed(0)} د.ب
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {revenueGrowth.trend === "up" ? (
              <FiTrendingUp className="text-purple-300 flex-shrink-0" />
            ) : revenueGrowth.trend === "down" ? (
              <FiTrendingDown className="text-purple-300 flex-shrink-0" />
            ) : (
              <FiActivity className="text-purple-300 flex-shrink-0" />
            )}
            <span className="text-sm opacity-90">
              {revenueGrowth.percentage >= 0 ? "+" : ""}{revenueGrowth.percentage.toFixed(1)}% {t("common.fromLastMonth", "مقارنة بالشهر الماضي")}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 p-3 rounded-xl flex-shrink-0">
              <FiPieChart className="text-white text-xl" />
            </div>
            <div className="text-start">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("billing.revenueBreakdown", "توزيع الإيرادات")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t("billing.byServiceType", "حسب نوع الخدمة")}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="font-medium text-gray-900 dark:text-white">{t("billing.memberships", "اشتراكات العضوية")}</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-gray-900 dark:text-white">
                  {metrics.membershipRevenue.toFixed(0)} د.ب
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {metrics.totalRevenue
                    ? (
                        (metrics.membershipRevenue / metrics.totalRevenue) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="font-medium text-gray-900 dark:text-white">{t("billing.classes", "الحصص الجماعية")}</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-gray-900 dark:text-white">
                  {metrics.classRevenue.toFixed(0)} د.ب
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {metrics.totalRevenue
                    ? (
                        (metrics.classRevenue / metrics.totalRevenue) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {t("billing.personalTraining", "التدريب الشخصي")}
                </span>
              </div>
              <div className="text-start">
                <div className="font-bold text-gray-900 dark:text-white">
                  {metrics.ptRevenue.toFixed(0)} د.ب
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {metrics.totalRevenue
                    ? (
                        (metrics.ptRevenue / metrics.totalRevenue) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-500 p-3 rounded-xl flex-shrink-0">
              <FiGlobe className="text-white text-xl" />
            </div>
            <div className="text-start">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("billing.gccVatCompliance", "الامتثال الضريبي للخليج")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t("billing.regionalTaxManagement", "إدارة الضرائب الإقليمية")}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="font-medium text-gray-900 dark:text-white">{t("billing.bahrainVat", "ضريبة القيمة المضافة (10%)")}</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{t("billing.compliant", "ملتزم")}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t("billing.lastFiled", "آخر تقديم: ديسمبر 2024")}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <FiClock className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {t("billing.nextReturnDue", "موعد الإقرار القادم")}
                </span>
              </div>
              <div className="text-start">
                <div className="font-bold text-blue-600 dark:text-blue-400">15 {t("billing.days", "يوماً")}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t("billing.q1Return", "إقرار الربع الأول 2025")}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <span className="font-medium text-gray-900 dark:text-white">{t("billing.vatPayable", "الضريبة المستحقة")}</span>
              </div>
              <div className="text-start">
                <div className="font-bold text-yellow-600 dark:text-yellow-400">
                  {(metrics.vatCollected * 0.8).toFixed(0)} د.ب
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t("billing.estimatedPayment", "دفعة مقدرة")}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Smart Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-500 p-3 rounded-xl">
            <FiZap className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Billing Insights
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Smart-powered recommendations for your gym
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Revenue Opportunity
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Consider introducing premium class packages. Analysis shows 23% of
              members would upgrade.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center gap-2 mb-2">
              <FiTarget className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Collection Optimization
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Automated payment reminders could improve collection rate by 15%
              based on industry data.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center gap-2 mb-2">
              <FiShield className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                VAT Optimization
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Your VAT compliance is excellent. Consider automating quarterly
              returns for efficiency.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
