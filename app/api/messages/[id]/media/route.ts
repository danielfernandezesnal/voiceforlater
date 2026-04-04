import { createClient } from "@/lib/supabase/server";
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

    if (message.audio_path) {
        const { data } = await supabase.storage.from("audio").createSignedUrl(message.audio_path, 3600);
        result.audio = data?.signedUrl || null;
    }

    if (message.photo_paths && Array.isArray(message.photo_paths)) {
        for (const path of message.photo_paths) {
            const { data } = await supabase.storage.from("audio").createSignedUrl(path, 3600);
            if (data?.signedUrl) result.photos.push(data.signedUrl);
        }
    }

    return NextResponse.json(result);
}
