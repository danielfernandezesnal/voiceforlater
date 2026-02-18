
import { getResourceId, mapSubscriptionToPlan } from './utils';
import Stripe from 'stripe';

describe('Stripe Utils', () => {

    describe('getResourceId', () => {
        it('should return null for null or undefined input', () => {
            expect(getResourceId(null)).toBeNull();
            expect(getResourceId(undefined)).toBeNull();
        });

        it('should return the string if input is a string', () => {
            expect(getResourceId('cus_123')).toBe('cus_123');
        });

        it('should return id property if input is an object with id', () => {
            expect(getResourceId({ id: 'sub_456' } as any)).toBe('sub_456');
        });
    });

    describe('mapSubscriptionToPlan', () => {
        const timestamp = 1716300000; // 2024-05-21T14:00:00.000Z
        const isoString = new Date(timestamp * 1000).toISOString();

        it('should return pro plan for active status', () => {
            const result = mapSubscriptionToPlan('active', false, timestamp);
            expect(result).toEqual({
                plan: 'pro',
                effectiveStatus: 'active',
                effectiveUntil: null
            });
        });

        it('should return pro plan for trialing status', () => {
            const result = mapSubscriptionToPlan('trialing', false, timestamp);
            expect(result).toEqual({
                plan: 'pro',
                effectiveStatus: 'trialing',
                effectiveUntil: null
            });
        });

        it('should set effectiveUntil if canceling at period end (active)', () => {
            const result = mapSubscriptionToPlan('active', true, timestamp);
            expect(result).toEqual({
                plan: 'pro',
                effectiveStatus: 'active',
                effectiveUntil: isoString
            });
        });

        it('should set effectiveUntil if canceling at period end (trialing)', () => {
            const result = mapSubscriptionToPlan('trialing', true, timestamp);
            expect(result).toEqual({
                plan: 'pro',
                effectiveStatus: 'trialing',
                effectiveUntil: isoString
            });
        });

        it('should return free plan for past_due status', () => {
            const result = mapSubscriptionToPlan('past_due', false, timestamp);
            expect(result).toEqual({
                plan: 'free',
                effectiveStatus: 'past_due',
                effectiveUntil: null
            });
        });

        it('should return free plan for canceled status', () => {
            const result = mapSubscriptionToPlan('canceled', false, timestamp);
            expect(result).toEqual({
                plan: 'free',
                effectiveStatus: 'canceled',
                effectiveUntil: null
            });
        });

        it('should return free plan for unpaid status', () => {
            const result = mapSubscriptionToPlan('unpaid', false, timestamp);
            expect(result).toEqual({
                plan: 'free',
                effectiveStatus: 'unpaid',
                effectiveUntil: null
            });
        });

        it('should handle missing currentPeriodEnd gracefully (null)', () => {
            // For active plan with no end date (rare, maybe internal or test?)
            const result = mapSubscriptionToPlan('active', true, null);
            expect(result).toEqual({
                plan: 'pro',
                effectiveStatus: 'active',
                effectiveUntil: null // Should be null as per logic: periodEndIso = currentPeriodEnd ? ... : null
            });
        });
    });
});
