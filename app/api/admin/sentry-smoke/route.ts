import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const configuredSecret = process.env.SENTRY_SMOKE_SECRET;
        if (!configuredSecret) {
            return NextResponse.json(
                { error: "Sentry smoke check unavailable" },
                { status: 503 }
            );
        }

        const callerSecret = request.headers.get("x-sentry-smoke-secret");
        if (!callerSecret || callerSecret !== configuredSecret) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const eventId = Sentry.captureException(
            new Error("Manual Sentry smoke test"),
            {
                tags: {
                    smoke_test: "true",
                    source: "admin-monitoring",
                },
            }
        );

        await Sentry.flush(2000);

        return NextResponse.json({ ok: true, eventId });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.startsWith("Unauthorized")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message.startsWith("Forbidden")) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
