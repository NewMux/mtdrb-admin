import React from "react";
import { FiEdit3, FiKey, FiSlash } from "react-icons/fi";
import type { PlatformAuditEntry } from "../../types/platformAdmin";
import { describeAuditEntry, formatDateTime } from "../../utils/platformAdmin";

const ICON = {
  grant_access: FiKey,
  revoke_access: FiSlash,
  note: FiEdit3,
} as const;

interface AuditListProps {
  entries: PlatformAuditEntry[];
  /** Show the gym name on each row (omit on a single gym's page). */
  showTenant?: boolean;
  emptyText?: string;
}

export default function AuditList({
  entries,
  showTenant = false,
  emptyText = "Nothing recorded yet.",
}: AuditListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {entries.map((entry) => {
        const { title, detail } = describeAuditEntry(entry);
        const Icon = ICON[entry.action] ?? FiEdit3;
        return (
          <li key={entry.id} className="py-3 flex gap-3 text-start">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {title}
                {showTenant && entry.tenant_name ? (
                  <span className="font-normal text-gray-500 dark:text-gray-400"> · {entry.tenant_name}</span>
                ) : null}
              </p>
              {detail && (
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300 break-words whitespace-pre-wrap">
                  {detail}
                </p>
              )}
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {entry.actor_email ?? "unknown"} · {formatDateTime(entry.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
