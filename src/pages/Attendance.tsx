import React from "react";
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUsers,
  FiWifi,
  FiX,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useRTL } from "../hooks/useRTL";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/useToast";
import {
  buildMemberName,
  fetchAttendanceSnapshot,
  getAttendanceMetrics,
  recordAttendanceEvent,
  type AttendanceEventView,
  type AttendanceMethod,
  type AttendanceSnapshot,
} from "../api/attendance";

const methodOptions: Array<{
  value: AttendanceMethod;
  label: string;
  description: string;
}> = [
  { value: "qr", label: "QR code", description: "Member scans a gym QR code" },
  { value: "pin", label: "PIN / code", description: "Staff or member enters a code" },
  { value: "passkey", label: "Passkey", description: "Member confirms on their device" },
  { value: "staff", label: "Staff assisted", description: "Reception confirms identity" },
];

const statusLabel = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "trial") return "Trial";
  if (normalized === "suspended") return "Suspended";
  if (normalized === "expired") return "Expired";
  return status || "Unknown";
};

const formatEventTime = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const Attendance: React.FC = () => {
  usePageThemeContext();
  const { isRTL } = useRTL();
  const { t, i18n } = useTranslation();
  const { tenantId } = useAuth();
  const { showSuccess, showError } = useToast();
  const [snapshot, setSnapshot] = React.useState<AttendanceSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedMemberId, setSelectedMemberId] = React.useState("");
  const [selectedBranchId, setSelectedBranchId] = React.useState("");
  const [method, setMethod] = React.useState<AttendanceMethod>("qr");
  const [submittingDirection, setSubmittingDirection] = React.useState<"check_in" | "check_out" | null>(null);

  const loadSnapshot = React.useCallback(async (showSpinner = true) => {
    if (!tenantId) return;
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const nextSnapshot = await fetchAttendanceSnapshot(tenantId);
      setSnapshot(nextSnapshot);
      setSelectedBranchId((current) => current || nextSnapshot.branches[0]?.id || "");
    } catch (error) {
      showError(
        t("attendance.loadFailed", "Attendance could not be loaded"),
        error instanceof Error ? error.message : t("common.tryAgain", "Please try again."),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError, t, tenantId]);

  React.useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const activeMembers = React.useMemo(
    () =>
      (snapshot?.members ?? []).filter((member) => {
        const status = String(member.membership_status ?? member.status ?? "active").toLowerCase();
        return status === "active" || status === "trial";
      }),
    [snapshot?.members],
  );

  const visibleMembers = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return activeMembers.slice(0, 8);
    return activeMembers
      .filter((member) => {
        const haystack = [
          buildMemberName(member),
          member.email,
          member.phone,
          member.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [activeMembers, searchTerm]);

  const selectedMember = activeMembers.find((member) => member.id === selectedMemberId);
  const selectedMemberEvents = React.useMemo(
    () =>
      (snapshot?.events ?? [])
        .filter((event) => event.member_id === selectedMemberId)
        .slice(0, 8),
    [selectedMemberId, snapshot?.events],
  );
  const metrics = React.useMemo(
    () => getAttendanceMetrics(snapshot?.events ?? []),
    [snapshot?.events],
  );

  const selectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setSearchTerm("");
  };

  const submitAttendance = async (direction: "check_in" | "check_out") => {
    if (!tenantId || !selectedMember || !selectedBranchId) {
      showError(
        t("attendance.missingSelection", "Select a member and branch first"),
        t("attendance.missingSelectionDescription", "Choose an active member and a branch before recording attendance."),
      );
      return;
    }

    setSubmittingDirection(direction);
    try {
      const result = await recordAttendanceEvent({
        tenantId,
        memberId: selectedMember.id,
        branchId: selectedBranchId,
        method,
        direction,
        sourceType: "web",
        externalEventId: `kiosk-${tenantId}-${selectedMember.id}-${direction}-${Date.now()}`,
        metadata: { interface: "attendance-dashboard" },
      });

      showSuccess(
        result.duplicate
          ? t("attendance.alreadyRecorded", "Attendance already recorded")
          : direction === "check_in"
            ? t("attendance.checkInRecorded", "Check-in recorded")
            : t("attendance.checkOutRecorded", "Check-out recorded"),
        buildMemberName(selectedMember),
      );
      await loadSnapshot(false);
    } catch (error) {
      showError(
        t("attendance.recordFailed", "Attendance could not be recorded"),
        error instanceof Error ? error.message : t("common.tryAgain", "Please try again."),
      );
    } finally {
      setSubmittingDirection(null);
    }
  };

  const eventMethodLabel = (event: AttendanceEventView) =>
    methodOptions.find((option) => option.value === event.method)?.label || event.method;

  const connectorState = snapshot?.connectors.length
    ? `${snapshot.connectors.filter((connector) => connector.status === "active").length} active`
    : t("attendance.noConnectors", "No vendor connectors yet");

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500 dark:text-gray-400">
        <FiRefreshCw className="w-5 h-5 animate-spin me-2" />
        {t("attendance.loading", "Loading attendance...")}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            {t("attendance.eyebrow", "Operations")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {t("attendance.title", "Attendance")}
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
            {t(
              "attendance.subtitle",
              "Run a device-agnostic check-in desk today, then connect vendor terminals when your gym needs them.",
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSnapshot(false)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-sky-500 dark:hover:text-sky-300"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
          {t("attendance.refresh", "Refresh")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("attendance.eventsToday", "Events today"), value: metrics.eventsToday, icon: FiActivity, accent: "text-sky-600 bg-sky-50 dark:bg-sky-900/20" },
          { label: t("attendance.uniqueMembers", "Members checked in"), value: metrics.uniqueMembersToday, icon: FiUsers, accent: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
          { label: t("attendance.currentlyInGym", "Currently in gym"), value: metrics.currentlyInGym, icon: FiCheckCircle, accent: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
          { label: t("attendance.activeDevices", "Active check-in points"), value: snapshot?.devices.filter((device) => device.status === "active").length ?? 0, icon: FiWifi, accent: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
        ].map((card, index) => (
          <div key={`${card.label}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}>
                <card.icon className="h-5 w-5" />
              </span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("attendance.kioskTitle", "Check in a member")}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("attendance.kioskDescription", "Use this desk for QR, PIN, passkey, or staff-assisted attendance.")}
              </p>
            </div>
            <div className="rounded-xl bg-sky-50 p-3 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300">
              <FiShield className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t("attendance.branch", "Branch")}
              <div className="relative mt-2">
                <FiMapPin className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedBranchId}
                  onChange={(event) => setSelectedBranchId(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-10 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-sky-900/30"
                >
                  {(snapshot?.branches ?? []).map((branch, index) => (
                    <option key={`${branch.id}-${index}`} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t("attendance.method", "Check-in method")}
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value as AttendanceMethod)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-sky-900/30"
              >
                {methodOptions.map((option, index) => (
                  <option key={`${option.value}-${index}`} value={option.value}>{option.label} — {option.description}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t("attendance.findMember", "Find member")}
              <div className="relative mt-2">
                <FiSearch className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label={t("common.clear", "Clear")}
                  >
                    <FiX />
                  </button>
                )}
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSelectedMemberId("");
                  }}
                  placeholder={t("attendance.searchPlaceholder", "Search name, email, phone, or member ID")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-10 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-sky-900/30"
                />
              </div>
            </label>

            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-950/60">
              {visibleMembers.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t("attendance.noMembers", "No active members match your search.")}
                </p>
              ) : visibleMembers.map((member, index) => {
                const isSelected = member.id === selectedMemberId;
                return (
                  <button
                    type="button"
                    key={`${member.id}-${index}`}
                    onClick={() => selectMember(member.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-start transition ${isSelected ? "bg-sky-600 text-white shadow-sm" : "bg-white text-gray-800 hover:bg-sky-50 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{buildMemberName(member)}</span>
                      <span className={`block truncate text-xs ${isSelected ? "text-sky-100" : "text-gray-500 dark:text-gray-400"}`}>{member.email}</span>
                    </span>
                    <span className={`ms-3 shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${isSelected ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"}`}>
                      {statusLabel(String(member.membership_status ?? member.status ?? "active"))}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`rounded-2xl border p-4 ${selectedMember ? "border-sky-200 bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-900/10" : "border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"}`}>
              {selectedMember ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">{t("attendance.selectedMember", "Selected member")}</p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{buildMemberName(selectedMember)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMember.email || selectedMember.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void submitAttendance("check_in")}
                      disabled={Boolean(submittingDirection)}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingDirection === "check_in" ? t("common.saving", "Saving...") : t("attendance.checkIn", "Check in")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitAttendance("check_out")}
                      disabled={Boolean(submittingDirection)}
                      className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                      {submittingDirection === "check_out" ? t("common.saving", "Saving...") : t("attendance.checkOut", "Check out")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("attendance.selectMemberHint", "Select an active member above to record attendance.")}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("attendance.integrationTitle", "Integration readiness")}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("attendance.integrationDescription", "Start with universal methods. Add vendor connectors when your gym needs them.")}</p>
              </div>
              <FiWifi className="h-6 w-6 text-sky-500" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("attendance.devices", "Check-in points")}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{snapshot?.devices.length ?? 0}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("attendance.devicesDescription", "Kiosks and terminals")}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("attendance.connectors", "Connectors")}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{connectorState}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("attendance.connectorsDescription", "Vendor-ready foundation")}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("attendance.fallback", "Fallback")}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">QR + PIN</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("attendance.fallbackDescription", "Works without hardware")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("attendance.memberHistory", "Member history")}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selectedMember ? buildMemberName(selectedMember) : t("attendance.memberHistoryHint", "Select a member to view recent activity")}</p>
              </div>
              <FiClock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-5 space-y-3">
              {selectedMemberEvents.length === 0 ? (
                <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-800/70 dark:text-gray-400">{t("attendance.noMemberHistory", "No attendance history in this view.")}</p>
              ) : selectedMemberEvents.map((event, index) => (
                <div key={`${event.id}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.direction === "check_in" ? t("attendance.checkIn", "Check in") : t("attendance.checkOut", "Check out")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{event.branch_name} · {eventMethodLabel(event)}</p>
                  </div>
                  <time className="text-xs text-gray-500 dark:text-gray-400">{formatEventTime(event.occurred_at, i18n.language)}</time>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("attendance.recentActivity", "Recent attendance activity")}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("attendance.recentActivityDescription", "Every source is normalized into one tenant-scoped event stream.")}</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t("attendance.live", "Live")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/70">
              <tr>
                {[t("attendance.member", "Member"), t("attendance.branch", "Branch"), t("attendance.method", "Method"), t("attendance.direction", "Direction"), t("attendance.time", "Time")].map((heading, index) => (
                  <th key={`${heading}-${index}`} className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(snapshot?.events ?? []).slice(0, 12).map((event, index) => (
                <tr key={`${event.id}-${index}`} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{event.member_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{event.member_email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{event.branch_name}</td>
                  <td className="px-6 py-4"><span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">{eventMethodLabel(event)}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{event.direction === "check_in" ? t("attendance.checkIn", "Check in") : t("attendance.checkOut", "Check out")}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatEventTime(event.occurred_at, i18n.language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(snapshot?.events.length ?? 0) === 0 && <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">{t("attendance.noEvents", "No attendance events yet.")}</p>}
        </div>
      </section>
    </div>
  );
};

export default Attendance;
