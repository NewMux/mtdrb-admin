import React from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { deleteRole, saveRole, type StaffMember, type StaffRole } from "../../api/staff";
import {
  ROLE_PRESETS,
  normalizePermissions,
  permissionsForTier,
  type StaffPermission,
  type StaffTier,
} from "../../config/staffPermissions";

interface Props {
  roles: StaffRole[];
  staff: StaffMember[];
  onChanged: () => void;
}

interface Draft {
  id: string | null;
  name: string;
  baseRole: StaffTier;
  permissions: StaffPermission[];
}

const emptyDraft: Draft = { id: null, name: "", baseRole: "employee", permissions: [] };

// Create, edit and delete a gym's custom roles. The database validates every
// save (names, levels, which permissions a level may hold); this only helps fill
// the form in.
export default function RolesPanel({ roles, staff, onChanged }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const peopleOn = (roleId: string) => staff.filter((s) => s.customRoleId === roleId).length;

  const edit = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const toggle = (permission: StaffPermission) => {
    if (!draft) return;
    const has = draft.permissions.includes(permission);
    let next = has ? draft.permissions.filter((p) => p !== permission) : [...draft.permissions, permission];
    // Taking away "view" also takes away "manage", which includes it.
    if (has && permission === "billing.view") next = next.filter((p) => p !== "billing.manage");
    edit({ permissions: normalizePermissions(next) });
  };

  const changeTier = (tier: StaffTier) => {
    if (!draft) return;
    const allowed = permissionsForTier(tier);
    edit({ baseRole: tier, permissions: draft.permissions.filter((p) => allowed.includes(p)) });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      await saveRole(draft);
      toast.success(t("team.saved"));
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("team.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role: StaffRole) => {
    if (!window.confirm(t("team.deleteConfirm", { name: role.name }))) return;
    try {
      await deleteRole(role.id);
      toast.success(t("team.deleted"));
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("team.deleteFailed"));
    }
  };

  return (
    <section className="space-y-4 text-start">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("team.rolesHeading")}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("team.rolesHint")}</p>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setDraft({ ...emptyDraft });
            }}
            className="shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            {t("team.newRole")}
          </button>
        )}
      </div>

      {roles.length === 0 && !draft && <p className="text-sm text-gray-500 dark:text-gray-400">{t("team.noRoles")}</p>}

      {roles.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {roles.map((role) => (
            <li key={role.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">{role.name}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {t(`team.levels.${role.baseRole}`)} · {t("team.people", { count: peopleOn(role.id) })}
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {role.permissions.length === 0
                    ? "—"
                    : role.permissions.map((p) => t(`team.permissions.${p}.name`)).join(" · ")}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  className="text-sky-600 hover:underline dark:text-sky-400"
                  onClick={() => {
                    setError(null);
                    setDraft({ id: role.id, name: role.name, baseRole: role.baseRole, permissions: role.permissions });
                  }}
                >
                  {t("team.editRole")}
                </button>
                <button
                  type="button"
                  className="text-red-600 hover:underline dark:text-red-400"
                  onClick={() => void remove(role)}
                >
                  {t("team.deleteRole")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
        >
          {draft.id === null && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">{t("team.startFrom")}</span>
              <button
                type="button"
                className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:border-sky-400 dark:border-gray-600 dark:text-gray-200"
                onClick={() => setDraft({ ...emptyDraft })}
              >
                {t("team.blank")}
              </button>
              {ROLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:border-sky-400 dark:border-gray-600 dark:text-gray-200"
                  onClick={() =>
                    setDraft({
                      id: null,
                      name: t(`team.presets.${preset.id}`),
                      baseRole: preset.tier,
                      permissions: normalizePermissions(preset.permissions),
                    })
                  }
                >
                  {t(`team.presets.${preset.id}`)}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              {t("team.roleName")}
              <input
                type="text"
                value={draft.name}
                maxLength={40}
                onChange={(e) => edit({ name: e.target.value })}
                placeholder={t("team.roleNamePlaceholder")}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              {t("team.level")}
              <select
                value={draft.baseRole}
                onChange={(e) => changeTier(e.target.value as StaffTier)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="employee">{t("team.levels.employee")}</option>
                <option value="trainer">{t("team.levels.trainer")}</option>
              </select>
              {draft.baseRole === "trainer" && (
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{t("team.levelHint")}</span>
              )}
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-white">{t("team.permissionsHeading")}</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {permissionsForTier(draft.baseRole).map((permission) => (
                <label
                  key={permission}
                  className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={draft.permissions.includes(permission)}
                    onChange={() => toggle(permission)}
                  />
                  <span>
                    <span className="block font-medium text-gray-900 dark:text-white">
                      {t(`team.permissions.${permission}.name`)}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {t(`team.permissions.${permission}.description`)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm text-gray-600 hover:underline dark:text-gray-300"
              onClick={() => setDraft(null)}
              disabled={saving}
            >
              {t("team.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || !draft.name.trim()}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {saving ? t("team.saving") : t("team.save")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
