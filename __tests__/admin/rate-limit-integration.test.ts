import { GET } from '@/app/api/admin/check/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/server/requireAdmin', () => ({
    requireAdmin: jest.fn().mockResolvedValue({
        user: { id: 'admin-user-id' }
    })
}));

jest.mock('@/lib/admin/utils', () => ({
    // We want to control this mock for different tests
    checkRateLimit: jest.fn(),
    logAdminAction: jest.fn().mockResolvedValue(undefined)
}));

import { checkRateLimit } from '@/lib/admin/utils';

describe('Admin API: Rate Limit Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 429 when rate limit exceeded', async () => {
        (checkRateLimit as jest.Mock).mockReturnValue(false);

        const req = new NextRequest('http://localhost/api/admin/check');
        const res = await GET(req);

        expect(res.status).toBe(429);
        const json = await res.json();
        expect(json.error).toBe("Too many requests");
    });

    it('should return 200 when rate limit allowed', async () => {
        (checkRateLimit as jest.Mock).mockReturnValue(true);

        const req = new NextRequest('http://localhost/api/admin/check');
        const res = await GET(req);

        expect(res.status).toBe(200);
    });
});
