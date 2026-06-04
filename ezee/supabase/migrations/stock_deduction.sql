-- ============================================================
-- STOCK DEDUCTION ON PAYMENT VERIFICATION
-- ------------------------------------------------------------
-- Stock is reduced when an order's payment is verified, and
-- restored if the order is later cancelled. The stock_deducted
-- flag makes this idempotent (no double-deduct / double-restore).
--
-- Run this in the Supabase SQL editor once. Idempotent.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN NOT NULL DEFAULT false;
x 