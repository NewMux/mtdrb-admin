// PostgREST caps a single response at 1000 rows by default. A query with
// no `.range()`/`.limit()` silently truncates past that - a gym that
// crosses 1000 invoices stops seeing new ones counted in "all-time"
// totals, VAT returns, and analytics, with no error or indication
// anything is missing.
//
// This pages through a query in batches, following Supabase's documented
// `.range()` pattern, until a page comes back shorter than the page size
// (meaning there's nothing left).

export interface RangeQueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

export async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => PromiseLike<RangeQueryResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const results: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await queryPage(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    results.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return results;
}
