import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiArrowLeft, FiCopy } from "react-icons/fi";
import { SmartButton, SmartLoading } from "../../components/ui";
import AccessStateBadge from "../../components/superadmin/AccessStateBadge";
import AddNoteForm from "../../components/superadmin/AddNoteForm";
import AuditList from "../../components/superadmin/AuditList";
import ChangeRoleModal from "../../components/superadmin/ChangeRoleModal";
import ConfirmActionModal from "../../components/superadmin/ConfirmActionModal";
import GrantAccessModal from "../../components/superadmin/GrantAccessModal";
import RevokeAccessModal from "../../components/superadmin/RevokeAccessModal";
import {
  banUser,
  deleteGym,
  deleteUser,
  fetchTenantDetail,
  resetUserMfa,
  suspendGym,
  unbanUser,
  unsuspendGym,
} from "../../api/platformAdmin";
import type { PlatformStaffMember } from "../../types/platformAdmin";
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

type Dialog =
  | { kind: "grant" | "revoke" | "suspend" | "unsuspend" | "deleteGym" }
  | { kind: "ban" | "unban" | "mfa" | "role" | "deleteUser"; user: PlatformStaffMember };

const rowButtonClass =
  "rounded px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-900/30";
const rowDangerClass =
  "rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30";

export default function TenantDetail() {
  const { tenantId = "" } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { data, error, loading, refresh } = useRemoteData(() => fetchTenantDetail(tenantId), [tenantId]);
  const [dialog, setDialog] = useState<Dialog | null>(null);

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
  const hasAccess = state === "paid" || state === "complimentary" || state === "trialing" || state === "past_due";
  const target = { id: tenant.id, name: tenant.name, subscription, accessState: state };
  const suspension = data.suspension;
  const hasPlatformAdmin = data.staff.some((s) => s.is_platform_admin);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const closeDialog = () => setDialog(null);
  const done = () => {
    setDialog(null);
    refresh();
  };
  const user = dialog && "user" in dialog ? dialog.user : null;

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
            {suspension && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                Suspended
              </span>
            )}
            <AccessStateBadge state={state} />
            {!paddleManaged && (
              <SmartButton size="sm" onClick={() => setDialog({ kind: "grant" })}>
                {state === "complimentary" ? "Change access" : state === "awaiting_activation" ? "Activate" : "Grant access"}
              </SmartButton>
            )}
            {state === "complimentary" && (
              <SmartButton size="sm" variant="danger" onClick={() => setDialog({ kind: "revoke" })}>
                Revoke access
              </SmartButton>
            )}
            {suspension ? (
              <SmartButton size="sm" variant="secondary" onClick={() => setDialog({ kind: "unsuspend" })}>
                Unsuspend gym
              </SmartButton>
            ) : (
              !hasPlatformAdmin && (
                <SmartButton size="sm" variant="warning" onClick={() => setDialog({ kind: "suspend" })}>
                  Suspend gym
                </SmartButton>
              )
            )}
            {!hasPlatformAdmin && (
              <SmartButton size="sm" variant="danger" onClick={() => setDialog({ kind: "deleteGym" })}>
                Delete gym
              </SmartButton>
            )}
          </div>
        </div>
        {suspension && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200" role="status">
            Suspended since {formatDate(suspension.suspended_at)}: {suspension.reason}. Its staff can’t sign in; their data is kept.
          </p>
        )}
        {hasPlatformAdmin && (
          <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            This gym includes a platform admin, so it can’t be suspended or deleted here.
          </p>
        )}
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
                <th scope="col" className="py-2 pe-4 text-start font-medium">Status</th>
                <th scope="col" className="py-2 pe-4 text-start font-medium">Last sign-in</th>
                <th scope="col" className="py-2 text-start font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.staff.map((s) => (
                <tr key={s.user_id}>
                  <td className="max-w-[16rem] truncate py-2 pe-4 text-gray-900 dark:text-gray-100" title={s.email}>{s.email}</td>
                  <td className="py-2 pe-4 capitalize text-gray-700 dark:text-gray-300">{s.role}</td>
                  <td className="whitespace-nowrap py-2 pe-4 text-gray-700 dark:text-gray-300">
                    {s.is_platform_admin ? "Platform admin" : s.banned ? (suspension ? "Suspended" : "Banned") : "Active"}
                  </td>
                  <td className="whitespace-nowrap py-2 pe-4 text-gray-700 dark:text-gray-300">
                    {s.last_sign_in_at ? formatRelativeDays(s.last_sign_in_at) : "never"}
                  </td>
                  <td className="py-2">
                    {s.is_platform_admin ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Managed in SQL</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className={rowButtonClass} aria-label={`Change role for ${s.email}`} onClick={() => setDialog({ kind: "role", user: s })}>
                          Role
                        </button>
                        {!suspension && (
                          <button
                            type="button"
                            className={rowButtonClass}
                            aria-label={`${s.banned ? "Unban" : "Ban"} ${s.email}`}
                            onClick={() => setDialog({ kind: s.banned ? "unban" : "ban", user: s })}
                          >
                            {s.banned ? "Unban" : "Ban"}
                          </button>
                        )}
                        <button type="button" className={rowButtonClass} aria-label={`Reset MFA for ${s.email}`} onClick={() => setDialog({ kind: "mfa", user: s })}>
                          Reset MFA
                        </button>
                        <button type="button" className={rowDangerClass} aria-label={`Delete ${s.email}`} onClick={() => setDialog({ kind: "deleteUser", user: s })}>
                          Delete
                        </button>
                      </div>
                    )}
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

      <GrantAccessModal isOpen={dialog?.kind === "grant"} tenant={target} onClose={closeDialog} onDone={done} />
      <RevokeAccessModal isOpen={dialog?.kind === "revoke"} tenant={{ id: tenant.id, name: tenant.name }} onClose={closeDialog} onDone={done} />

      {dialog?.kind === "suspend" && (
        <ConfirmActionModal
          key="suspend"
          isOpen
          onClose={closeDialog}
          onDone={done}
          title="Suspend gym"
          subtitle={tenant.name}
          variant="warning"
          confirmLabel="Suspend gym"
          successMessage={`${tenant.name} suspended`}
          description={
            <p>
              Everyone who belongs only to this gym is signed out and blocked from signing in. Their data is kept, and
              you can unsuspend at any time. People who also belong to another gym are not affected. Someone already
              signed in can keep working until their current session expires, which is at most an hour.
            </p>
          }
          action={({ reason }) => suspendGym(tenant.id, reason)}
        />
      )}

      {dialog?.kind === "unsuspend" && (
        <ConfirmActionModal
          key="unsuspend"
          isOpen
          onClose={closeDialog}
          onDone={done}
          title="Unsuspend gym"
          subtitle={tenant.name}
          confirmLabel="Unsuspend gym"
          successMessage={`${tenant.name} is active again`}
          description={
            <p>
              This lets the people the suspension blocked sign in again. Anyone banned for another reason stays banned.
            </p>
          }
          action={({ reason }) => unsuspendGym(tenant.id, reason)}
        />
      )}

      {dialog?.kind === "deleteGym" && (
        <ConfirmActionModal
          key="deleteGym"
          isOpen
          onClose={closeDialog}
          onDone={() => navigate("/superadmin/tenants")}
          title="Delete gym"
          subtitle={tenant.name}
          variant="danger"
          confirmLabel="Delete gym permanently"
          successMessage={`${tenant.name} deleted`}
          confirmText={tenant.name}
          caseSensitive
          option={{
            label: "Also delete the accounts of people who belong only to this gym",
            hint: "Leave this off to keep their accounts; they simply won’t have a gym any more.",
          }}
          description={
            <div className="space-y-2">
              <p className="font-medium text-red-700 dark:text-red-300">This can’t be undone.</p>
              <p>
                It permanently deletes the gym with its {usage.members} member{usage.members === 1 ? "" : "s"},{" "}
                {usage.trainers} trainer{usage.trainers === 1 ? "" : "s"}, {usage.classes} class
                {usage.classes === 1 ? "" : "es"}, invoices, expenses and POS records. Files uploaded to storage are
                not removed.
              </p>
              {paddleManaged && (
                <p>This gym is billed through Paddle. Cancel its subscription there first, or the delete will be refused.</p>
              )}
            </div>
          }
          action={({ reason, option }) =>
            deleteGym({ tenantId: tenant.id, confirmName: tenant.name, reason, deleteUsers: option })
          }
        />
      )}

      {user && dialog?.kind === "ban" && (
        <ConfirmActionModal
          key={`ban-${user.user_id}`}
          isOpen
          onClose={closeDialog}
          onDone={done}
          title="Ban user"
          subtitle={user.email}
          variant="warning"
          confirmLabel="Ban user"
          successMessage={`${user.email} banned`}
          description={
            <p>
              They are signed out everywhere and can’t sign in again until you unban them. Their data is kept.
            </p>
          }
          action={({ reason }) => banUser(user.user_id, reason)}
        />
      )}

      {user && dialog?.kind === "unban" && (
        <ConfirmActionModal
          key={`unban-${user.user_id}`}
          isOpen
          onClose={closeDialog}
          onDone={done}
          title="Unban user"
          subtitle={user.email}
          confirmLabel="Unban user"
          successMessage={`${user.email} unbanned`}
          description={<p>They will be able to sign in again.</p>}
          action={({ reason }) => unbanUser(user.user_id, reason)}
        />
      )}

      {user && dialog?.kind === "mfa" && (
        <ConfirmActionModal
          key={`mfa-${user.user_id}`}
          isOpen
          onClose={closeDialog}
          onDone={done}
          title="Reset MFA"
          subtitle={user.email}
          variant="warning"
          confirmLabel="Reset MFA"
          successMessage={`MFA reset for ${user.email}`}
          description={
            <p>
              This removes their authenticator and signs them out everywhere. At their next sign-in they set up a new
              authenticator. Use it for a lost phone, after you’ve confirmed who is asking.
            </p>
          }
          action={({ reason }) => resetUserMfa(user.user_id, reason)}
        />
      )}

      {user && dialog?.kind === "role" && (
        <ChangeRoleModal
          key={`role-${user.user_id}`}
          isOpen
          onClose={closeDialog}
          onDone={done}
          tenant={{ id: tenant.id, name: tenant.name }}
          user={{ id: user.user_id, email: user.email, role: user.role }}
        />
      )}

      {user && dialog?.kind === "deleteUser" && (
        <ConfirmActionModal
          key={`delete-${user.user_id}`}
          isOpen
          onClose={closeDialog}
          onDone={done}
          title="Delete user"
          subtitle={user.email}
          variant="danger"
          confirmLabel="Delete user permanently"
          successMessage={`${user.email} deleted`}
          confirmText={user.email}
          description={
            <div className="space-y-2">
              <p className="font-medium text-red-700 dark:text-red-300">This can’t be undone.</p>
              <p>
                It deletes their account. Tasks, sales, returns and stock records they created are handed to this gym’s
                longest-standing other admin. If they are the gym’s only admin, promote someone else first, or delete
                the gym.
              </p>
            </div>
          }
          action={({ reason }) => deleteUser({ userId: user.user_id, confirmEmail: user.email, reason })}
        />
      )}
    </div>
  );
}
