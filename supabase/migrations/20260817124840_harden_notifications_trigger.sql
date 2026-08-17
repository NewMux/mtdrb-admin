-- Harden the notifications updated_at trigger against search_path changes.
ALTER FUNCTION public.update_notifications_updated_at()
  SET search_path = '';
