import React from "react";
import { SmartButton } from "../ui";
import { fetchGymsByCountry } from "../../api/platformAdmin";
import { useRemoteData } from "../../hooks/useRemoteData";

/** "BH" -> "Bahrain". Falls back to the code if the runtime does not know it. */
function countryName(code: string | null): string {
  if (!code) return "Not set yet";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Where the platform's gyms are, from the country each gym chose in its setup.
 * Fetches on its own so a failure here never hides the rest of the overview.
 */
export default function GymsByCountryCard() {
  const { data, error, loading, refresh } = useRemoteData(fetchGymsByCountry, []);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white text-start">Gyms by country</h2>
        {data && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.countries} {data.countries === 1 ? "country" : "countries"} · {data.total}{" "}
            {data.total === 1 ? "gym" : "gyms"}
          </p>
        )}
      </div>

      {!data && loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}

      {!data && !loading && (
        <div className="text-start">
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {error ?? "Could not load gyms by country."}
          </p>
          <SmartButton className="mt-3" size="sm" onClick={refresh}>
            Try again
          </SmartButton>
        </div>
      )}

      {data &&
        (data.rows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-start">No gyms yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="py-2 pe-3 text-start font-medium">Country</th>
                  <th className="px-3 py-2 text-end font-medium">Gyms</th>
                  <th className="px-3 py-2 text-end font-medium">Paid</th>
                  <th className="px-3 py-2 text-end font-medium">Trial</th>
                  <th className="ps-3 py-2 text-end font-medium">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.rows.map((r) => (
                  <tr key={r.country ?? "unknown"} className="text-gray-900 dark:text-gray-100">
                    <td className="py-2 pe-3 text-start">
                      {countryName(r.country)}
                      {r.country && <span className="ms-2 text-xs text-gray-500 dark:text-gray-400">{r.country}</span>}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.gyms}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.paid}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.trialing}</td>
                    <td className="ps-3 py-2 text-end tabular-nums">{r.members}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
