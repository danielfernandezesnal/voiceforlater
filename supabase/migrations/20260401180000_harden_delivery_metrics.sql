-- 20260401180000_harden_delivery_metrics.sql

-- Evolve the delivery metrics function to be deterministic and safe
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

    WITH delivery_flows(flow_bucket) AS (
        VALUES ('total'), ('date'), ('checkin')
    ),
    raw_events AS (
        SELECT 
            type,
            CASE 
                WHEN metadata->>'flow' = 'date' THEN 'date'
                WHEN metadata->>'flow' = 'checkin' THEN 'checkin'
                ELSE 'other'
            END as flow,
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
    bucketed_metrics AS (
        -- Per-flow metrics
        SELECT 
            flow as flow_bucket,
            COUNT(*) FILTER (WHERE type = 'message_claimed')::bigint as processed_count,
            COUNT(*) FILTER (WHERE type = 'message_delivery_finalized')::bigint as delivered_count,
            COUNT(*) FILTER (WHERE type = 'message_send_failed')::bigint as send_failed_count,
            COUNT(*) FILTER (WHERE type = 'message_finalize_failed')::bigint as finalize_failed_count,
            COUNT(*) FILTER (WHERE type = 'message_claimed' AND reclaimed_stale IS TRUE)::bigint as stale_reclaim_count
        FROM raw_events
        WHERE flow IN ('date', 'checkin')
        GROUP BY flow

        UNION ALL

        -- Total metrics (includes 'other' if any, but currently should only be 'date' or 'checkin')
        SELECT 
            'total' as flow_bucket,
            COUNT(*) FILTER (WHERE type = 'message_claimed')::bigint as processed_count,
            COUNT(*) FILTER (WHERE type = 'message_delivery_finalized')::bigint as delivered_count,
            COUNT(*) FILTER (WHERE type = 'message_send_failed')::bigint as send_failed_count,
            COUNT(*) FILTER (WHERE type = 'message_finalize_failed')::bigint as finalize_failed_count,
            COUNT(*) FILTER (WHERE type = 'message_claimed' AND reclaimed_stale IS TRUE)::bigint as stale_reclaim_count
        FROM raw_events
    ),
    final_metrics AS (
        SELECT 
            df.flow_bucket,
            COALESCE(bm.processed_count, 0) as processed_count,
            COALESCE(bm.delivered_count, 0) as delivered_count,
            COALESCE(bm.send_failed_count, 0) as send_failed_count,
            COALESCE(bm.finalize_failed_count, 0) as finalize_failed_count,
            COALESCE(bm.stale_reclaim_count, 0) as stale_reclaim_count
        FROM delivery_flows df
        LEFT JOIN bucketed_metrics bm ON df.flow_bucket = bm.flow_bucket
    )
    SELECT 
        jsonb_build_object(
            'total', (SELECT jsonb_build_object(
                'processed_count', processed_count,
                'delivered_count', delivered_count,
                'send_failed_count', send_failed_count,
                'finalize_failed_count', finalize_failed_count,
                'stale_reclaim_count', stale_reclaim_count,
                'success_rate', CASE WHEN processed_count > 0 THEN ROUND((delivered_count::numeric / processed_count::numeric) * 100, 1) ELSE 0 END
            ) FROM final_metrics WHERE flow_bucket = 'total'),
            'date', (SELECT jsonb_build_object(
                'processed_count', processed_count,
                'delivered_count', delivered_count,
                'send_failed_count', send_failed_count,
                'finalize_failed_count', finalize_failed_count,
                'stale_reclaim_count', stale_reclaim_count,
                'success_rate', CASE WHEN processed_count > 0 THEN ROUND((delivered_count::numeric / processed_count::numeric) * 100, 1) ELSE 0 END
            ) FROM final_metrics WHERE flow_bucket = 'date'),
            'checkin', (SELECT jsonb_build_object(
                'processed_count', processed_count,
                'delivered_count', delivered_count,
                'send_failed_count', send_failed_count,
                'finalize_failed_count', finalize_failed_count,
                'stale_reclaim_count', stale_reclaim_count,
                'success_rate', CASE WHEN processed_count > 0 THEN ROUND((delivered_count::numeric / processed_count::numeric) * 100, 1) ELSE 0 END
            ) FROM final_metrics WHERE flow_bucket = 'checkin')
        ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
