import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { type Plan, getPlanLimits, canCreateMessage, isCheckinIntervalAllowed } from "@/lib/plans";

export const runtime = "nodejs";

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

        // Get user profile for plan limits
        const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", user.id)
            .single();

        const plan = (profile?.plan as Plan) || "free";
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
                    error: "Message limit reached.",
                    upgradeRequired: true,
                    limit: limits.maxActiveMessages
                },
                { status: 403 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const type = formData.get("type") as "text" | "audio" | "video";
        const recipientName = formData.get("recipientName") as string;
        const recipientEmail = formData.get("recipientEmail") as string;
        const deliveryMode = formData.get("deliveryMode") as "date" | "checkin";
        const textContent = formData.get("textContent") as string | null;
        const audioFile = formData.get("audio") as File | null;
        const videoFile = formData.get("video") as File | null;
        const deliverAt = formData.get("deliverAt") as string | null;
        const checkinIntervalDays = formData.get("checkinIntervalDays") as string | null;
        const trustedContactIds = formData.getAll("trustedContactIds") as string[];

        // Validate required fields
        if (!type || !recipientName || !recipientEmail || !deliveryMode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate content based on type
        if (type === "text" && (!textContent || textContent.trim().length === 0)) {
            return NextResponse.json({ error: "Text content is required" }, { status: 400 });
        }
        if (type === "audio" && !audioFile) {
            return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
        }
        if (type === "video" && !videoFile) {
            return NextResponse.json({ error: "Video file is required" }, { status: 400 });
        }

        // Validate text length
        if (type === "text" && textContent && textContent.length > limits.maxTextChars) {
            return NextResponse.json(
                { error: `Text exceeds ${limits.maxTextChars} character limit` },
                { status: 400 }
            );
        }

        // Validate check-in interval for plan
        if (deliveryMode === "checkin" && checkinIntervalDays) {
            const interval = parseInt(checkinIntervalDays, 10);
            if (!isCheckinIntervalAllowed(plan, interval)) {
                return NextResponse.json(
                    {
                        error: `${interval}-day check-in is not available on your plan`,
                        upgradeRequired: true,
                        allowedIntervals: limits.allowedCheckinIntervals
                    },
                    { status: 403 }
                );
            }
        }

        let audioPath: string | null = null;
        let fileSizeBytes: number | null = null;

        // Upload audio file
        if (type === "audio" && audioFile) {
            const fileExt = audioFile.name.split(".").pop() || "webm";
            const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
            fileSizeBytes = audioFile.size;

            const { error: uploadError } = await supabase.storage
                .from("audio")
                .upload(fileName, audioFile, {
                    contentType: audioFile.type,
                });

            if (uploadError) {
                console.error("Audio upload error:", JSON.stringify(uploadError, null, 2));
                return NextResponse.json({
                    error: "Failed to upload audio",
                    details: uploadError.message,
                    code: uploadError.name
                }, { status: 500 });
            }

            audioPath = fileName;
        }

        // Upload video file
        if (type === "video" && videoFile) {
            const fileExt = videoFile.name.split(".").pop() || "webm";
            const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
            fileSizeBytes = videoFile.size;

            const { error: uploadError } = await supabase.storage
                .from("audio")
                .upload(fileName, videoFile, {
                    contentType: videoFile.type,
                });

            if (uploadError) {
                console.error("Video upload error:", JSON.stringify(uploadError, null, 2));
                return NextResponse.json({
                    error: "Failed to upload video",
                    details: uploadError.message,
                    code: uploadError.name
                }, { status: 500 });
            }

            audioPath = fileName;
        }

        // Create message
        const { data: message, error: messageError } = await supabase
            .from("messages")
            .insert({
                owner_id: user.id,
                type,
                status: "scheduled",
                text_content: textContent || null,
                audio_path: audioPath,
                file_size_bytes: fileSizeBytes,
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

        // Create recipient
        const { error: recipientError } = await supabase.from("recipients").insert({
            message_id: message.id,
            name: recipientName,
            email: recipientEmail,
        });

        if (recipientError) {
            console.error("Recipient error:", recipientError);
            // Rollback message
            await supabase.from("messages").delete().eq("id", message.id);
            return NextResponse.json({ error: "Failed to create recipient" }, { status: 500 });
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

            await supabase.from("checkins").upsert(
                {
                    user_id: user.id,
                    last_confirmed_at: new Date().toISOString(),
                    next_due_at: nextDue.toISOString(),
                    attempts: 0,
                    status: "active",
                },
                { onConflict: "user_id" }
            );
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

        const formData = await request.formData();
        const messageId = formData.get("id") as string;

        if (!messageId) {
            return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
        }

        // Verify ownership
        const { data: existingMessage, error: fetchError } = await supabase
            .from("messages")
            .select("owner_id, audio_path")
            .eq("id", messageId)
            .single();

        if (fetchError || !existingMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        if (existingMessage.owner_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Extract update data
        const type = formData.get("type") as "text" | "audio" | "video";
        const recipientName = formData.get("recipientName") as string;
        const recipientEmail = formData.get("recipientEmail") as string;
        const deliveryMode = formData.get("deliveryMode") as "date" | "checkin";
        const textContent = formData.get("textContent") as string | null;
        const audioFile = formData.get("audio") as File | null;
        const deliverAt = formData.get("deliverAt") as string | null;
        const checkinIntervalDays = formData.get("checkinIntervalDays") as string | null;
        const trustedContactIds = formData.getAll("trustedContactIds") as string[];

        // Validation (simplified vs POST, assuming valid input mostly)
        if (!type || !recipientName || !recipientEmail || !deliveryMode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = {
            type,
            text_content: type === 'text' ? textContent : null,
            status: 'scheduled' // Reset status if it was delivered? Or keep? Usually editing implies re-scheduling.
        };

        // Handle Audio/Video Update
        if ((type === 'audio' || type === 'video') && audioFile) {
            // Delete old audio if exists
            if (existingMessage.audio_path) {
                await supabase.storage.from("audio").remove([existingMessage.audio_path]);
            }

            // Upload new
            const fileExt = audioFile.name.split(".").pop() || "webm";
            const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("audio")
                .upload(fileName, audioFile, { contentType: audioFile.type });

            if (uploadError) throw new Error("Audio upload failed");
            updates.audio_path = fileName;
            updates.file_size_bytes = audioFile.size;
        } else if (type === 'text' && existingMessage.audio_path) {
            // Clean up audio if switching to text
            await supabase.storage.from("audio").remove([existingMessage.audio_path]);
            updates.audio_path = null;
            updates.file_size_bytes = null;
        }

        // Update Message
        const { error: messageError } = await supabase
            .from("messages")
            .update(updates)
            .eq("id", messageId);

        if (messageError) throw messageError;

        // Update Recipient
        // Assuming 1 recipient per message for now
        const { error: recipientError } = await supabase
            .from("recipients")
            .update({ name: recipientName, email: recipientEmail })
            .eq("message_id", messageId);

        if (recipientError) throw recipientError;

        // Update Delivery Rule
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
            await supabase.from('message_trusted_contacts').delete().eq('message_id', messageId);

            // Add new
            if (trustedContactIds.length > 0) {
                const tcRows = trustedContactIds.map(id => ({
                    message_id: messageId,
                    trusted_contact_id: id
                }));

                const { error: tcError } = await supabase
                    .from('message_trusted_contacts')
                    .insert(tcRows);

                if (tcError) throw tcError;
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

        // Delete message (cascade should handle recipients and delivery_rules, but explicit is safer if no cascade)
        // Assuming cascade is set up in DB, but let's delete explicitly to be sure or just delete message
        // If we delete message, and foreign keys restrict, it fails. If cascade, it works.
        // Let's try deleting dependent rows usually best practice if unsure of DB schema.
        await supabase.from("delivery_rules").delete().eq("message_id", id);
        await supabase.from("recipients").delete().eq("message_id", id);

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
