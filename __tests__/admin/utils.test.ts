import { checkRateLimit } from '@/lib/admin/utils';

// Mock dependencies
jest.mock('@/lib/supabase/admin', () => ({
    getAdminClient: jest.fn()
}));

describe('Admin Utils', () => {
    describe('Rate Limiter', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should allow first request', () => {
            expect(checkRateLimit('ip1')).toBe(true);
        });

        it('should block after 60 requests', () => {
            const ip = 'ip2';
            for (let i = 0; i < 60; i++) {
                expect(checkRateLimit(ip)).toBe(true);
            }
            expect(checkRateLimit(ip)).toBe(false);
        });

        it('should reset after window', () => {
            const ip = 'ip3';
            // Exhaust
            for (let i = 0; i < 60; i++) {
                checkRateLimit(ip);
            }
            expect(checkRateLimit(ip)).toBe(false);

            // Advance time 61s
            jest.setSystemTime(Date.now() + 61000);

            expect(checkRateLimit(ip)).toBe(true);
        });
    });
});
