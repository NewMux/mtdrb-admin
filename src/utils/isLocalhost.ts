/**
 * Returns true when the app is running on localhost or local network (frontend-only dev mode).
 */
export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    // Private IPv4 addresses (10.x.x.x, 172.16.x.x to 172.31.x.x, 192.168.x.x)
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname) ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    // local domain resolution formats
    /\.local$/.test(hostname)
  );
}

/**
 * Returns true when the app should connect to the Supabase backend.
 */
export function isBackendEnabled(): boolean {
  return !isLocalhost();
}
