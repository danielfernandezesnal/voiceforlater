import { createAdminClient } from '@/lib/supabase/admin';

export type EmailType = 'magic_link' | 'checkin_reminder' | 'message_delivery' | 'trusted_contact_alert';

interface TrackEmailParams {
    userId?: string;
    toEmail: string;
    emailType: EmailType;
    providerMessageId?: string;
    status?: 'pending' | 'sent' | 'failed';
    errorMessage?: string;
}

/**
 * Track an email event in the database
 * This function uses the admin client to bypass RLS
 */
export async function trackEmail(params: TrackEmailParams): Promise<void> {
    try {
        const supabase = createAdminClient();

        const { error } = await supabase.from('email_events').insert({
            user_id: params.userId || null,
            to_email: params.toEmail,
            email_type: params.emailType,
            provider_message_id: params.providerMessageId || null,
            status: params.status || 'sent',
            error_message: params.errorMessage || null,
            sent_at: params.status === 'sent' ? new Date().toISOString() : null,
        });

        if (error) {
            console.error('Failed to track email event:', error);
            // Don't throw - email tracking is not critical, shouldn't break main flow
        }
    } catch (err) {
        console.error('Error in trackEmail:', err);
        // Silently fail - don't break the application
    }
}

/**
 * Update an existing email event status
 */
export async function updateEmailStatus(
    providerMessageId: string,
    status: 'sent' | 'failed',
    errorMessage?: string
): Promise<void> {
    try {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('email_events')
            .update({
                status,
                error_message: errorMessage || null,
                sent_at: status === 'sent' ? new Date().toISOString() : null,
            })
            .eq('provider_message_id', providerMessageId);

        if (error) {
            console.error('Failed to update email status:', error);
        }
    } catch (err) {
        console.error('Error in updateEmailStatus:', err);
    }
}
