/** Shown while a heavy tab (one with charts) is being fetched the first time it is opened. */
export default function TabFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600" />
    </div>
  );
}
