-- ============================================================
-- STRIPE PAYMENTS + CASH ON DELIVERY
-- ------------------------------------------------------------
-- payment_method:   'card' (paid via Stripe) or 'cod' (cash on delivery)
-- payment_intent_id: Stripe PaymentIntent id for card orders (audit trail)
-- payment_verified (existing column) is set true for successful card payments.
--
-- Run this in the Supabase SQL editor once. Idempotent.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
