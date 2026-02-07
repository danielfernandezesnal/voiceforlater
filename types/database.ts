export type Plan = 'free' | 'pro'

export type MessageType = 'text' | 'audio' | 'video'

export type MessageStatus = 'draft' | 'scheduled' | 'delivered'

export type DeliveryMode = 'date' | 'checkin'

export type CheckinStatus = 'active' | 'pending' | 'confirmed_absent'

export interface Profile {
    id: string
    plan: Plan
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    created_at: string
}

export interface Message {
    id: string
    owner_id: string
    type: MessageType
    status: MessageStatus
    text_content: string | null
    audio_path: string | null
    created_at: string
}

export interface Recipient {
    id: string
    message_id: string
    name: string
    email: string
}

export interface DeliveryRule {
    id: string
    message_id: string
    mode: DeliveryMode
    deliver_at: string | null
    checkin_interval_days: number | null
    attempts_limit: number
}

export interface TrustedContact {
    id: string
    user_id: string
    name: string
    email: string
}

export interface Checkin {
    id: string
    user_id: string
    last_confirmed_at: string | null
    next_due_at: string | null
    attempts: number
    status: CheckinStatus
}

export interface Event {
    id: string
    type: string
    user_id: string | null
    metadata: Record<string, unknown> | null
    created_at: string
}
