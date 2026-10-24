import React from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { FiCopy, FiKey, FiPause, FiPlay, FiPlus, FiX } from "react-icons/fi";
import {
  addDevice,
  createDeviceKey,
  ingestExample,
  revokeDeviceKey,
  setDeviceStatus,
  type AttendanceDeviceRow,
  type DeviceDirection,
  type DeviceType,
} from "../../api/accessControl";

interface BranchOption {
  id: string;
  name: string;
}

interface Props {
  tenantId: string;
  devices: AttendanceDeviceRow[];
  branches: BranchOption[];
  isAdmin: boolean;
  onChanged: () => void;
}

const DEVICE_TYPES: DeviceType[] = ["terminal", "qr", "nfc", "gateway", "kiosk", "manual"];
const DIRECTIONS: DeviceDirection[] = ["check_in", "check_out", "auto"];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

// Check-in points: entry and exit readers, turnstile controllers, gateways. Each one
// gets its own secret key, which is shown ONCE when it is created.
export default function DevicesPanel({ tenantId, devices, branches, isAdmin, onChanged }: Props) {
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [deviceType, setDeviceType] = React.useState<DeviceType>("terminal");
  const [direction, setDirection] = React.useState<DeviceDirection>("check_in");
  const [branchId, setBranchId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [revealed, setRevealed] = React.useState<{ deviceName: string; key: string } | null>(null);

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://<project>.supabase.co";

  const run = async (action: () => Promise<void>, failure = t("accessControl.failed")) => {
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : failure);
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await addDevice({ tenantId, name, deviceType, direction, branchId: branchId || null });
      setName("");
    });
  };

  const handleKey = (device: AttendanceDeviceRow) =>
    void run(async () => {
      const key = await createDeviceKey(device.id);
      setRevealed({ deviceName: device.name, key });
    });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("accessControl.copied"));
    } catch {
      toast.error(t("accessControl.copyFailed"));
    }
  };

  return (
    <section className="rounded-xl bg-gray-50 p-6 dark:bg-gray-800" aria-labelledby="ac-devices">
      <div className="text-start">
        <h2 id="ac-devices" className="text-base font-semibold text-gray-900 dark:text-white">{t("accessControl.devicesTitle")}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("accessControl.devicesHint")}</p>
      </div>

      {revealed && (
        <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-start dark:border-amber-700 dark:bg-amber-900/20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {t("accessControl.keyFor", { name: revealed.deviceName })}
            </p>
            <button type="button" aria-label={t("accessControl.dismiss")} onClick={() => setRevealed(null)} className="text-amber-700 dark:text-amber-300">
              <FiX />
            </button>
          </div>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">{t("accessControl.keyOnce")}</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-white px-3 py-2 text-xs text-gray-900 dark:bg-gray-900 dark:text-gray-100">{revealed.key}</code>
            <button type="button" onClick={() => void copy(revealed.key)} className="btn btn-secondary" aria-label={t("accessControl.copy")}>
              <FiCopy />
            </button>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-amber-900 dark:text-amber-200">{t("accessControl.example")}</summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200" dir="ltr">{ingestExample(supabaseUrl, revealed.key)}</pre>
          </details>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        {devices.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("accessControl.noDevices")}</p>
        ) : (
          <table className="min-w-full text-start text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{t("accessControl.deviceName")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("accessControl.direction")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("accessControl.status")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("accessControl.lastSeen")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("accessControl.key")}</th>
                {isAdmin && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {devices.map((device) => (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                    {device.name}
                    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">{t(`accessControl.types.${device.device_type}`)}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{t(`accessControl.directions.${device.direction}`)}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{t(`accessControl.statuses.${device.status}`)}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                    {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : t("accessControl.never")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400" dir="ltr">
                    {device.key_hint ? `${device.key_hint}…` : t("accessControl.noKey")}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button type="button" disabled={busy || device.status === "revoked"} onClick={() => handleKey(device)} className="btn btn-secondary" title={device.key_hint ? t("accessControl.rotateKey") : t("accessControl.createKey")}>
                          <FiKey />
                        </button>
                        {device.key_hint && (
                          <button type="button" disabled={busy} onClick={() => void run(() => revokeDeviceKey(device.id))} className="btn btn-secondary" title={t("accessControl.revokeKey")}>
                            <FiX />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy || device.status === "revoked"}
                          onClick={() => void run(() => setDeviceStatus(device.id, device.status === "active" ? "paused" : "active"))}
                          className="btn btn-secondary"
                          title={device.status === "active" ? t("accessControl.pause") : t("accessControl.resume")}
                        >
                          {device.status === "active" ? <FiPause /> : <FiPlay />}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isAdmin && (
        <form onSubmit={handleAdd} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
          <input className={`${inputClass} md:col-span-2`} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("accessControl.deviceNamePlaceholder")} aria-label={t("accessControl.deviceName")} maxLength={80} required />
          <select className={inputClass} value={deviceType} onChange={(e) => setDeviceType(e.target.value as DeviceType)} aria-label={t("accessControl.deviceType")}>
            {DEVICE_TYPES.map((type) => <option key={type} value={type}>{t(`accessControl.types.${type}`)}</option>)}
          </select>
          <select className={inputClass} value={direction} onChange={(e) => setDirection(e.target.value as DeviceDirection)} aria-label={t("accessControl.direction")}>
            {DIRECTIONS.map((d) => <option key={d} value={d}>{t(`accessControl.directions.${d}`)}</option>)}
          </select>
          <select className={inputClass} value={branchId} onChange={(e) => setBranchId(e.target.value)} aria-label={t("accessControl.branch")}>
            <option value="">{t("accessControl.anyBranch")}</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button type="submit" disabled={busy || !name.trim()} className="btn btn-primary md:col-span-5 md:w-fit">
            <FiPlus /> {t("accessControl.addDevice")}
          </button>
        </form>
      )}
    </section>
  );
}
