/**
 * Media upload helpers for /api/messages route.
 * Handles audio, video, and photo uploads to Supabase Storage.
 */

import { v4 as uuidv4 } from "uuid";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadMediaResult =
    | { ok: true; path: string; sizeBytes: number }
    | { ok: false; error: string; details: string; code: string };

/**
 * Upload a single media file (audio or video) to Supabase Storage.
 * Returns a discriminated result: { ok: true, path, sizeBytes } on success,
 * or { ok: false, error, details, code } on failure — so the caller can
 * build a specific HTTP response instead of falling into a generic catch.
 */
export async function uploadMediaFile(
    supabase: SupabaseClient,
    userId: string,
    file: File,
    mediaLabel: "audio" | "video"
): Promise<UploadMediaResult> {
    const fileExt = file.name.split(".").pop() || "webm";
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(fileName, file, { contentType: file.type });

    if (uploadError) {
        console.error(`${mediaLabel} upload error:`, JSON.stringify(uploadError, null, 2));
        return {
            ok: false,
            error: `Failed to upload ${mediaLabel}`,
            details: uploadError.message,
            code: uploadError.name,
        };
    }

    return { ok: true, path: fileName, sizeBytes: file.size };
}

/**
 * Upload photo files from FormData. Reads up to 2 indexed entries
 * in the format `photos[i]`. Returns an array of storage paths.
 */
export async function uploadPhotos(
    supabase: SupabaseClient,
    userId: string,
    formData: FormData
): Promise<string[]> {
    const photoFiles: File[] = [];
    for (let i = 0; i < 2; i++) {
        const photo = formData.get(`photos[${i}]`) as File | null;
        if (photo && photo.size > 0) photoFiles.push(photo);
    }

    const uploadedPaths: string[] = [];
    for (const photo of photoFiles) {
        const ext = photo.name.split('.').pop() || 'jpg';
        const fileName = `${userId}/photos/${uuidv4()}.${ext}`;
        const { error: photoError } = await supabase.storage
            .from('audio')
            .upload(fileName, photo, { contentType: photo.type });
        if (!photoError) uploadedPaths.push(fileName);
    }

    return uploadedPaths;
}

/**
 * Delete photos from storage that were removed during an edit.
 * Compares existing paths against the ones the user chose to keep.
 */
export async function cleanupRemovedPhotos(
    supabase: SupabaseClient,
    existingPhotoPaths: string[],
    keepPhotoPaths: string[]
): Promise<void> {
    const removedPaths = existingPhotoPaths.filter(p => !keepPhotoPaths.includes(p));
    if (removedPaths.length > 0) {
        await supabase.storage.from('audio').remove(removedPaths);
    }
}
