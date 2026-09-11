-- Adds a small, generic rate-limit primitive and applies it to the two
-- endpoints flagged in the codebase audit as having none: paddle-webhook
-- (a public, unauthenticated Edge Function) and get_lockout_threshold
-- (an anon-callable RPC that doubles as an email-existence oracle).
--
-- rate_limits has no RLS policies (RLS enabled, zero policies = deny-all
-- to anon/authenticated) -- it's only ever touched via the SECURITY
-- DEFINER check_rate_limit() function or the service-role key, never
-- queried directly by a client.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.rate_limits enable row level security;

-- Atomic sliding-window-ish counter: one UPSERT per call, no separate
-- read-then-write race window. Returns true while under the limit.
create or replace function public.check_rate_limit(p_key text, p_max_count integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case
      when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limits.count + 1
    end,
    window_start = case
      when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limits.window_start
    end
  returning count into v_count;

  return v_count <= p_max_count;
end;
$$;

-- get_lockout_threshold is anon-callable by necessity (used pre-login),
-- which makes it an email-enumeration oracle -- cap probes per email and
-- fall back to the same default a nonexistent email would return, so a
-- rate-limited response looks identical to "no such account" rather than
-- leaking that the cap was hit.
create or replace function public.get_lockout_threshold(p_email text)
returns integer
language plpgsql
stable
security definer
set search_path to 'public', 'auth'
as $$
declare
  v_allowed boolean;
begin
  v_allowed := public.check_rate_limit('lockout_threshold:' || lower(p_email), 20, 600);
  if not v_allowed then
    return 5;
  end if;

  return coalesce(
    (
      select (gs.metadata -> 'security' ->> 'lockout_threshold')::integer
      from auth.users u
      join public.memberships m on m.user_id = u.id
      join public.gym_settings gs on gs.tenant_id = m.tenant_id
      where lower(u.email) = lower(p_email)
      order by m.created_at asc
      limit 1
    ),
    5
  );
end;
$$;
