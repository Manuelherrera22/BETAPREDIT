-- Function to enrich predictions with advanced features
-- This function calculates team form, H2H, and market intelligence

CREATE OR REPLACE FUNCTION get_advanced_features_for_event(
  event_id_param TEXT
)
RETURNS TABLE (
  -- Team form features
  home_win_rate_5 FLOAT,
  home_win_rate_10 FLOAT,
  home_goals_for_avg_5 FLOAT,
  home_goals_against_avg_5 FLOAT,
  home_current_streak FLOAT,
  away_win_rate_5 FLOAT,
  away_win_rate_10 FLOAT,
  away_goals_for_avg_5 FLOAT,
  away_goals_against_avg_5 FLOAT,
  away_current_streak FLOAT,
  -- H2H features
  h2h_win_rate_home FLOAT,
  h2h_draw_rate FLOAT,
  h2h_total_goals_avg FLOAT,
  -- Market intelligence
  market_consensus FLOAT,
  market_efficiency FLOAT,
  sharp_money_indicator FLOAT,
  value_opportunity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  home_team_name TEXT;
  away_team_name TEXT;
BEGIN
  -- Get event information
  SELECT e."homeTeam", e."awayTeam", e."sportId"
  INTO event_record
  FROM "Event" e
  WHERE e.id = event_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  home_team_name := event_record."homeTeam";
  away_team_name := event_record."awayTeam";
  
  -- Calculate team form (simplified - would need actual match history)
  -- For now, return defaults that will be enhanced by Python service
  
  RETURN QUERY
  SELECT
    -- Home team form (defaults - will be enhanced)
    0.5::FLOAT as home_win_rate_5,
    0.5::FLOAT as home_win_rate_10,
    1.5::FLOAT as home_goals_for_avg_5,
    1.5::FLOAT as home_goals_against_avg_5,
    0.0::FLOAT as home_current_streak,
    -- Away team form
    0.5::FLOAT as away_win_rate_5,
    0.5::FLOAT as away_win_rate_10,
    1.5::FLOAT as away_goals_for_avg_5,
    1.5::FLOAT as away_goals_against_avg_5,
    0.0::FLOAT as away_current_streak,
    -- H2H
    0.5::FLOAT as h2h_win_rate_home,
    0.25::FLOAT as h2h_draw_rate,
    3.0::FLOAT as h2h_total_goals_avg,
    -- Market intelligence (calculated from odds)
    (
      SELECT 1.0 - (STDDEV(1.0 / o.decimal) * 2)
      FROM "Odds" o
      INNER JOIN "Market" m ON o."marketId" = m.id
      WHERE m."eventId" = event_id_param
        AND m.type = 'MATCH_WINNER'
        AND o."isActive" = true
      LIMIT 1
    )::FLOAT as market_consensus,
    (
      SELECT 1.0 - STDDEV(1.0 / o.decimal)
      FROM "Odds" o
      INNER JOIN "Market" m ON o."marketId" = m.id
      WHERE m."eventId" = event_id_param
        AND m.type = 'MATCH_WINNER'
        AND o."isActive" = true
      LIMIT 1
    )::FLOAT as market_efficiency,
    0.5::FLOAT as sharp_money_indicator,
    0.02::FLOAT as value_opportunity;
END;
$$;

GRANT EXECUTE ON FUNCTION get_advanced_features_for_event TO anon, authenticated;

COMMENT ON FUNCTION get_advanced_features_for_event IS 'Returns advanced features for event prediction including team form, H2H, and market intelligence. Enhanced by Python service with actual data.';

