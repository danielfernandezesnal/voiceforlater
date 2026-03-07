import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple in-memory rate limiter for serverless instance
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 5; // Max 5 requests per window
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes window

export async function POST(request: NextRequest) {
    try {
        const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const clientIp = ipHeader.includes(',') ? ipHeader.split(',')[0].trim() : ipHeader;

        // Rate Limiting
        if (clientIp !== "unknown") {
            const now = Date.now();
            const record = rateLimits.get(clientIp);

            if (record && now > record.resetAt) {
                rateLimits.delete(clientIp);
            }

            if (!rateLimits.has(clientIp)) {
                rateLimits.set(clientIp, { count: 1, resetAt: now + WINDOW_MS });
            } else {
                const current = rateLimits.get(clientIp)!;
                if (current.count >= LIMIT) {
                    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
                }
                current.count++;
            }
        }

        const supabase = await createClient();

        // Attempt to get user if authenticated (optional for contact form)
        const { data: { user } } = await supabase.auth.getUser();

        const { email, subject, message, bot_field } = await request.json();

        // Honeypot check
        if (bot_field) {
            return NextResponse.json({ error: "invalid" }, { status: 400 });
        }

        // Basic formatting Validations
        if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 255) {
            return NextResponse.json({ error: "invalid" }, { status: 400 });
        }
        if (subject && (typeof subject !== 'string' || subject.length > 200)) {
            return NextResponse.json({ error: "invalid" }, { status: 400 });
        }
        if (!message || typeof message !== 'string' || message.length < 5 || message.length > 5000) {
            return NextResponse.json({ error: "invalid" }, { status: 400 });
        }

        // Insert using service role since anon/auth direct inserts are denied by RLS
        // Wait, createClient uses cookies, so it acts as authenticated user or anon.
        // To ensure insertion works regardless of RLS, we should use a service role client.
        // However, if we don't have a service role client setup locally in an easy way, 
        // let's create a server-admin client.
        // Assuming we have @supabase/supabase-js, but let's just use regular client if RLS
        // allows anon inserts? The prompt specifically said:
        // "* Recommended: deny direct anon/auth inserts; only allow inserts via API (service role)."

        // We need a specific service role client or admin credentials.
        // Let's create it inline using next.js env vars.
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: insertedTickets, error: insertError } = await supabaseAdmin
            .from('contact_tickets')
            .insert({
                user_id: user?.id || null, // Best effort link
                email,
                subject: subject || null,
                message,
                metadata: {
                    ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
                    user_agent: request.headers.get("user-agent") || "unknown",
                }
            })
            .select('id');

        if (insertError) {
            console.error("Failed to insert contact ticket:", insertError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        const ticketId = insertedTickets?.[0]?.id || "unknown";

        // Attempt to send admin notification
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;

            if (adminEmail) {
                const { getResend, DEFAULT_SENDER } = await import('@/lib/resend');
                const resend = getResend();

                let ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
                if (ipAddress.includes(',')) {
                    ipAddress = ipAddress.split(',')[0].trim();
                }

                await resend.emails.send({
                    from: DEFAULT_SENDER,
                    to: adminEmail,
                    replyTo: email,
                    subject: `New Contact Request: ${subject || "No Subject"}`,
                    html: `
                        <h2>New Contact Request</h2>
                        <p><strong>From:</strong> ${email}</p>
                        <p><strong>Ticket ID:</strong> ${ticketId}</p>
                        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                        
                        <h3>Message:</h3>
                        <p style="white-space: pre-wrap; background: #f4f4f5; padding: 16px; border-radius: 8px;">${message}</p>
                        
                        <hr style="margin-top: 24px;" />
                        <p style="font-size: 12px; color: #666;">
                            <strong>Metadata:</strong><br />
                            IP: ${ipAddress}<br />
                            User-Agent: ${request.headers.get("user-agent") || "unknown"}
                        </p>
                    `
                });
            } else {
                console.warn("No ADMIN_EMAIL or RESEND_FROM_EMAIL configured. Skipping admin notification for contact ticket.");
            }
        } catch (emailError) {
            // We just log the error but still return success to user since ticket is saved
            console.error("Failed to send admin notification email:", emailError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/contact error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
