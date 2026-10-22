import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { EmptyState, SmartButton, SmartLoading } from "../../components/ui";
import AccessStateBadge from "../../components/superadmin/AccessStateBadge";
import AuditList from "../../components/superadmin/AuditList";
import GrantAccessModal, { type GrantTarget } from "../../components/superadmin/GrantAccessModal";
import { fetchOverview } from "../../api/platformAdmin";
import { useRemoteData } from "../../hooks/useRemoteData";
import type { AccessState, TenantFilter } from "../../types/platformAdmin";
import { formatDate, formatRelativeDays, tierLabel } from "../../utils/platformAdmin";

function StatTile({
  to,
  label,
  value,
  hint,
  emphasise = false,
}: {
  to: string;
  label: string;
  value: number;
  hint?: string;
  emphasise?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-xl border p-4 text-start transition-colors hover:border-sky-400 ${
        emphasise && value > 0
          ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </Link>
  );
}

const tenantsLink = (filter: TenantFilter) =>
  filter === "all" ? "/superadmin/tenants" : `/superadmin/tenants?filter=${filter}`;

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white text-start">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Overview() {
  const { data, error, loading, refresh } = useRemoteData(fetchOverview, []);
  const [activating, setActivating] = useState<GrantTarget | null>(null);

  if (!data && loading) return <SmartLoading message="Loading overview…" />;

  if (!data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-start dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error ?? "Could not load the overview."}
        </p>
        <SmartButton className="mt-3" size="sm" onClick={refresh}>
          Try again
        </SmartButton>
      </div>
    );
  }

  const by = data.by_state;
  const stateTile = (state: AccessState, label: string, hint?: string, emphasise = false) => (
    <StatTile to={tenantsLink(state)} label={label} value={by[state] ?? 0} hint={hint} emphasise={emphasise} />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-start">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">All gyms on the platform at a glance.</p>
        </div>
        <SmartButton variant="secondary" size="sm" icon={<FiRefreshCw className="h-4 w-4" />} loading={loading} onClick={refresh}>
          Refresh
        </SmartButton>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300" role="alert">
          Showing the last loaded data — refresh failed: {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatTile
          to={tenantsLink("all")}
          label="Gyms"
          value={data.totals.tenants}
          hint={`+${data.totals.new_7d} this week · +${data.totals.new_30d} this month`}
        />
        {stateTile("awaiting_activation", "Awaiting activation", "Signed up, no access yet", true)}
        {stateTile("paid", "Paid")}
        {stateTile(
          "complimentary",
          "Complimentary",
          data.no_expiry_comps > 0 ? `${data.no_expiry_comps} with no expiry` : undefined,
        )}
        {stateTile("trialing", "Trial")}
        {stateTile("past_due", "Payment failed", "Still has access (grace period)")}
        {stateTile("inactive", "No access", "Cancelled or lapsed")}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Awaiting activation"
          action={
            data.awaiting_activation.length > 0 ? (
              <Link to={tenantsLink("awaiting_activation")} className="text-sm text-sky-600 hover:underline dark:text-sky-400">
                View all
              </Link>
            ) : undefined
          }
        >
          {data.awaiting_activation.length === 0 ? (
            <EmptyState
              icon={<FiCheckCircle />}
              title="All caught up"
              description="Every gym that signed up has been activated."
            />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.awaiting_activation.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 text-start">
                    <Link
                      to={`/superadmin/tenants/${t.id}`}
                      className="block truncate text-sm font-medium text-gray-900 hover:underline dark:text-gray-100"
                    >
                      {t.name}
                    </Link>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400" title={t.admin_email ?? ""}>
                      {t.admin_email ?? "no admin email"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Signed up {formatRelativeDays(t.created_at)} · {t.members} member{t.members === 1 ? "" : "s"}
                      {t.admin_last_sign_in ? ` · last seen ${formatRelativeDays(t.admin_last_sign_in)}` : " · never signed in"}
                    </p>
                  </div>
                  <SmartButton
                    size="sm"
                    onClick={() =>
                      setActivating({ id: t.id, name: t.name, subscription: null, accessState: "awaiting_activation" })
                    }
                  >
                    Activate
                  </SmartButton>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Access ending within 14 days">
          {data.ending_soon.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-start">Nothing is about to end.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.ending_soon.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 text-start">
                    <Link
                      to={`/superadmin/tenants/${t.id}`}
                      className="block truncate text-sm font-medium text-gray-900 hover:underline dark:text-gray-100"
                    >
                      {t.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tierLabel(t.plan_tier)} · ends {formatDate(t.current_period_end)} ({formatRelativeDays(t.current_period_end)})
                    </p>
                  </div>
                  <AccessStateBadge state={t.access_state} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent changes">
        <AuditList entries={data.recent_changes} showTenant emptyText="No changes made from this console yet." />
      </Card>

      {activating && (
        <GrantAccessModal
          isOpen
          tenant={activating}
          onClose={() => setActivating(null)}
          onDone={() => {
            setActivating(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
