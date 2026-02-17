
# Separation of Concerns: Tokens vs Audits

With `014_remove_token_decision.sql`, the system now correctly separates:

**1. Token Lifecycle (`verification_tokens` table):**
- Tracks **when** and **how** a token ceased to be valid.
- `used_at`: Timestamp of usage.
- `used_reason`: 'user_action' (human clicked link) vs 'expired_auto' (cron job clean-up).
- DOES NOT contain semantic outcome (decision, success/fail).

**2. Audit Log (`confirmation_events` table):**
- Tracks **what happened** functionally.
- `type`: 'decision_confirm', 'decision_deny', 'token_expired', 'messages_released_auto'.
- `decision`: Can still be used for quick query filters or removed if fully redundant, but kept for now as NULL for system events.

This prevents ambiguity where `verification_tokens` might disagree with `confirmation_events`.
