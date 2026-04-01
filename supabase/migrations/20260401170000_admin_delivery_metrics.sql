-- 20260401170000_admin_delivery_metrics.sql

-- 1. Performance index for aggregated delivery metrics
CREATE INDEX IF NOT EXISTS idx_events_delivery_lookup ON public.events (type, created_at);

-- 2. Delivery Metrics Function
CREATE OR REPLACE FUNCTION public.admin_delivery_metrics(
    p_date_from TIMESTAMPTZ DEFAULT NULL, 
    p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Secure Guard: Reuse existing check_if_admin
    IF NOT public.check_if_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Admin privileges required.';
    END IF;

    -- Search path hygiene
    SET LOCAL search_path = public, auth;

    WITH filtered_events AS (
        SELECT 
            type,
            COALESCE(metadata->>'flow', 'unknown') as flow,
            COALESCE((metadata->>'reclaimed_stale')::boolean, FALSE) as reclaimed_stale
        FROM public.events
        WHERE (p_date_from IS NULL OR created_at >= p_date_from)
          AND (p_date_to IS NULL OR created_at <= p_date_to)
          AND type IN (
              'message_claimed', 
              'message_delivery_finalized', 
              'message_send_failed', 
              'message_finalize_failed'
          )
    ),
    metrics AS (
        SELECT 
            flow,
            COUNT(*) FILTER (WHERE type = 'message_claimed')::bigint as processed_count,
            COUNT(*) FILTER (WHERE type = 'message_delivery_finalized')::bigint as delivered_count,
            COUNT(*) FILTER (WHERE type = 'message_send_failed')::bigint as send_failed_count,
            COUNT(*) FILTER (WHERE type = 'message_finalize_failed')::bigint as finalize_failed_count,
            COUNT(*) FILTER (WHERE type = 'message_claimed' AND reclaimed_stale IS TRUE)::bigint as stale_reclaim_count
        FROM filtered_events
        GROUP BY flow
    ),
    totals AS (
        SELECT 
            'total' as flow,
            COALESCE(SUM(processed_count), 0)::bigint as processed_count,
            COALESCE(SUM(delivered_count), 0)::bigint as delivered_count,
            COALESCE(SUM(send_failed_count), 0)::bigint as send_failed_count,
            COALESCE(SUM(finalize_failed_count), 0)::bigint as finalize_failed_count,
            COALESCE(SUM(stale_reclaim_count), 0)::bigint as stale_reclaim_count
        FROM metrics
    ),
    combined AS (
        SELECT * FROM metrics
        UNION ALL
        SELECT * FROM totals
    )
    SELECT 
        jsonb_object_agg(
            flow, 
            jsonb_build_object(
                'processed_count', processed_count,
                'delivered_count', delivered_count,
                'send_failed_count', send_failed_count,
                'finalize_failed_count', finalize_failed_count,
                'stale_reclaim_count', stale_reclaim_count,
                'success_rate', CASE 
                    WHEN processed_count > 0 THEN ROUND((delivered_count::numeric / processed_count::numeric) * 100, 1)
                    ELSE 0 
                END
            )
        ) INTO v_result
    FROM combined;

    -- Return empty skeleton if no data gathered
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Revoke public/anon access explicit for this one too
REVOKE EXECUTE ON FUNCTION public.admin_delivery_metrics(timestamptz, timestamptz) FROM public, anon;
