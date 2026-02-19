Stage Plan: Admin Dashboard
A) Context
The admin dashboard is a centralized interface for project owners to monitor the overall health, growth, and resource usage of VoiceForLater. It leverages existing Supabase and Stripe data to provide actionable insights into user behavior and system performance.

B) Goals
KPIs (Key Performance Indicators)
Total users registered: Cumulative count of all user profiles.
Total paid users: Count of users with an active 'pro' subscription status in Stripe/DB.
Total storage used (MB): Aggregated size of all audio and video blobs stored in Supabase Storage.
Emails sent: Count of successfully processed message records and system notifications.
Filters
Today: Real-time view of current day's activity.
This month: Performance and growth vs current month.
Custom date range: Flexible period selection for deep-dive analysis.
C) Non-goals
Direct "login as user" (impersonation) features.
In-app database management (CRUD on arbitrary tables).
Creating new billing plans or modifying Stripe products via this UI.
Performance profiling of individual API routes.
D) Checklist
 RBAC & Security: Ensure /admin routes are strictly restricted to the 'owner' role via middleware and server-side checks.
 Data Aggregation: Create SQL functions or views in Supabase to efficiently calculate daily/monthly KPIs.
 KPI Components: Build high-level metric cards for the dashboard landing page.
 Filter Logic: Implement a global date-range picker that refreshes all dashboard stats.
 Storage Monitoring: Integrate a calculation script or view to track bucket size for audio/video media.
 Admin Audit Logs: Ensure significant actions (if any) are logged in the admin_audit_logs table.
 Responsive UI: Ensure the dashboard is usable on both desktop and mobile for quick checks.
E) Risks & Mitigations
DB Performance: Aggregating thousands of rows for counts can be slow. Mitigation: Use materialized views or a cached stats table updated via daily cron.
Security Leak: Sensitive data exposed to non-admins. Mitigation: Strict RLS on admin-only tables and middleware redirection for unauthorized roles.
Data Consistency: Stripe and internal DB counts might drift. Mitigation: Implement a reconciliation check or rely primarily on the internal 'paid' flag synced via webhooks.
F) Verification Plan
Access Control: Attempt to access /admin with a standard 'user' account; verify 403 or redirect to home.
Data Accuracy: Manual spot-check of KPIs vs raw SQL queries for a specific date range.
Filter Reactivity: Change filter from "Today" to "This month" and verify totals update correctly without a full page reload.
Build Integrity: Ensure npm run build passes with the new admin routes and components.
