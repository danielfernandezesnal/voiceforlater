import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, canCreateMessage } from "@/lib/plans";
import { getEffectivePlan } from "@/lib/plan-resolver";
import { trackServerEvent } from "@/lib/analytics/trackEvent";
import { REQUIRED_TOS_VERSION } from "@/lib/constants";
import { parseMessagePayload } from "@/lib/messages/parse-payload";
import {
    validateRequiredFields,
    validateDeliveryDate,
    validateContentForType,
    validateSelfRecipient,
    validateCheckinInterval,
} from "@/lib/messages/validate-payload";
import { uploadMediaFile, uploadPhotos, cleanupRemovedPhotos } from "@/lib/messages/upload-media";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch sent messages
        const { data: sentMessages, error: sentError } = await supabase
            .from("messages")
            .select(`
                *,
                recipients (*),
                delivery_rules (*),
                message_trusted_contacts (
                    trusted_contacts (id, name, email)
                )
            `)
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false });

        if (sentError) {
            console.error("Error fetching sent messages:", sentError);
            return NextResponse.json({ error: sentError.message }, { status: 500 });
        }

        // Fetch received messages
        const { data: receivedMessages, error: receivedError } = await supabase
            .from("messages")
            .select(`
                id,
                type,
                status,
                title,
                text_content,
                audio_path,
                photo_paths,
                created_at,
                owner_id,
                profiles (
                   first_name,
                   last_name
                ),
                delivery_tokens!left (
                    token
                ),
                recipients!inner (
                    email
                )
            `)
            .eq("status", "delivered")
            .eq("recipients.email", user.email)
            .order("created_at", { ascending: false });

        if (receivedError) {
            console.error("Error fetching received messages:", receivedError);
            // Don't fail the whole request if received messages fail, but log it
        }

        return NextResponse.json({
            sent: sentMessages || [],
            received: (receivedMessages || []).map((msg: any) => ({
                ...msg,
                sender_name: `${msg.profiles?.first_name || ''} ${msg.profiles?.last_name || ''}`.trim() || null,
                token: msg.delivery_tokens?.[0]?.token || null
            }))
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (e) {
        console.error("GET /api/messages error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user profile for validation
        const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, country, tos_version, tos_accepted_at")
            .eq("id", user.id)
            .single();

        // Validate ToS
        if (profile?.tos_version !== REQUIRED_TOS_VERSION || !profile?.tos_accepted_at) {
            return NextResponse.json(
                {
                    error: "Terms of Service acceptance is required.",
                    code: "TOS_REQUIRED"
                },
                { status: 403 }
            );
        }

        // Validate profile completeness
        const isProfileComplete =
            profile?.first_name?.trim() &&
            profile?.last_name?.trim() &&
            profile?.country?.trim();

        if (!isProfileComplete) {
            return NextResponse.json(
                {
                    error: "Complete your profile before creating messages.",
                    code: "PROFILE_INCOMPLETE"
                },
                { status: 403 }
            );
        }

        const plan = await getEffectivePlan(supabase, user.id);
        const limits = getPlanLimits(plan);

        // Check message limit
        const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .neq("status", "delivered"); // Only count active messages

        if (!canCreateMessage(plan, count || 0)) {
            return NextResponse.json(
                {
                    error: "PLAN_LIMIT",
                    reason: "MAX_MESSAGES",
                    details: `You have reached the limit of ${limits.maxActiveMessages} active message(s) for your plan.`
                },
                { status: 403 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const payload = parseMessagePayload(formData);
        const { type, title, deliveryMode, textContent, existingAudioUrl, audioFile, videoFile, deliverAt, checkinIntervalDays, trustedContactIds, recipientsData } = payload;

        if (recipientsData.length === 0) {
            return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
        }

        // --- Validations ---
        const selfCheck = validateSelfRecipient(recipientsData, user.email, deliveryMode);
        if (!selfCheck.valid) return selfCheck.response;

        const requiredCheck = validateRequiredFields(payload);
        if (!requiredCheck.valid) return requiredCheck.response;

        const dateCheck = validateDeliveryDate(deliverAt, deliveryMode);
        if (!dateCheck.valid) return dateCheck.response;

        const contentCheck = validateContentForType(payload, limits, plan);
        if (!contentCheck.valid) return contentCheck.response;

        const checkinCheck = validateCheckinInterval(plan, checkinIntervalDays, deliveryMode, limits);
        if (!checkinCheck.valid) return checkinCheck.response;

        // --- Media upload ---
        let audioPath: string | null = null;
        let fileSizeBytes: number | null = null;

        // If direct upload from client happened, use the path provided
        if (existingAudioUrl && !audioFile && !videoFile) {
            audioPath = existingAudioUrl;
        }

        // Upload audio file
        if (type === "audio" && audioFile) {
            const result = await uploadMediaFile(supabase, user.id, audioFile, "audio");
            if (!result.ok) {
                return NextResponse.json({
                    error: result.error,
                    details: result.details,
                    code: result.code
                }, { status: 500 });
            }
            audioPath = result.path;
            fileSizeBytes = result.sizeBytes;
        }

        // Upload video file
        if (type === "video" && videoFile) {
            const result = await uploadMediaFile(supabase, user.id, videoFile, "video");
            if (!result.ok) {
                return NextResponse.json({
                    error: result.error,
                    details: result.details,
                    code: result.code
                }, { status: 500 });
            }
            audioPath = result.path;
            fileSizeBytes = result.sizeBytes;
        }

        // Upload photos (text and audio messages only)
        let photoUrls: string[] = [];
        if (type === 'text' || type === 'audio') {
            photoUrls = await uploadPhotos(supabase, user.id, formData);
        }

        // Create message
        const { data: message, error: messageError } = await supabase
            .from("messages")
            .insert({
                owner_id: user.id,
                type,
                title: title!.trim(),
                status: "scheduled",
                text_content: textContent || null,
                audio_path: audioPath,
                file_size_bytes: fileSizeBytes,
                photo_paths: photoUrls.length > 0 ? photoUrls : null,
            })
            .select()
            .single();

        if (messageError) {
            console.error("Message insert error:", JSON.stringify(messageError, null, 2));
            // Extract constraint name if it's a constraint violation
            const errorDetails = messageError.message || messageError.code || "Unknown database error";
            const constraintMatch = messageError.message?.match(/constraint "([^"]+)"/);
            const constraint = constraintMatch ? constraintMatch[1] : null;

            return NextResponse.json({
                error: "Failed to create message",
                details: constraint ? `Database constraint: ${constraint}` : errorDetails,
                code: messageError.code
            }, { status: 500 });
        }

        // Create recipients (bulk insert)
        const recipientRows = recipientsData.map(r => ({ message_id: message.id, name: r.name, email: r.email }))
        const { error: recipientError } = await supabase.from("recipients").insert(recipientRows);

        if (recipientError) {
            console.error("Recipient error:", recipientError);
            // Rollback message
            await supabase.from("messages").delete().eq("id", message.id);
            return NextResponse.json({ error: "Failed to create recipients" }, { status: 500 });
        }

        // Create delivery rule
        const deliveryRuleData: {
            message_id: string;
            mode: "date" | "checkin";
            deliver_at?: string;
            checkin_interval_days?: number;
        } = {
            message_id: message.id,
            mode: deliveryMode,
        };

        if (deliveryMode === "date" && deliverAt) {
            deliveryRuleData.deliver_at = new Date(deliverAt).toISOString();
        } else if (deliveryMode === "checkin" && checkinIntervalDays) {
            deliveryRuleData.checkin_interval_days = parseInt(checkinIntervalDays, 10);

            // Initialize checkin record
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + parseInt(checkinIntervalDays, 10));

            const { error: checkinError } = await supabase.from("checkins").upsert(
                {
                    user_id: user.id,
                    last_confirmed_at: new Date().toISOString(),
                    next_due_at: nextDue.toISOString(),
                    attempts: 0,
                    status: "active",
                },
                { onConflict: "user_id" }
            );

            if (checkinError) {
                console.error("Checkin upsert error:", checkinError);
                await supabase.from("recipients").delete().eq("message_id", message.id);
                await supabase.from("messages").delete().eq("id", message.id);
                return NextResponse.json({ error: "Failed to initialize check-in record" }, { status: 500 });
            }
        }

        const { error: deliveryError } = await supabase
            .from("delivery_rules")
            .insert(deliveryRuleData);

        if (deliveryError) {
            console.error("Delivery rule error:", deliveryError);
            // Rollback
            await supabase.from("recipients").delete().eq("message_id", message.id);
            await supabase.from("messages").delete().eq("id", message.id);
            return NextResponse.json({ error: "Failed to create delivery rule" }, { status: 500 });
        }

        // Link Trusted Contacts
        if (trustedContactIds.length > 0) {
            const tcRows = trustedContactIds.map(id => ({
                message_id: message.id,
                trusted_contact_id: id
            }));

            const { error: tcError } = await supabase
                .from('message_trusted_contacts')
                .insert(tcRows);

            if (tcError) {
                console.error("Error linking trusted contacts:", tcError);
            }
        }

        // --- Product Analytics ---
        if ((count || 0) === 0) {
            await trackServerEvent({
                event: 'milestone.first_message',
                userId: user.id,
                metadata: { type }
            });
        }

        await trackServerEvent({
            event: 'message.created',
            userId: user.id,
            metadata: { type, deliveryMode }
        });

        return NextResponse.json({ success: true, messageId: message.id });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate ToS
        const { data: profile } = await supabase
            .from("profiles")
            .select("tos_version, tos_accepted_at")
            .eq("id", user.id)
            .single();

        if (profile?.tos_version !== REQUIRED_TOS_VERSION || !profile?.tos_accepted_at) {
            return NextResponse.json(
                {
                    error: "Terms of Service acceptance is required.",
                    code: "TOS_REQUIRED"
                },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const messageId = formData.get("id") as string;

        if (!messageId) {
            return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
        }

        // Verify ownership
        const { data: existingMessage, error: fetchError } = await supabase
            .from("messages")
            .select("owner_id, audio_path, photo_paths")
            .eq("id", messageId)
            .single();

        if (fetchError || !existingMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        if (existingMessage.owner_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const plan = await getEffectivePlan(supabase, user.id);
        const limits = getPlanLimits(plan);

        // Parse payload (now reads videoFile consistently with POST)
        const payload = parseMessagePayload(formData);
        const { type, title, deliveryMode, textContent, existingAudioUrl, audioFile, videoFile, deliverAt, checkinIntervalDays, trustedContactIds, recipientsData } = payload;

        // --- Validations ---
        const contentCheck = validateContentForType(payload, limits, plan);
        if (!contentCheck.valid) return contentCheck.response;

        const selfCheck = validateSelfRecipient(recipientsData, user.email, deliveryMode);
        if (!selfCheck.valid) return selfCheck.response;

        const requiredCheck = validateRequiredFields(payload);
        if (!requiredCheck.valid) return requiredCheck.response;

        // Align PUT with POST: validate delivery date and checkin interval.
        const dateCheck = validateDeliveryDate(deliverAt, deliveryMode);
        if (!dateCheck.valid) return dateCheck.response;

        const checkinCheck = validateCheckinInterval(plan, checkinIntervalDays, deliveryMode, limits);
        if (!checkinCheck.valid) return checkinCheck.response;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = {
            type,
            title: title!.trim(),
            text_content: type === 'text' ? textContent : null,
            status: 'scheduled' // Reset status if it was delivered? Or keep? Usually editing implies re-scheduling.
        };

        // If direct upload from client happened, use the path provided
        if (existingAudioUrl && !audioFile && !videoFile && (type === 'audio' || type === 'video')) {
            updates.audio_path = existingAudioUrl;
        }

        // Handle Audio/Video Update
        // FIX: Now reads videoFile from FormData (consistent with POST).
        // Previously PUT only read audioFile, requiring the client to send video under the "audio" field.
        const mediaFile = type === 'video' ? videoFile : type === 'audio' ? audioFile : null;

        if ((type === 'audio' || type === 'video') && mediaFile) {
            // Delete old audio if exists
            if (existingMessage.audio_path) {
                await supabase.storage.from("audio").remove([existingMessage.audio_path]);
            }

            // Upload new
            const result = await uploadMediaFile(supabase, user.id, mediaFile, type);
            if (!result.ok) throw new Error(result.error);
            updates.audio_path = result.path;
            updates.file_size_bytes = result.sizeBytes;
        } else if (type === 'text' && existingMessage.audio_path) {
            // Clean up audio if switching to text
            await supabase.storage.from("audio").remove([existingMessage.audio_path]);
            updates.audio_path = null;
            updates.file_size_bytes = null;
        }

        // Upload photos (text and audio messages only)
        const keepPhotoPaths = formData.getAll('keepPhotoPaths') as string[]
        const photoUrls: string[] = [...keepPhotoPaths]

        if (type === 'text' || type === 'audio') {
            const newPhotoPaths = await uploadPhotos(supabase, user.id, formData);
            photoUrls.push(...newPhotoPaths);

            // Delete photos that were removed (exist in DB but not in keepPhotoPaths)
            const existingPhotoPaths: string[] = Array.isArray(existingMessage.photo_paths)
                ? existingMessage.photo_paths
                : [];
            await cleanupRemovedPhotos(supabase, existingPhotoPaths, keepPhotoPaths);
        }
        updates.photo_paths = photoUrls.length > 0 ? photoUrls : null

        // Update Message
        const { error: messageError } = await supabase
            .from("messages")
            .update(updates)
            .eq("id", messageId);

        if (messageError) throw messageError;

        // Update Recipients — delete existing and reinsert new set
        await supabase.from("recipients").delete().eq("message_id", messageId);
        const recipientRows = recipientsData.map(r => ({ message_id: messageId, name: r.name, email: r.email }))
        const { error: recipientError } = await supabase.from("recipients").insert(recipientRows);
        if (recipientError) throw recipientError;

        // Update Delivery Rule
        // Defensive guard: deliveryMode must be a valid enum value. validateRequiredFields catches
        // null/undefined, but an explicit check here prevents the Supabase constraint from firing.
        if (deliveryMode !== 'date' && deliveryMode !== 'checkin') {
            return NextResponse.json({
                error: 'Invalid delivery mode',
                code: 'INVALID_DELIVERY_MODE'
            }, { status: 400 });
        }

        // Use upsert to handle both insert and update, avoiding unique constraint violations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deliveryRuleData: any = {
            message_id: messageId,
            mode: deliveryMode,
            deliver_at: null,
            // WORKAROUND: Schema constraint checkin_interval_days IN (30, 60, 90) rejects NULL ?
            // Setting to 30 (minimum valid value) ensures UPSERT succeeds.
            // Since mode='date', this value is ignored by application logic.
            checkin_interval_days: 30,
        };

        if (deliveryMode === "date" && deliverAt) {
            deliveryRuleData.deliver_at = new Date(deliverAt).toISOString();
            // checkin_interval_days already set to 30 above
        } else if (deliveryMode === "checkin" && checkinIntervalDays) {
            deliveryRuleData.checkin_interval_days = parseInt(checkinIntervalDays, 10);

            // Upsert checkin record for user
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + parseInt(checkinIntervalDays, 10));
            await supabase.from("checkins").upsert({
                user_id: user.id,
                last_confirmed_at: new Date().toISOString(),
                next_due_at: nextDue.toISOString(),
                status: "active",
            }, { onConflict: "user_id" });
        }

        const { error: deliveryError } = await supabase
            .from("delivery_rules")
            .upsert(deliveryRuleData, { onConflict: 'message_id' });

        if (deliveryError) throw deliveryError;

        // Update Trusted Contacts
        if (deliveryMode === 'checkin') {
            // Remove existing
            const { error: delError } = await supabase.from('message_trusted_contacts').delete().eq('message_id', messageId);
            if (delError) console.error('[DEBUG PUT] Delete TC error:', delError);

            // Add new
            if (trustedContactIds.length > 0) {
                const tcRows = trustedContactIds.map(id => ({
                    message_id: messageId,
                    trusted_contact_id: id
                }));

                const { error: tcError } = await supabase
                    .from('message_trusted_contacts')
                    .insert(tcRows);

                if (tcError) {
                    console.error('[DEBUG PUT] Insert TC error:', tcError);
                    throw tcError;
                }
            }
        }

        return NextResponse.json({ success: true, messageId });
    } catch (error) {
        console.error("Update API error:", error);
        return NextResponse.json({
            error: "Failed to update message",
            details: error instanceof Error ? error.message : JSON.stringify(error)
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
        }

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch message to verify ownership and get audio path
        const { data: message, error: fetchError } = await supabase
            .from("messages")
            .select("owner_id, audio_path")
            .eq("id", id)
            .single();

        if (fetchError || !message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        if (message.owner_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete from storage if audio exists
        if (message.audio_path) {
            await supabase.storage
                .from("audio")
                .remove([message.audio_path]);
        }

        // Delete photos from storage
        const { data: msgWithPhotos } = await supabase.from('messages').select('photo_paths').eq('id', id).single()
        if (msgWithPhotos?.photo_paths && Array.isArray(msgWithPhotos.photo_paths)) {
            await supabase.storage.from('audio').remove(msgWithPhotos.photo_paths)
        }

        // Delete message dependencies (cascade should handle them, but explicit is safer)
        await supabase.from("delivery_rules").delete().eq("message_id", id);
        await supabase.from("recipients").delete().eq("message_id", id);
        await supabase.from("message_trusted_contacts").delete().eq("message_id", id);

        const { error: deleteError } = await supabase
            .from("messages")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error("Delete error:", deleteError);
            return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
