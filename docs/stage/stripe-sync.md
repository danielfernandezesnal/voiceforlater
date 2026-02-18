# Stage Plan: Stripe Synchronization & Hardening

**Focus**: `stripe-sync`
**Status**: IN PROGRESS

## Implemented (as of 2026-02-18)
- **Source of Truth**: `user_subscriptions` is authoritative; `profiles` mirrors status for legacy support.
- **Shared Logic**: `lib/stripe/utils.ts` contains reusable `getResourceId` and `mapSubscriptionToPlan`.
- **Webhook Hardening**: `app/api/stripe/webhook/route.ts` is fully typed and uses normalized mapping.
- **Event Coverage**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- **Reconciliation Tool**: `scripts/stripe-reconcile.ts`
  - Command: `npm run script:stripe-reconcile`
  - Requires: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Unit Tests**: `lib/stripe/utils.test.ts` covers mapping logic.
  - Command: `npm test`

## Context
Production build was recently broken due to TypeScript errors in the Stripe webhook handler (`app/api/stripe/webhook/route.ts`).
The fix involved runtime type checking for `session.subscription`.
Currently, the system dual-writes to `user_subscriptions` (modern) and `profiles` (legacy).
There is a need to ensure the webhook handler is robust, fully typed, and that data synchronization between Stripe and Supabase is reliable.

## Goals
- Audit and harden `app/api/stripe/webhook/route.ts` against type errors.
- Ensure all relevant Stripe events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) are handled consistently.
- Verify `user_subscriptions` table populated correctly.
- Establish clarity on the "source of truth" for plan status (User Subscriptions vs Profiles).

## Non-Goals
- Changing pricing models or amounts.
- Removing `profiles` columns (legacy support must be maintained for now).
- UI changes for the plans page.

## Checklist
- [ ] Review `app/api/stripe/webhook/route.ts` for any remaining `any` types or loose casts.
- [ ] Verify logic for `customer.subscription.updated`: ensure it handles cancellations and renewals.
- [ ] Verify logic for `invoice.payment_failed`: ensure it downgrades or marks status appropriately.
- [ ] Confirm `user_subscriptions` RLS policies (if applicable for admin/service role usage).
- [ ] Add logging for critical webhook failures.
- [ ] (Optional) Create a script to reconcile Stripe status with Supabase for existing users.

## Risks & Mitigations
- **Risk**: Webhook failures could lock users out of paid features or give free access.
  - **Mitigation**: Robust error handling and logging in webhook.
- **Risk**: Data drift between `profiles` and `user_subscriptions`.
  - **Mitigation**: Keep dual-write logic strictly synchronous in the webhook for now.

## Verification Plan
- Manual test of upgrade flow (using Stripe Test Mode).
- Manual test of cancellation flow (Stripe Dashboard -> Cancel).
- Verify database state in Supabase Studio after events.
- `npm run build` must pass.
