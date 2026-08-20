const required = [
  ["VITE_SUPABASE_URL", "the Supabase project URL"],
  ["VITE_SUPABASE_ANON_KEY", "the Supabase publishable/anon key"],
];

const missing = required.filter(([name]) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error("Production build cannot start because required public environment variables are missing:");
  for (const [name, description] of missing) {
    console.error(`- ${name}: ${description}`);
  }
  console.error("Configure these values in the deployment provider and run the build again.");
  process.exit(1);
}

try {
  const url = new URL(process.env.VITE_SUPABASE_URL);
  if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported protocol");
} catch {
  console.error("VITE_SUPABASE_URL must be a valid http(s) URL.");
  process.exit(1);
}

console.log("Production environment check passed.");
