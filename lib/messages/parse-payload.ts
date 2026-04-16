/**
 * Payload parsing helpers for /api/messages route.
 * Extracts FormData parsing logic shared between POST and PUT handlers.
 */

export type MessageType = "text" | "audio" | "video";
export type DeliveryMode = "date" | "checkin";

export interface RecipientData {
    name: string;
    email: string;
}

export interface MessagePayload {
    type: MessageType;
    title: string | null;
    deliveryMode: DeliveryMode;
    textContent: string | null;
    existingAudioUrl: string | null;
    audioFile: File | null;
    videoFile: File | null;
    deliverAt: string | null;
    checkinIntervalDays: string | null;
    trustedContactIds: string[];
    recipientsData: RecipientData[];
}

/**
 * Parse recipients from FormData. Reads up to 10 indexed entries
 * in the format `recipients[i][name]` / `recipients[i][email]`.
 */
function parseRecipients(formData: FormData): RecipientData[] {
    const recipients: RecipientData[] = [];
    for (let i = 0; i < 10; i++) {
        const name = formData.get(`recipients[${i}][name]`) as string | null;
        const email = formData.get(`recipients[${i}][email]`) as string | null;
        if (name && email) recipients.push({ name, email });
    }
    return recipients;
}

/**
 * Parse the full message payload from FormData.
 * Used by both POST (create) and PUT (update) handlers.
 */
export function parseMessagePayload(formData: FormData): MessagePayload {
    return {
        type: formData.get("type") as MessageType,
        title: formData.get("title") as string | null,
        deliveryMode: formData.get("deliveryMode") as DeliveryMode,
        textContent: formData.get("textContent") as string | null,
        existingAudioUrl: formData.get("existingAudioUrl") as string | null,
        audioFile: formData.get("audio") as File | null,
        videoFile: formData.get("video") as File | null,
        deliverAt: formData.get("deliverAt") as string | null,
        checkinIntervalDays: formData.get("checkinIntervalDays") as string | null,
        trustedContactIds: formData.getAll("trustedContactIds") as string[],
        recipientsData: parseRecipients(formData),
    };
}
