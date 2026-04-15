import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify recipient status
    const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select(`
            id,
            audio_path,
            photo_paths,
            recipients!inner (email)
        `)
        .eq("id", id)
        .eq("recipients.email", user.email)
        .single();
    
    if (fetchError || !message) {
        return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    const result: { audio: string | null, photos: string[] } = { audio: null, photos: [] };

    // Use admin client for signed URL generation so storage RLS (which only allows
    // file owners) does not block recipients from accessing the sender's files.
    // Recipient access is already validated above via the .eq("recipients.email") check.
    const adminSupabase = getAdminClient();

    if (message.audio_path) {
        const { data } = await adminSupabase.storage.from("audio").createSignedUrl(message.audio_path, 3600);
        result.audio = data?.signedUrl || null;
    }

    if (message.photo_paths && Array.isArray(message.photo_paths)) {
        for (const path of message.photo_paths) {
            const { data } = await adminSupabase.storage.from("audio").createSignedUrl(path, 3600);
            if (data?.signedUrl) result.photos.push(data.signedUrl);
        }
    }

    return NextResponse.json(result);
}
