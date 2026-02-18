# Admin Dashboard Documentation

## 1. Overview
The Admin Dashboard provides a secure, localized interface for monitoring user activity, handling data exports, and tracking system KPIs. It uses a server-side rendered entry point with client-side interactivity, backed by rate-limited and cached API endpoints.

- **Stack**: Next.js App Router, Supabase (Service Role), Tailwind CSS.
- **Security**: Server-side role verification (`requireAdmin`), Rate Limiting (60/min), Node.js Runtime.
- **Data**: Real-time KPIs with 60s in-memory caching.
- **i18n**: Fully localized (EN/ES) via `messages/*.json`.

## 2. Architecture

### 2.1 Backend (API Routes)
All endpoints enforce `requireAdmin()` before execution.
- **Runtime**: `nodejs` (required for admin SDK and certain crypto operations).
- **Rate Limit**: 60 requests per minute per IP.
- **Audit Log**: All write/sensitive actions are logged to `public.admin_audit_log`.

| Endpoint | Method | Description | Params |
|---|---|---|---|
| `/api/admin/check` | GET | Verifies admin session. Returns 200 if OK. | None |
| `/api/admin/kpis` | GET | Returns aggregate stats. Cached (60s). | `from`, `to` (ISO dates) |
| `/api/admin/users` | GET | Returns tabulated user list with plan/usage data. | `from`, `to`, `search`, `page`, `limit` |
| `/api/admin/users/export` | GET | Streams CSV file of filtered users. **Streaming**. | `from`, `to`, `search` |

### 2.2 Frontend (UI)
- **Path**: `/admin` (protected by `middleware.ts` + `page.tsx` check).
- **Component**: `AdminDashboardClient`
- **Features**:
  - **Date Filter**: Presets (Today, Last 7/30 days, This/Last Month).
  - **Timezone**: All preset calculations happen in `America/Chicago`.
  - **Search**: Debounced searching by email.
  - **Sort**: Client-side sorting for `created_at`, `storage`, `emails_sent`.
  - **Drilldown**: Modal for user details.
  - **Export**: Trigger CSV download.

## 3. Data & Timezones

### 3.1 Date Handling
- **Timezone**: `America/Chicago` is the reference timezone for "Today" and "This Month".
- **Logic**: See `lib/admin/date-utils.ts`.
- **API**: API expects UTC ISO strings (`YYYY-MM-DDTHH:mm:ssZ`) but logic inside endpoints filters `created_at` (TIMESTAMPTZ) correctly.

### 3.2 KPI Definitions
| KPI | Source | Definition |
|---|---|---|
| **Total Users** | `auth.users` | Count of all registered users in date range. |
| **Paid Users** | `user_subscriptions` | Count where `status` IN ('active', 'trialing'). |
| **Storage Used** | `messages.file_size_bytes` | Sum of all bytes / 1024 / 1024 (MB). |
| **Emails Sent** | `email_events` | Count of events in range. |

### 3.3 User Table
- **Plan Status**: Format `PlanName (Status)`, e.g., "pro (active)" or "free (inactive)".
- **Storage**: MB used by that specific user.
- **Contacts**: Count of trusted contacts.

## 4. Internationalization (i18n)
All admin strings are in `messages/en.json` and `messages/es.json` under the `admin` namespace.

**Structure:**
```json
"admin": {
  "title": "...",
  "kpis": { ... },
  "filters": { ... },
  "users": { ... },
  "actions": { ... },
  "rateLimited": "..."
}
```

## 5. Security & Auditing

### 5.1 Access Control
- **`requireAdmin()`**: Checks `public.user_roles` for `admin` or `owner` role.
- **Service Role**: Used strictly within API routes; never exposed to client.
- **Imports**: `lib/supabase/admin.ts` includes `import 'server-only'` to prevent bundles from leaking keys.

### 5.2 Audit Log
- **Table**: `public.admin_audit_log`
- **Logged Actions**: `admin.check`, `admin.kpis`, `admin.users`, `admin.users.export`.
- **Meta**: Includes response status, error messages, and performance duration.
