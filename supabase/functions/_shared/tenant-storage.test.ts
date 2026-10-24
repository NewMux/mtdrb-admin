import { describe, expect, it, vi } from "vitest";
import { removeTenantFiles, TENANT_STORAGE_FOLDERS, type StorageApi, type StorageEntry } from "./tenant-storage";

const T = "tenant-1";

/** A fake bucket tree: path -> entries directly under it. */
function fakeStorage(tree: Record<string, Record<string, StorageEntry[]>>, opts: { failList?: string; failRemove?: string } = {}) {
  const removed: Record<string, string[]> = {};
  const storage: StorageApi = {
    from: (bucket) => ({
      list: vi.fn(async (path: string, { limit, offset }: { limit: number; offset: number }) => {
        if (opts.failList === bucket) return { data: null, error: { message: "list denied" } };
        const entries = tree[bucket]?.[path] ?? [];
        return { data: entries.slice(offset, offset + limit), error: null };
      }),
      remove: vi.fn(async (paths: string[]) => {
        if (opts.failRemove === bucket) return { error: { message: "remove denied" } };
        (removed[bucket] ??= []).push(...paths);
        return { error: null };
      }),
    }),
  };
  return { storage, removed };
}

const file = (name: string): StorageEntry => ({ name, id: `id-${name}` });
const dir = (name: string): StorageEntry => ({ name, id: null });

describe("TENANT_STORAGE_FOLDERS", () => {
  it("covers every bucket the app uploads to", () => {
    expect(TENANT_STORAGE_FOLDERS.map((f) => f.bucket).sort()).toEqual(
      ["expense-receipts", "gym-logos", "invoice-files", "profile-pictures", "task-attachments", "trainer-documents"],
    );
  });
});

describe("removeTenantFiles", () => {
  it("removes files at any depth, only under the gym's own folder", async () => {
    const { storage, removed } = fakeStorage({
      "task-attachments": {
        [`attachments/${T}`]: [dir("task-9")],
        [`attachments/${T}/task-9`]: [file("a.pdf"), file("b.png")],
      },
      "invoice-files": { [`invoices/${T}`]: [file("inv.pdf")] },
    });
    const result = await removeTenantFiles(storage, T);
    expect(result).toEqual({ removed: 3, failures: [] });
    expect(removed["task-attachments"]).toEqual([`attachments/${T}/task-9/a.pdf`, `attachments/${T}/task-9/b.png`]);
    expect(removed["invoice-files"]).toEqual([`invoices/${T}/inv.pdf`]);
  });

  it("does nothing for a gym with no files", async () => {
    const { storage, removed } = fakeStorage({});
    expect(await removeTenantFiles(storage, T)).toEqual({ removed: 0, failures: [] });
    expect(removed).toEqual({});
  });

  it("pages through more than one page of files and removes in chunks", async () => {
    const many = Array.from({ length: 1500 }, (_, i) => file(`f${i}.png`));
    const { storage, removed } = fakeStorage({ "gym-logos": { [`logos/${T}`]: many } });
    const result = await removeTenantFiles(storage, T);
    expect(result.removed).toBe(1500);
    expect(removed["gym-logos"]).toHaveLength(1500);
  });

  it("keeps going when one bucket fails, and says which", async () => {
    const { storage, removed } = fakeStorage(
      { "invoice-files": { [`invoices/${T}`]: [file("x.pdf")] }, "gym-logos": { [`logos/${T}`]: [file("l.png")] } },
      { failRemove: "invoice-files" },
    );
    const result = await removeTenantFiles(storage, T);
    expect(result.failures).toEqual([{ bucket: "invoice-files", message: "remove denied" }]);
    expect(result.removed).toBe(1);
    expect(removed["gym-logos"]).toEqual([`logos/${T}/l.png`]);
  });

  it("reports a bucket that cannot be listed", async () => {
    const { storage } = fakeStorage({}, { failList: "expense-receipts" });
    const result = await removeTenantFiles(storage, T);
    expect(result.failures).toEqual([{ bucket: "expense-receipts", message: "list denied" }]);
  });
});
