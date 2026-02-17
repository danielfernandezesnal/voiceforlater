
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { locale } = await request.json();
        if (!locale || !['en', 'es'].includes(locale)) {
            return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabase
            .from("profiles")
            .update({ locale })
            .eq("id", user.id);

        if (error) {
            console.error("Error updating profile locale:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Profile locale error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
