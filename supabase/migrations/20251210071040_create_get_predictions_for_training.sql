-- Function to get predictions with actual results for AutoML training
-- Returns predictions that have been resolved (event finished) with their outcomes
-- CORREGIDA: Casts explícitos para tipos numéricos

CREATE OR REPLACE FUNCTION get_predictions_for_training(
  limit_count INTEGER DEFAULT 1000,
  min_confidence FLOAT DEFAULT 0.0,
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  event_id TEXT,
  market_id TEXT,
  selection TEXT,
  predicted_probability FLOAT,
  confidence FLOAT,
  model_version TEXT,
  factors JSONB,
  actual_result TEXT,
  was_correct BOOLEAN,
  accuracy FLOAT,
  created_at TIMESTAMP,
  event_finished_at TIMESTAMP,
  -- Event data
  event_name TEXT,
  sport_id TEXT,
  sport_name TEXT,
  -- Market data
  market_type TEXT,
  market_name TEXT,
  -- Odds data (if available)
  market_odds JSONB,
  avg_odds FLOAT,
  -- Additional features
  days_until_event FLOAT,
  event_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p."eventId" as event_id,
    p."marketId" as market_id,
    p.selection,
    p."predictedProbability"::DOUBLE PRECISION as predicted_probability,
    p.confidence::DOUBLE PRECISION as confidence,
    p."modelVersion" as model_version,
    p.factors,
    p."actualResult" as actual_result,
    p."wasCorrect" as was_correct,
    p.accuracy::DOUBLE PRECISION as accuracy,
    p."createdAt" as created_at,
    p."eventFinishedAt" as event_finished_at,
    -- Event data
    e.name as event_name,
    e."sportId" as sport_id,
    s.name as sport_name,
    -- Market data
    m.type::TEXT as market_type,
    m.name as market_name,
    -- Odds data (aggregated)
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'selection', o.selection,
            'decimal', o.decimal,
            'probability', o.probability
          )
        )
        FROM "Odds" o
        WHERE o."marketId" = p."marketId"
          AND o."isActive" = true
      ),
      '[]'::jsonb
    ) as market_odds,
    -- Average odds for this selection
    (
      SELECT AVG(o.decimal)::DOUBLE PRECISION
      FROM "Odds" o
      WHERE o."marketId" = p."marketId"
        AND o.selection = p.selection
        AND o."isActive" = true
    ) as avg_odds,
    -- Days until event (at prediction time)
    EXTRACT(EPOCH FROM (e."startTime" - p."createdAt"))::DOUBLE PRECISION / 86400.0 as days_until_event,
    e.status::TEXT as event_status
  FROM "Prediction" p
  INNER JOIN "Event" e ON p."eventId" = e.id
  INNER JOIN "Sport" s ON e."sportId" = s.id
  INNER JOIN "Market" m ON p."marketId" = m.id
  WHERE 
    -- Only get predictions with actual results (events finished)
    p."wasCorrect" IS NOT NULL
    AND p."actualResult" IS NOT NULL
    AND p.confidence >= min_confidence
    AND e.status = 'FINISHED'
    -- Optional date filters
    AND (start_date IS NULL OR p."createdAt" >= start_date)
    AND (end_date IS NULL OR p."createdAt" <= end_date)
  ORDER BY p."createdAt" DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_predictions_for_training TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION get_predictions_for_training IS 'Returns predictions with actual results for AutoML training. Only includes predictions from finished events with resolved outcomes.';

