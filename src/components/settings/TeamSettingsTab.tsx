import React from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import RolesPanel from "./RolesPanel";
import { useAuth } from "../../contexts/AuthContext";
import { useRemoteData } from "../../hooks/useRemoteData";
import {
  inviteStaff,
  listRoles,
  listStaff,
  removeStaff,
  setStaffRole,
  type StaffMember,
  type StaffRole,
} from "../../api/staff";

// Settings > Team & roles (gym admins only; the database refuses everyone else).
// A role is picked as "admin" | "employee" | "trainer" | "custom:<role id>".
const encodeRole = (m: Pick<StaffMember, "role" | "customRoleId">) => (m.customRoleId ? `custom:${m.customRoleId}` : m.role);

function decodeRole(value: string): { role: "admin" | "employee" | "trainer"; customRoleId: string | null } {
  if (value.startsWith("custom:")) return { role: "employee", customRoleId: value.slice("custom:".length) };
  if (value === "admin" || value === "trainer") return { role: value, customRoleId: null };
  return { role: "employee", customRoleId: null };
}

const memberLabel = (m: StaffMember) => m.name || m.email || m.userId;

export default function TeamSettingsTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, error, loading, refresh } = useRemoteData(
    async () => {
      const [staff, roles] = await Promise.all([listStaff(), listRoles()]);
      return { staff, roles };
    },
    [],
  );
  const staff: StaffMember[] = data?.staff ?? [];
  const roles: StaffRole[] = data?.roles ?? [];

  const [email, setEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("employee");
  const [inviting, setInviting] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  const roleOptions = (allowAdmin: boolean) => (
    <>
      <optgroup label={t("team.builtInGroup")}>
        {allowAdmin && <option value="admin">{t("team.builtIn.admin")}</option>}
        <option value="employee">{t("team.builtIn.employee")}</option>
        <option value="trainer">{t("team.builtIn.trainer")}</option>
      </optgroup>
      {roles.length > 0 && (
        <optgroup label={t("team.customGroup")}>
          {roles.map((r) => (
            <option key={r.id} value={`custom:${r.id}`}>
              {r.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );

  const changeRole = async (member: StaffMember, value: string) => {
    const { role, customRoleId } = decodeRole(value);
    try {
      await setStaffRole(member.userId, role, customRoleId);
      toast.success(t("team.roleChanged"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("team.roleChangeFailed"));
    }
    refresh();
  };

  const remove = async (member: StaffMember) => {
    if (!window.confirm(t("team.removeConfirm", { name: memberLabel(member) }))) return;
    try {
      await removeStaff(member.userId);
      toast.success(t("team.removed", { name: memberLabel(member) }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("team.removeFailed"));
    }
    refresh();
  };

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    const { role, customRoleId } = decodeRole(inviteRole);
    setInviting(true);
    setInviteError(null);
    try {
      const sent = await inviteStaff({ email: email.trim(), role: role === "trainer" ? "trainer" : "employee", customRoleId });
      toast.success(t("team.inviteSent", { email: sent.email }));
      setEmail("");
      refresh();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : t("team.inviteFailed"));
    } finally {
      setInviting(false);
    }
  };

  if (!data && loading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">…</p>;

  if (!data) {
    return (
      <div className="card rounded-3xl p-6 text-start dark:bg-gray-800">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error ?? t("team.loadFailed")}
        </p>
        <button type="button" className="mt-3 text-sm text-sky-600 hover:underline" onClick={refresh}>
          {t("team.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-8 rounded-3xl p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="text-start">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("team.title")}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("team.subtitle")}</p>
      </div>

      <section className="space-y-3 text-start">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t("team.teamHeading")}</h4>
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {staff.map((member) => {
            const isSelf = member.userId === user?.id;
            return (
              <li key={member.userId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900 dark:text-white">
                    {memberLabel(member)}
                    {isSelf && <span className="ms-2 text-xs text-gray-500">({t("team.you")})</span>}
                  </p>
                  {member.name && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{member.email}</p>}
                  {member.pendingInvite && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">{t("team.invitedPending")}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    aria-label={`${t("team.roleLabel")} — ${memberLabel(member)}`}
                    value={encodeRole(member)}
                    disabled={isSelf}
                    onChange={(e) => void changeRole(member, e.target.value)}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  >
                    {roleOptions(true)}
                  </select>
                  {!isSelf && (
                    <button
                      type="button"
                      aria-label={t("team.remove", { name: memberLabel(member) })}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                      onClick={() => void remove(member)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <form onSubmit={invite} className="space-y-3 text-start">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t("team.inviteHeading")}</h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("team.inviteHint")}</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label={t("team.email")}
            placeholder={t("team.email")}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <select
            aria-label={t("team.roleLabel")}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          >
            {roleOptions(false)}
          </select>
          <button
            type="submit"
            disabled={inviting || !email.trim()}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {inviting ? t("team.inviting") : t("team.invite")}
          </button>
        </div>
        {inviteError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {inviteError}
          </p>
        )}
      </form>

      <RolesPanel roles={roles} staff={staff} onChanged={refresh} />
    </div>
  );
}
