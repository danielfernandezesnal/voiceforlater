import { NextRequest, NextResponse } from "next/server";

/**
 * API handler for CSP violation reports.
 * 
 * Browsers send a POST request with Content-Type: application/csp-report 
 * or application/json containing details about the violation.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Browsers usually wrap the report in a "csp-report" property
        const report = body["csp-report"] || body;

        // Log only safe fields to avoid PII ingestion into logs
        // Fields mapped from: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri#violation_report_syntax
        console.info("[csp:violation]", {
            violatedDirective: report["violated-directive"],
            effectiveDirective: report["effective-directive"],
            blockedURL: report["blocked-uri"],
            documentURL: report["document-uri"],
            disposition: report["disposition"]
        });

        // Browsers expect no response content
        return new NextResponse(null, { status: 204 });
    } catch (e) {
        // Silently fail to avoid making the reporting endpoint a vector for log flooding
        return new NextResponse(null, { status: 204 });
    }
}
