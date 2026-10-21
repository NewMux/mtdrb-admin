import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch, FiUsers } from "react-icons/fi";
import { EmptyState, SmartButton, SmartLoading } from "../../components/ui";
import AccessStateBadge from "../../components/superadmin/AccessStateBadge";
import { listTenants } from "../../api/platformAdmin";
import { useRemoteData } from "../../hooks/useRemoteData";
import type { PlatformTenantRow } from "../../types/platformAdmin";
import {
  TENANT_FILTERS,
  TENANT_PAGE_SIZE,
  TENANT_SORTS,
  describeSource,
  formatDate,
  formatRelativeDays,
  parseTenantListQuery,
  serializeTenantListQuery,
  tierLabel,
  type TenantListQuery,
} from "../../utils/platformAdmin";

function planAndSource(row: PlatformTenantRow): string {
  if (!row.subscription) return "—";
  return `${tierLabel(row.subscription.plan_tier)} · ${describeSource(row.subscription.payment_provider)}`;
}

function accessEnds(row: PlatformTenantRow): string {
  const end = row.subscription?.current_period_end;
  if (!row.subscription) return "—";
  if (!end) return row.access_state === "complimentary" ? "No expiry" : "—";
  return `${formatDate(end)} (${formatRelativeDays(end)})`;
}

export default function Tenants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => parseTenantListQuery(searchParams), [searchParams]);
  const [searchInput, setSearchInput] = useState(query.q);

  const update = useCallback(
    (patch: Partial<TenantListQuery>) => {
      setSearchParams(serializeTenantListQuery({ ...query, ...patch }), { replace: true });
    },
    [query, setSearchParams],
  );

  // Debounce typing into the URL; keep the box in step with back/forward.
  useEffect(() => {
    if (searchInput.trim() === query.q) return;
    const id = setTimeout(() => update({ q: searchInput.trim(), page: 1 }), 300);
    return () => clearTimeout(id);
  }, [searchInput, query.q, update]);
  useEffect(() => setSearchInput(query.q), [query.q]);

  const { data, error, loading, refresh } = useRemoteData(
    () =>
      listTenants({
        search: query.q,
        filter: query.filter,
        sort: query.sort,
        limit: TENANT_PAGE_SIZE,
        offset: (query.page - 1) * TENANT_PAGE_SIZE,
      }),
    [query.q, query.filter, query.sort, query.page],
  );

  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];
  const first = total === 0 ? 0 : (query.page - 1) * TENANT_PAGE_SIZE + 1;
  const last = Math.min(query.page * TENANT_PAGE_SIZE, total);

  return (
    <div className="space-y-5">
      <div className="text-start">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gyms</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Every gym on the platform and its access.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <label htmlFor="tenant-search" className="sr-only">
              Search gyms or admin emails
            </label>
            <input
              id="tenant-search"
              type="search"
              value={searchInput}
              maxLength={100}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by gym name or admin email"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 ps-9 pe-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <label htmlFor="tenant-sort" className="sr-only">
            Sort
          </label>
          <select
            id="tenant-sort"
            value={query.sort}
            onChange={(e) => update({ sort: e.target.value as TenantListQuery["sort"], page: 1 })}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          >
            {TENANT_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by access">
          {TENANT_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={query.filter === f.value}
              onClick={() => update({ filter: f.value, page: 1 })}
              className={`rounded-full border px-3 py-1 text-sm ${
                query.filter === f.value
                  ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300"
                  : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300" role="alert">
          {error}{" "}
          <button type="button" className="underline" onClick={refresh}>
            Try again
          </button>
        </div>
      )}

      {!data && loading ? (
        <SmartLoading message="Loading gyms…" />
      ) : rows.length === 0 && !error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <EmptyState
            icon={<FiUsers />}
            title="No gyms match"
            description={query.page > 1 ? "There is nothing on this page." : "Try a different search or filter."}
            action={
              <SmartButton variant="secondary" size="sm" onClick={() => update({ q: "", filter: "all", page: 1 })}>
                Clear filters
              </SmartButton>
            }
          />
        </div>
      ) : (
        <div className={`transition-opacity ${loading ? "opacity-60" : ""}`}>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Gym</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Access</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Plan · source</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Access ends</th>
                  <th scope="col" className="px-4 py-3 text-end font-medium">Members</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="max-w-[18rem] px-4 py-3 text-start">
                      <Link to={`/superadmin/tenants/${row.id}`} className="block truncate font-medium text-gray-900 hover:underline dark:text-gray-100">
                        {row.name}
                      </Link>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400" title={row.admin_email ?? ""}>
                        {row.admin_email ?? "no admin email"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><AccessStateBadge state={row.access_state} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{planAndSource(row)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{accessEnds(row)}</td>
                    <td className="px-4 py-3 text-end tabular-nums text-gray-700 dark:text-gray-300">{row.members}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 text-start shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/superadmin/tenants/${row.id}`} className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100">
                    {row.name}
                  </Link>
                  <AccessStateBadge state={row.access_state} />
                </div>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{row.admin_email ?? "no admin email"}</p>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  {row.subscription ? `${planAndSource(row)} · ${accessEnds(row)}` : "No subscription yet"}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {first}–{last} of {total}
            </span>
            <div className="flex gap-2">
              <SmartButton variant="secondary" size="sm" disabled={query.page <= 1} onClick={() => update({ page: query.page - 1 })}>
                Previous
              </SmartButton>
              <SmartButton variant="secondary" size="sm" disabled={last >= total} onClick={() => update({ page: query.page + 1 })}>
                Next
              </SmartButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
