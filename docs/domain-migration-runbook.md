# Domain Migration Runbook

## Checklist (Secure Order)

> **Nota Operativa:** `carrymywords.com` responde 200 en `/` pero 404 en `/es`,`/en` y webhook al día de hoy; tratar como estado externo y revalidar ownership/apuntado el Switch Day.

1. **(a) Add domain in Vercel (no primary)**
   - Go to Vercel Dashboard -> Project -> settings -> Domains.
   - Add `carrymywords.com`.
   - Do not set it as the primary domain yet.
2. **(b) DNS + SSL OK**
   - Ensure DNS records (A/CNAME) are correctly pointed to Vercel.
   - Wait for Vercel to provision the SSL certificate.
   - Verify that https://carrymywords.com loads without SSL warnings.
   - Run `npm run smoke:domain` to verify both domains respond.
3. **(c) update NEXT_PUBLIC_APP_URL**
   - In Vercel Environment Variables, update `NEXT_PUBLIC_APP_URL` to `https://carrymywords.com`.
   - Also update `RESEND_FROM_EMAIL` to the new authenticated domain if applicable.
4. **(d) Supabase Auth redirect URLs + Site URL**
   - In Supabase -> Authentication -> URL Configuration:
     - Change **Site URL** to `https://carrymywords.com`.
     - Add `https://carrymywords.com/**` to **Redirect URLs**.
5. **(e) Stripe webhook endpoint + copy signing secret**
   - In Stripe Dashboard -> Developers -> Webhooks:
     - Update the URL to `https://carrymywords.com/api/stripe/webhook` or create a new endpoint.
     - Copy the new **Signing secret**.
     - Update the `STRIPE_WEBHOOK_SECRET` environment variable in Vercel.
   - Run `npm run smoke:stripe` to verify the webhook endpoints exist and do not return 404.
6. **(f) set primary + 301**
   - Once all verifications pass, go to Vercel Domains and set `carrymywords.com` as the primary domain.
   - Ensure `voiceforlater.vercel.app` correctly redirects (301) to the new domain.
   - Run the smoke tests one last time.

## Smoke Tests

### Domain Verification
```sh
# Before activating new domain (allows NEW domain to fail safely)
npm run smoke:domain

# On Switch Day (strictly verifies NEW domain is active and responding)
STRICT_NEW=true npm run smoke:domain
```

### Stripe Webhook Verification
```sh
# Non-blocking for NEW domain until switch
npm run smoke:stripe

# Strict verification after webhook is added in Stripe
STRICT_NEW=true npm run smoke:stripe
```
