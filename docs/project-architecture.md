# Project Architecture: Carry My Words (formerly voiceforlater)

## 1. Project Overview
Carry My Words is a digital platform built to securely store voice messages and textual reflections for future delivery. Built with Next.js (App Router), Supabase, Stripe, and Resend, the project functions as an emotional reflection space. The application handles reliable scheduling and security for ensuring messages are only released under precise structural conditions.

## 2. System Architecture
The application runs on a modern serverless stack:
- **Frontend & API Routes:** Next.js (App Router)
- **Backend & Database:** Supabase (Auth, Postgres DB, Storage, RLS)
- **Payments:** Stripe
- **Transactional Emails:** Resend
- **Hosting / CI:** Vercel

## 3. Functional Modules
The application is logically split into several core modules located throughout the repository:

- **Landing:** Public-facing pages capturing product value and pricing. Located primarily in `app/[locale]/page.tsx` and `components/landing-*.tsx`.
- **Auth:** Authentication flows mediated by Supabase Auth. Located in `app/[locale]/auth/` and `components/auth/`.
- **Dashboard:** The main user interface for authenticated user interactions. Located in `app/[locale]/dashboard/` and `components/dashboard/`.
- **Message Wizard:** A multi-step flow for users to record and schedule messages. Located in `app/[locale]/messages/create/` and `components/wizard/`.
- **Trusted Contacts:** Management of designated contacts who can trigger or receive secure messages. Located in `app/[locale]/dashboard/contacts/` and `app/api/trusted-contacts/`.
- **Delivery System:** Automated routines and cron jobs evaluating release logic and dispatching emails. Located in `app/api/cron/` and `lib/release-logic.ts`.
- **Admin Dashboard:** Administrative panel with elevated privileges for managing users. Located in `app/[locale]/admin/` and `components/admin/`.
- **Stripe Integration:** Handling subscriptions, checkouts, and webhooks. Located in `app/api/stripe/` and `components/stripe/`.
- **Email System:** Integration with Resend for delivery, reminders, and verification. Located via `lib/resend.ts` and `lib/email-templates.ts`.

## 4. Message Delivery Model
Messages can be scheduled through three primary mechanisms:

- **Specific Date Delivery:** The message is configured to be released automatically on an exact date and time in the future.
- **Future Event Delivery:** The message is tied to an eventual milestone (e.g., graduation, birthday) to be determined later.
- **Dead-man-switch / Check-in Delivery:** A routine check-in system verifying the user's presence.

**Check-in Mechanism Overview:**
The system runs a daily cron job (`/api/cron/process-checkins`) that evaluates user check-in deadlines.
1. When a check-in is overdue, the user begins to receive reminder emails.
2. If the maximum automated attempts (e.g., 3 days) are exhausted without a response, the system identifies the user's Trusted Contacts.
3. The system dispatches secure, expiring tokens to the Trusted Contact emails, asking them to securely verify the user's absence.
4. Only upon verification by the Trusted Contact are the locked messages processed for final delivery to their designated recipients.

## 5. Internationalization (i18n)
The project supports global accessibility strictly structured via Next-intl patterns.
- **Supported Locales:** `es` (Spanish) and `en` (English).
- **Dictionary Location:** Translation files are stored solely in `messages/es.json` and `messages/en.json`.
- **Rule:** No hardcoded text. All user-facing strings must be referenced through translation keys.
- **How Translations are Loaded:** The application leverages Next-intl middleware and file-based routing (`app/[locale]`) to supply dictionaries contextually to both client components and server actions.

## 6. Deployment Architecture
- **Source Control:** GitHub Repository.
- **Hosting Platform:** Vercel automatically manages Deployments.
- **Workflow:** Submits to the `main` branch trigger immediate production deployments to Vercel. Feature work is executed via PRs.

## 7. Supabase Architecture
Supabase acts as the primary data and backend infrastructure:
- **Auth:** Manages user sessions, magic links, and OAuth directly integrating with the Next.js router.
- **Postgres:** Structured relational records mapping `profiles`, `messages`, `checkins`, `trusted_contacts`, and `events`.
- **Storage:** Secure blob storage handling scheduled voice attachments. Files are obscured until explicitly released.
- **Row Level Security (RLS):** Strict PostgreSQL policies ensure users can only ever query, insert, or modify their own data using their `auth.uid()`.
- **RPC Functions:** Database functions executing complex security workflows or admin operations at the database layer (e.g., verifying admin roles securely or fetching aggregated stats).

## 8. Stripe Model
Stripe manages project monetization through a tiered subscription model:
- **Free Plan:** Basic access for testing the platform with hard limits.
- **Pro Plan:** Unlocked premium features, expanded trusted contacts, and higher message limits.
- **Pricing:** 10 USD / year for the Pro plan subscription.

## 9. Security Foundations
Security architecture prioritizing user privacy and data locking:
- **Supabase RLS:** All tables operate with active Row Level Security.
- **Admin RPC Protections:** Elevated data operations utilize strict server-side or DB-side role checks.
- **Webhook Verification:** Incoming Stripe events are cryptographically verified using secrets to prevent spoofing.
- **Tokenized Delivery:** Trusted contacts receive cryptographic, expiring hashes when verifying check-ins, rendering links single-use and secure.
- **CI Smoke Tests:** Automated tests (`smoke:domain`, `smoke:stripe`) running in GitHub Actions to validate core routing and critical paths before any merge.

## 10. Product Philosophy
Carry My Words is specifically structured as:
- An emotional reflection space.
- Not a social network.
- Focused on meaningful, permanent messages.
- Focused on deep emotional engagement rather than sheer volume or frequency of engagement.

## 11. Operational Rules
For any developer or autonomous agent working within the repository:
- **Copy Lock:** Never modify the underlying meaning or text copy of the landing page.
- **i18n Rule:** Any new text must be simultaneously registered in both `es.json` and `en.json`.
- **PR Strategy:** Execute one PR per distinct change or feature.
- **Automation Preference:** "Antigravity" preferred over manual developer actions.
- **Security First:** Any structural change must consider RLS and data privacy implications as absolute priority.
