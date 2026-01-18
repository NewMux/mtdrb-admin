import React, { useState, useEffect } from "react";
import { FiDollarSign, FiPlus, FiDownload, FiFilter } from "react-icons/fi";
import { supabase } from "../../supabaseClient";

interface Payment {
  id: string;
  trainer_id: string;
  amount: number;
  type: string;
  description: string;
  payment_date: string;
  status: string;
  receipt_url: string | null;
}

interface Trainer {
  id: string;
  name: string;
  salary_type: string;
  hourly_rate: number | null;
  fixed_salary: number | null;
  commission_percentage: number | null;
}

interface PaymentSummary {
  total_paid: number;
  pending_amount: number;
  last_payment_date: string | null;
  payment_breakdown: {
    salary: number;
    bonus: number;
    commission: number;
    penalty: number;
  };
}

export default function TrainerPayments() {
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [dateRange, setDateRange] = useState<"1m" | "3m" | "6m" | "1y">("1m");
  const [paymentType, setPaymentType] = useState<string>("");
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_paid: 0,
    pending_amount: 0,
    last_payment_date: null,
    payment_breakdown: {
      salary: 0,
      bonus: 0,
      commission: 0,
      penalty: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    if (selectedTrainer) {
      fetchPayments();
    }
  }, [selectedTrainer, dateRange, paymentType]);

  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from("trainers")
        .select(
          "id, name, salary_type, hourly_rate, fixed_salary, commission_percentage",
        )
        .order("name");

      if (error) throw error;
      setTrainers(data || []);
      if (data?.[0]) {
        setSelectedTrainer(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case "1m":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3m":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6m":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "1y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      let query = supabase
        .from("trainer_payments")
        .select("*")
        .eq("trainer_id", selectedTrainer)
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString());

      if (paymentType) {
        query = query.eq("type", paymentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPayments(data || []);
      calculateSummary(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (payments: Payment[]) => {
    const summary: PaymentSummary = {
      total_paid: 0,
      pending_amount: 0,
      last_payment_date: null,
      payment_breakdown: {
        salary: 0,
        bonus: 0,
        commission: 0,
        penalty: 0,
      },
    };

    payments.forEach((payment) => {
      if (payment.status === "paid") {
        summary.total_paid += payment.amount;
        summary.payment_breakdown[
          payment.type as keyof typeof summary.payment_breakdown
        ] += payment.amount;
      } else if (payment.status === "pending") {
        summary.pending_amount += payment.amount;
      }

      if (
        !summary.last_payment_date ||
        new Date(payment.payment_date) > new Date(summary.last_payment_date)
      ) {
        summary.last_payment_date = payment.payment_date;
      }
    });

    setSummary(summary);
  };

  const handleExport = async () => {
    try {
      const { data: trainer } = await supabase
        .from("trainers")
        .select("name")
        .eq("id", selectedTrainer)
        .single();
      const trainerName = trainer?.name ?? "trainer";

      const headers = ["Date", "Type", "Amount", "Status", "Description"];
      const csvContent = [
        headers.join(","),
        ...payments.map((payment) =>
          [
            new Date(payment.payment_date).toLocaleDateString(),
            payment.type,
            payment.amount.toFixed(2),
            payment.status,
            `"${payment.description.replace(/"/g, '""')}"`,
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trainerName}_payments_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting payments:", error);
    }
  };

  const getSelectedTrainer = () => {
    return trainers.find((t) => t.id === selectedTrainer);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-2">
          <select
            value={selectedTrainer}
            onChange={(e) => setSelectedTrainer(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>

          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="salary">Salary</option>
            <option value="bonus">Bonus</option>
            <option value="commission">Commission</option>
            <option value="penalty">Penalty</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="h-4 w-4 mr-2" />
            Add Payment
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiDownload className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FiDollarSign className="h-8 w-8 text-green-500 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Paid
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                ${summary.total_paid.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last payment:{" "}
            {summary.last_payment_date
              ? new Date(summary.last_payment_date).toLocaleDateString()
              : "N/A"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FiDollarSign className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Amount
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                ${summary.pending_amount.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {payments.filter((p) => p.status === "pending").length} pending
            payments
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FiDollarSign className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Payment Type
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {getSelectedTrainer()?.salary_type || "N/A"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {getSelectedTrainer()?.salary_type === "hourly"
              ? `$${getSelectedTrainer()?.hourly_rate}/hour`
              : getSelectedTrainer()?.salary_type === "fixed"
                ? `$${getSelectedTrainer()?.fixed_salary}/month`
                : getSelectedTrainer()?.salary_type === "commission"
                  ? `${getSelectedTrainer()?.commission_percentage}% commission`
                  : "Hybrid model"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FiDollarSign className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Payment Breakdown
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {Object.keys(summary.payment_breakdown).length} types
              </p>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {Object.entries(summary.payment_breakdown).map(([type, amount]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 capitalize">
                  {type}
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  ${amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        payment.type === "salary"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                          : payment.type === "bonus"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                            : payment.type === "commission"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {payment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        payment.status === "paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : payment.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {payment.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {payment.receipt_url ? (
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        N/A
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal would go here */}
      {/* TODO: Implement AddPaymentModal component */}
    </div>
  );
}
