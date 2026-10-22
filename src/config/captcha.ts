// Bot protection for the public auth forms (sign up, sign in, password reset,
// resend confirmation). Cloudflare Turnstile, which Supabase Auth can verify
// itself: turn on Authentication -> Attack Protection -> CAPTCHA in the Supabase
// dashboard with the Turnstile SECRET key, and set the matching SITE key here.
//
// Both halves must be on together. If Supabase enforces CAPTCHA and this key is
// unset, every auth request is refused ("captcha verification process failed");
// if the key is set and Supabase does not enforce it, the token is ignored.
export function getCaptchaSiteKey(env: Record<string, string | undefined>): string | null {
  const key = (env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
  return key || null;
}
