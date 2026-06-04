-- ============================================================
-- GUEST CHECKOUT SUPPORT
-- ------------------------------------------------------------
-- Allows orders to be placed without a logged-in account, and
-- lets a user later see all guest orders that were placed with
-- the same email once they sign in / register with that email.
--
-- Run this in the Supabase SQL editor (or via the CLI) once.
-- It is idempotent and safe to re-run.
-- ============================================================

-- user_id is already nullable (REFERENCES auth.users ON DELETE SET NULL),
-- so guest orders simply store NULL for user_id. New guest orders are
-- created server-side with the service-role key (see /api/orders/create),
-- which bypasses RLS, so the INSERT policy does NOT need to be loosened.

-- Replace the SELECT policy so an authenticated user can see:
--   1. orders linked to their account (user_id), AND
--   2. guest/legacy orders that carry their (verified) account email, AND
--   3. everything, if they are an admin.
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (
  auth.uid() = user_id
  OR lower(customer_email) = lower(auth.jwt() ->> 'email')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
-- Note: for anonymous requests auth.jwt() ->> 'email' is NULL, so the
-- email branch never matches — guest orders stay private to anon clients
-- and are only reachable via the service-role server routes.
