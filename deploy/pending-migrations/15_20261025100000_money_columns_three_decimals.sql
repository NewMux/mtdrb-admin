-- Money columns that silently dropped the third decimal.
--
-- BHD, KWD and OMR (and JOD, TND) have three decimals - a fils is 0.001. The POS
-- tables were widened in 20261022180000, but invoices, expenses, plan / class
-- prices, trainer rates and VAT returns were still numeric(10,2). A Bahraini
-- gym's invoice of 20.505 BHD was stored as 20.51, and its VAT and totals
-- drifted from the line items by a fraction of a dinar. Widening the scale loses
-- nothing (existing values are kept exactly) and CHECK constraints stay.
--
-- numeric(12,3) holds up to 999,999,999.999.

BEGIN;

ALTER TABLE public.invoices
  ALTER COLUMN amount TYPE numeric(12,3),
  ALTER COLUMN total TYPE numeric(12,3),
  ALTER COLUMN paid_amount TYPE numeric(12,3),
  ALTER COLUMN vat_total TYPE numeric(12,3);

ALTER TABLE public.expenses
  ALTER COLUMN amount TYPE numeric(12,3),
  ALTER COLUMN vat_amount TYPE numeric(12,3);

ALTER TABLE public.plans ALTER COLUMN price TYPE numeric(12,3);
ALTER TABLE public.classes ALTER COLUMN price TYPE numeric(12,3);
ALTER TABLE public.trainers ALTER COLUMN hourly_rate TYPE numeric(12,3);
ALTER TABLE public.subscriptions ALTER COLUMN amount TYPE numeric(12,3);

ALTER TABLE public.vat_returns
  ALTER COLUMN vat_collected TYPE numeric(12,3),
  ALTER COLUMN vat_paid TYPE numeric(12,3),
  ALTER COLUMN net_vat_payable TYPE numeric(12,3);

COMMIT;
