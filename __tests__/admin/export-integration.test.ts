import { GET } from '@/app/api/admin/users/export/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/server/requireAdmin', () => ({
    requireAdmin: jest.fn().mockResolvedValue({
        user: { id: 'admin-user-id' }
    })
}));

jest.mock('@/lib/admin/utils', () => ({
    checkRateLimit: jest.fn().mockReturnValue(true),
    logAdminAction: jest.fn().mockResolvedValue(undefined)
}));

// Mock Supabase Admin Client
const mockSupabase = {
    auth: {
        admin: {
            listUsers: jest.fn()
        }
    },
    from: jest.fn()
};

jest.mock('@/lib/supabase/admin', () => ({
    getAdminClient: jest.fn(() => mockSupabase)
}));

describe('Admin API: CSV Export', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should generate CSV correctly', async () => {
        // Mock Data
        const users = [
            { id: 'u1', email: 'test@example.com', created_at: '2023-01-01T00:00:00Z' }
        ];

        mockSupabase.auth.admin.listUsers.mockResolvedValue({
            data: { users, total: 1 },
            error: null
        });

        // Mock chained calls for enrichment
        // user_subscriptions
        const mockStart = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { plan: 'pro', status: 'active' } })
        };

        // messages count
        const mockMsgsCount = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 5 })
        };

        // messages storage
        const mockStorage = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ file_size_bytes: 1024 * 1024 }] })
        };

        // emails
        const mockEmails = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 2 })
        };

        // contacts
        const mockContacts = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 1 })
        };

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'user_subscriptions') return mockStart;
            if (table === 'messages') return mockMsgsCount; // simplified, logic has multiple calls to messages
            if (table === 'trusted_contacts') return mockContacts;
            if (table === 'email_events') return mockEmails;
            return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({}) };
        });

        // Refine mock for messages usage (count vs data)
        // The implementation calls messages twice. Once for count, once for storage.
        // We need 'from' to return a new object each time or handle state.
        // Or we use `mockImplementationOnce` sequence.

        mockSupabase.from
            .mockReturnValueOnce(mockStart) // subscription
            .mockReturnValueOnce(mockMsgsCount) // message count
            .mockReturnValueOnce(mockContacts) // contacts
            .mockReturnValueOnce(mockStorage) // storage
            .mockReturnValueOnce(mockEmails); // emails

        const req = new NextRequest('http://localhost/api/admin/users/export');
        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('text/csv');

        const text = await res.text();
        expect(text).toContain('user_id,email,created_at,plan_status');
        expect(text).toContain('test@example.com');
        expect(text).toContain('"pro (active)"');
        expect(text).toContain('1.00'); // 1MB
    });
});
