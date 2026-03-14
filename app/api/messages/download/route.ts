import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getMessageAvailability } from "@/lib/message-availability";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse("Token is required", { status: 400 });
        }

        const supabase = getAdminClient();

        // 1. Fetch the message through the token
        const { data: tokenData, error: tokenError } = await supabase
            .from("delivery_tokens")
            .select(`
                message_id,
                messages (
                    id,
                    type,
                    text_content,
                    audio_path,
                    created_at,
                    delivered_at,
                    updated_at
                )
            `)
            .eq("token", token)
            .single();

        if (tokenError || !tokenData) {
            return new NextResponse("Invalid or expired token", { status: 404 });
        }

        const message = tokenData.messages as any;
        const deliveredAt = message.delivered_at || message.updated_at || message.created_at;

        // 2. Check Availability
        const { status } = getMessageAvailability(deliveredAt);

        if (status === 'expired') {
            return new NextResponse("Message has expired", { status: 410 });
        }

        // 3. Handle Download based on type
        if (message.type === 'text') {
            const content = message.text_content || '';
            const filename = `message-${message.id}.txt`;
            
            return new NextResponse(content, {
                headers: {
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Type': 'text/plain; charset=utf-8',
                },
            });
        } else {
            // Audio or Video
            if (!message.audio_path) {
                return new NextResponse("Media path not found", { status: 404 });
            }

            const { data: mediaData, error: mediaError } = await supabase.storage
                .from('audio')
                .download(message.audio_path);

            if (mediaError || !mediaData) {
                console.error("Download error:", mediaError);
                return new NextResponse("Failed to download media", { status: 500 });
            }

            const ext = message.audio_path.split('.').pop() || 'webm';
            const filename = `message-${message.id}.${ext}`;
            const contentType = mediaData.type || (message.type === 'video' ? 'video/webm' : 'audio/webm');

            return new NextResponse(mediaData, {
                headers: {
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Type': contentType,
                },
            });
        }
    } catch (error) {
        console.error("Download route error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
