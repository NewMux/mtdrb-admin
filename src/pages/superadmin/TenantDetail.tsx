import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiArrowLeft, FiCopy } from "react-icons/fi";
import { SmartButton, SmartLoading } from "../../components/ui";
import AccessStateBadge from "../../components/superadmin/AccessStateBadge";
import AddNoteForm from "../../components/superadmin/AddNoteForm";
import AuditList from "../../components/superadmin/AuditList";
import GrantAccessModal from "../../components/superadmin/GrantAccessModal";
import RevokeAccessModal from "../../components/superadmin/RevokeAccessModal";
import { fetchTenantDetail } from "../../api/platformAdmin";
import { useRemoteData } from "../../hooks/useRemoteData";
import {
  describeSource,
  formatDate,
  formatDateTime,
  formatRelativeDays,
  isPaddleManaged,
  isProTier,
  tierLabel,
} from "../../utils/platformAdmin";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white text-start">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="min-w-0 break-words text-end font-medium text-gray-900 dark:text-gray-100">{children}</dd>
    </div>
  );
}

export default function TenantDetail() {
  const { tenantId = "" } = useParams<{ tenantId: string }>();
  const { data, error, loading, refresh } = useRemoteData(() => fetchTenantDetail(tenantId), [tenantId]);
  const [modal, setModal] = useState<"grant" | "revoke" | null>(null);

  const stale = data && data.tenant.id !== tenantId;
  if ((!data || stale) && loading) return <SmartLoading message="Loading gym…" />;

  if (!data || stale) {
    return (
      <div className="space-y-3 text-start">
        <Link to="/superadmin/tenants" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
          ← Back to gyms
        </Link>
        <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">
          {error ?? "Gym not found."}
        </p>
      </div>
    );
  }

  const { tenant, subscription, access_state: state, usage } = data;
  const paddleManaged = isPaddleManaged(subscription, state);
  const hasAccess = state === "paid" || state === "complimentary" || state === "trialing";
  const target = { id: tenant.id, name: tenant.name, subscription, accessState: state };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const done = () => {
    setModal(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="text-start">
        <Link to="/superadmin/tenants" className="inline-flex items-center gap-1 text-sm text-sky-600 hover:underline dark:text-sky-400">
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" /> Gyms
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Signed up {formatDate(tenant.created_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AccessStateBadge state={state} />
            {!paddleManaged && (
              <SmartButton size="sm" onClick={() => setModal("grant")}>
                {state === "complimentary" ? "Change access" : state === "awaiting_activation" ? "Activate" : "Grant access"}
              </SmartButton>
            )}
            {state === "complimentary" && (
              <SmartButton size="sm" variant="danger" onClick={() => setModal("revoke")}>
                Revoke access
              </SmartButton>
            )}
          </div>
        </div>
        {paddleManaged && (
          <p className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-800 dark:bg-sky-900/20 dark:text-sky-200">
            This gym is billed through Paddle, so access can’t be changed here. Change or cancel the subscription in Paddle.
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300" role="alert">
            Refresh failed: {error}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Subscription">
          {subscription ? (
            <dl className="divide-y divide-gray-100 dark:divide-gray-700">
              <Row label="Stored status">{subscription.status}</Row>
              <Row label="Plan">{tierLabel(subscription.plan_tier)}</Row>
              <Row label="Pro features">{hasAccess && isProTier(subscription.plan_tier) ? "Yes" : "No"}</Row>
              <Row label="Source">{describeSource(subscription.payment_provider)}</Row>
              {subscription.payment_provider === "paddle" && subscription.amount != null && (
                <Row label="Billed">
                  {subscription.amount} {subscription.currency}
                </Row>
              )}
              <Row label="Access ends">
                {subscription.current_period_end
                  ? `${formatDate(subscription.current_period_end)} (${formatRelativeDays(subscription.current_period_end)})`
                  : state === "complimentary"
                    ? "No expiry"
                    : "—"}
              </Row>
              {subscription.trial_end && <Row label="Trial ends">{formatDate(subscription.trial_end)}</Row>}
              {subscription.payment_reference && (
                <Row label="Paddle subscription">
                  <span className="inline-flex items-center gap-2">
                    <code className="break-all text-xs">{subscription.payment_reference}</code>
                    <button
                      type="button"
                      onClick={() => void copy(subscription.payment_reference as string)}
                      aria-label="Copy Paddle subscription id"
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiCopy className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                </Row>
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-start">
              No subscription yet. This gym signed up but hasn’t been activated.
            </p>
          )}
        </Card>

        <Card title="Usage">
          <dl className="divide-y divide-gray-100 dark:divide-gray-700">
            <Row label="Members">
              {usage.members} ({usage.active_members} active)
            </Row>
            <Row label="Trainers">{usage.trainers}</Row>
            <Row label="Branches">{usage.branches}</Row>
            <Row label="Classes">{usage.classes}</Row>
            <Row label="Last activity">{usage.last_activity_at ? formatDateTime(usage.last_activity_at) : "None yet"}</Row>
          </dl>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-start">Counts only — member details are never shown here.</p>
        </Card>
      </div>

      <Card title="Staff">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <tr>
                <th scope="col" className="py-2 pe-4 text-start font-medium">Email</th>
                <th scope="col" className="py-2 pe-4 text-start font-medium">Role</th>
                <th scope="col" className="py-2 text-start font-medium">Last sign-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.staff.map((s) => (
                <tr key={`${s.email}-${s.joined_at}`}>
                  <td className="max-w-[16rem] truncate py-2 pe-4 text-gray-900 dark:text-gray-100" title={s.email}>{s.email}</td>
                  <td className="py-2 pe-4 capitalize text-gray-700 dark:text-gray-300">{s.role}</td>
                  <td className="whitespace-nowrap py-2 text-gray-700 dark:text-gray-300">
                    {s.last_sign_in_at ? formatRelativeDays(s.last_sign_in_at) : "never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Notes & activity">
        <AddNoteForm tenantId={tenant.id} onAdded={refresh} />
        <div className="mt-4">
          <AuditList entries={data.audit} emptyText="No changes or notes yet." />
        </div>
      </Card>

      <GrantAccessModal isOpen={modal === "grant"} tenant={target} onClose={() => setModal(null)} onDone={done} />
      <RevokeAccessModal isOpen={modal === "revoke"} tenant={{ id: tenant.id, name: tenant.name }} onClose={() => setModal(null)} onDone={done} />
    </div>
  );
}
