import { describe, it, expect, vi } from "vitest";
import { fetchAllRows } from "./fetchAllRows";

describe("fetchAllRows", () => {
  it("returns all rows from a single page under the page size", async () => {
    const queryPage = vi.fn().mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const rows = await fetchAllRows(queryPage, 1000);
    expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
    expect(queryPage).toHaveBeenCalledTimes(1);
  });

  it("pages through multiple full pages until a short page ends it (the 1000-row cap bug)", async () => {
    const page0 = Array.from({ length: 3 }, (_, i) => ({ id: i }));
    const page1 = Array.from({ length: 3 }, (_, i) => ({ id: i + 3 }));
    const page2 = [{ id: 6 }]; // short page - stops pagination

    const queryPage = vi
      .fn()
      .mockResolvedValueOnce({ data: page0, error: null })
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null });

    const rows = await fetchAllRows(queryPage, 3);
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.id)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(queryPage).toHaveBeenCalledTimes(3);
    // Verify the (from, to) ranges passed to each page.
    expect(queryPage).toHaveBeenNthCalledWith(1, 0, 2);
    expect(queryPage).toHaveBeenNthCalledWith(2, 3, 5);
    expect(queryPage).toHaveBeenNthCalledWith(3, 6, 8);
  });

  it("stops immediately on an empty first page", async () => {
    const queryPage = vi.fn().mockResolvedValue({ data: [], error: null });
    const rows = await fetchAllRows(queryPage, 1000);
    expect(rows).toEqual([]);
    expect(queryPage).toHaveBeenCalledTimes(1);
  });

  it("stops immediately when data is null", async () => {
    const queryPage = vi.fn().mockResolvedValue({ data: null, error: null });
    const rows = await fetchAllRows(queryPage, 1000);
    expect(rows).toEqual([]);
  });

  it("throws when a page returns an error, without silently returning partial data", async () => {
    const queryPage = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    await expect(fetchAllRows(queryPage, 1)).rejects.toEqual({ message: "boom" });
  });

  it("stops exactly at a page boundary when the last page is exactly full-sized but genuinely the last (one extra empty fetch)", async () => {
    const fullPage = Array.from({ length: 2 }, (_, i) => ({ id: i }));
    const queryPage = vi
      .fn()
      .mockResolvedValueOnce({ data: fullPage, error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const rows = await fetchAllRows(queryPage, 2);
    expect(rows).toHaveLength(2);
    expect(queryPage).toHaveBeenCalledTimes(2);
  });
});
