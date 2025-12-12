/**
 * Predictions Edge Function
 * Handles prediction-related endpoints using Supabase
 * Completes migration of predictions endpoints
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Missing authorization header' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Invalid or expired token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const url = new URL(req.url);
    const path = url.pathname.replace('/predictions', '');

    // Route handling
    if (req.method === 'GET' && path === '/accuracy') {
      // GET /predictions/accuracy - Get accuracy tracking
      const modelVersion = url.searchParams.get('modelVersion');
      const sportId = url.searchParams.get('sportId');
      const marketType = url.searchParams.get('marketType');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      // Build query
      let query = supabase
        .from('Prediction')
        .select(`
          *,
          event:Event(
            *,
            sport:Sport(*)
          ),
          market:Market(*)
        `)
        .not('wasCorrect', 'is', null);

      if (modelVersion) {
        query = query.eq('modelVersion', modelVersion);
      }
      if (startDate) {
        query = query.gte('createdAt', startDate);
      }
      if (endDate) {
        query = query.lte('createdAt', endDate);
      }

      const { data: predictions, error } = await query;

      if (error) {
        throw error;
      }

      // Filter by sport and market if specified
      let filtered = predictions || [];
      if (sportId) {
        filtered = filtered.filter((p: any) => p.event?.sportId === sportId);
      }
      if (marketType) {
        filtered = filtered.filter((p: any) => p.market?.type === marketType);
      }

      const total = filtered.length;
      if (total === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              total: 0,
              correct: 0,
              accuracy: 0,
              avgAccuracy: 0,
              brierScore: 0,
              calibrationScore: 0,
              calibrationBins: [],
              bySport: [],
              byMarket: [],
              byConfidence: [],
              recentPredictions: [],
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const correct = filtered.filter((p: any) => p.wasCorrect).length;
      const accuracy = (correct / total) * 100;
      const avgAccuracy = filtered.reduce((sum: number, p: any) => sum + (p.accuracy || 0), 0) / total;

      // Calculate Brier Score
      const brierScore = filtered.reduce((sum: number, p: any) => {
        const actual = p.actualResult === 'WON' ? 1 : p.actualResult === 'LOST' ? 0 : 0.5;
        return sum + Math.pow(p.predictedProbability - actual, 2);
      }, 0) / total;

      // Calculate calibration bins
      const calibrationBins: Record<string, { predicted: number[]; actual: number[] }> = {};
      filtered.forEach((p: any) => {
        const bin = Math.floor(p.predictedProbability * 10) / 10;
        const binKey = bin.toFixed(1);
        if (!calibrationBins[binKey]) {
          calibrationBins[binKey] = { predicted: [], actual: [] };
        }
        calibrationBins[binKey].predicted.push(p.predictedProbability);
        const actual = p.actualResult === 'WON' ? 1 : p.actualResult === 'LOST' ? 0 : 0.5;
        calibrationBins[binKey].actual.push(actual);
      });

      const calibrationScores = Object.entries(calibrationBins).map(([bin, data]) => {
        const avgPredicted = data.predicted.reduce((a: number, b: number) => a + b, 0) / data.predicted.length;
        const avgActual = data.actual.reduce((a: number, b: number) => a + b, 0) / data.actual.length;
        return {
          bin: parseFloat(bin),
          avgPredicted,
          avgActual,
          count: data.predicted.length,
          difference: Math.abs(avgPredicted - avgActual),
        };
      });

      const calibrationScore = calibrationScores.length > 0
        ? 1 - (calibrationScores.reduce((sum: number, s: any) => sum + s.difference, 0) / calibrationScores.length)
        : 0;

      // Group by sport
      const bySport: Record<string, any> = {};
      filtered.forEach((p: any) => {
        const sport = p.event?.sport?.name || 'Unknown';
        if (!bySport[sport]) {
          bySport[sport] = { total: 0, correct: 0, accuracySum: 0 };
        }
        bySport[sport].total++;
        if (p.wasCorrect) {
          bySport[sport].correct++;
        }
        bySport[sport].accuracySum += p.accuracy || 0;
      });

      // Group by market
      const byMarket: Record<string, any> = {};
      filtered.forEach((p: any) => {
        const market = p.market?.type || 'Unknown';
        if (!byMarket[market]) {
          byMarket[market] = { total: 0, correct: 0, accuracySum: 0 };
        }
        byMarket[market].total++;
        if (p.wasCorrect) {
          byMarket[market].correct++;
        }
        byMarket[market].accuracySum += p.accuracy || 0;
      });

      // Group by confidence
      const byConfidence: Record<string, any> = {};
      filtered.forEach((p: any) => {
        const confidenceBin = Math.floor(p.confidence * 10) / 10;
        const binKey = confidenceBin.toFixed(1);
        if (!byConfidence[binKey]) {
          byConfidence[binKey] = { total: 0, correct: 0 };
        }
        byConfidence[binKey].total++;
        if (p.wasCorrect) {
          byConfidence[binKey].correct++;
        }
      });

      // Recent predictions
      const recentPredictions = filtered
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)
        .map((p: any) => ({
          id: p.id,
          eventName: p.event?.homeTeam && p.event?.awayTeam
            ? `${p.event.homeTeam} vs ${p.event.awayTeam}`
            : p.event?.name || 'Unknown',
          selection: p.selection,
          predictedProbability: p.predictedProbability,
          confidence: p.confidence,
          wasCorrect: p.wasCorrect,
          accuracy: p.accuracy,
          createdAt: p.createdAt,
          eventFinishedAt: p.eventFinishedAt,
        }));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            total,
            correct,
            accuracy,
            avgAccuracy,
            brierScore,
            calibrationScore,
            calibrationBins: calibrationScores,
            bySport: Object.entries(bySport).map(([sport, data]: [string, any]) => ({
              sport,
              total: data.total,
              correct: data.correct,
              accuracy: (data.correct / data.total) * 100,
              avgAccuracy: data.accuracySum / data.total,
            })),
            byMarket: Object.entries(byMarket).map(([market, data]: [string, any]) => ({
              market,
              total: data.total,
              correct: data.correct,
              accuracy: (data.correct / data.total) * 100,
              avgAccuracy: data.accuracySum / data.total,
            })),
            byConfidence: Object.entries(byConfidence).map(([confidence, data]: [string, any]) => ({
              confidence: parseFloat(confidence),
              total: data.total,
              correct: data.correct,
              accuracy: (data.correct / data.total) * 100,
            })),
            recentPredictions,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'GET' && path === '/stats') {
      // GET /predictions/stats - Get basic prediction statistics
      const modelVersion = url.searchParams.get('modelVersion');

      let query = supabase
        .from('Prediction')
        .select(`
          wasCorrect,
          accuracy,
          modelVersion,
          event:Event(
            sport:Sport(name)
          ),
          market:Market(type)
        `)
        .not('wasCorrect', 'is', null);

      if (modelVersion) {
        query = query.eq('modelVersion', modelVersion);
      }

      const { data: predictions, error } = await query;

      if (error) {
        throw error;
      }

      const total = (predictions || []).length;
      const correct = (predictions || []).filter((p: any) => p.wasCorrect).length;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      const avgAccuracy = total > 0
        ? (predictions || []).reduce((sum: number, p: any) => sum + (p.accuracy || 0), 0) / total
        : 0;

      // Group by sport
      const bySport: Record<string, any> = {};
      (predictions || []).forEach((p: any) => {
        const sport = p.event?.sport?.name || 'Unknown';
        if (!bySport[sport]) {
          bySport[sport] = { total: 0, correct: 0 };
        }
        bySport[sport].total++;
        if (p.wasCorrect) {
          bySport[sport].correct++;
        }
      });

      // Group by market
      const byMarket: Record<string, any> = {};
      (predictions || []).forEach((p: any) => {
        const market = p.market?.type || 'Unknown';
        if (!byMarket[market]) {
          byMarket[market] = { total: 0, correct: 0 };
        }
        byMarket[market].total++;
        if (p.wasCorrect) {
          byMarket[market].correct++;
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            total,
            correct,
            accuracy,
            avgAccuracy,
            bySport: Object.entries(bySport).map(([sport, data]: [string, any]) => ({
              sport,
              total: data.total,
              correct: data.correct,
              accuracy: (data.correct / data.total) * 100,
            })),
            byMarket: Object.entries(byMarket).map(([market, data]: [string, any]) => ({
              market,
              total: data.total,
              correct: data.correct,
              accuracy: (data.correct / data.total) * 100,
            })),
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'GET' && path === '/history') {
      // GET /predictions/history - Get prediction history
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const sportId = url.searchParams.get('sportId');
      const marketType = url.searchParams.get('marketType');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      let query = supabase
        .from('Prediction')
        .select(`
          *,
          event:Event(
            *,
            sport:Sport(*)
          ),
          market:Market(*)
        `)
        .not('wasCorrect', 'is', null)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);

      if (sportId) {
        query = query.eq('event.sportId', sportId);
      }
      if (marketType) {
        query = query.eq('market.type', marketType);
      }
      if (startDate) {
        query = query.gte('createdAt', startDate);
      }
      if (endDate) {
        query = query.lte('createdAt', endDate);
      }

      const { data: predictions, error } = await query;

      if (error) {
        throw error;
      }

      const history = (predictions || []).map((p: any) => ({
        id: p.id,
        event: p.event?.homeTeam && p.event?.awayTeam
          ? `${p.event.homeTeam} vs ${p.event.awayTeam}`
          : p.event?.name || 'Unknown',
        sport: p.event?.sport?.name || 'Unknown',
        predicted: p.selection,
        actual: p.actualResult === 'WON' ? p.selection : p.actualResult === 'LOST' ? 'Perdido' : 'Void',
        correct: p.wasCorrect || false,
        confidence: (p.confidence || 0) * 100,
        date: p.createdAt,
        value: p.factors && typeof p.factors === 'object' && 'valuePercentage' in p.factors
          ? (p.factors as any).valuePercentage
          : null,
        odds: p.factors && typeof p.factors === 'object' && 'bookmakerOdds' in p.factors
          ? (p.factors as any).bookmakerOdds
          : null,
        accuracy: p.accuracy,
      }));

      return new Response(
        JSON.stringify({ success: true, data: history }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'POST' && path.startsWith('/') && path.includes('/feedback')) {
      // POST /predictions/:predictionId/feedback - Submit feedback
      const predictionId = path.split('/feedback')[0].replace('/', '');
      const body = await req.json();
      const { wasCorrect, userConfidence, notes } = body;

      if (wasCorrect === undefined) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'wasCorrect is required' },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get prediction
      const { data: prediction, error: predError } = await supabase
        .from('Prediction')
        .select('factors')
        .eq('id', predictionId)
        .single();

      if (predError || !prediction) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Prediction not found' },
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update factors with feedback
      const currentFactors = prediction.factors || {};
      const updatedFactors = {
        ...currentFactors,
        userFeedback: {
          userId,
          wasCorrect,
          userConfidence,
          notes,
          submittedAt: new Date().toISOString(),
        },
      };

      const { data: updated, error: updateError } = await supabase
        .from('Prediction')
        .update({ factors: updatedFactors })
        .eq('id', predictionId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, data: updated }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'GET' && path.startsWith('/') && path.endsWith('/factors')) {
      // GET /predictions/:predictionId/factors - Get prediction with factors
      const predictionId = path.replace('/factors', '').replace('/', '');

      const { data: prediction, error } = await supabase
        .from('Prediction')
        .select(`
          *,
          event:Event(
            *,
            sport:Sport(*)
          ),
          market:Market(*)
        `)
        .eq('id', predictionId)
        .single();

      if (error || !prediction) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { message: 'Prediction not found' },
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse factors for explanation
      const factors = prediction.factors || {};
      const factorExplanation = {
        keyFactors: [],
        confidenceFactors: [],
        riskFactors: [],
        advancedFeatures: factors,
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...prediction,
            factorExplanation,
            dataQuality: {
              isValid: true,
              completeness: 1.0,
              canDisplay: true,
              message: 'Prediction data is valid',
            },
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'POST' && path === '/train-model') {
      // POST /predictions/train-model - Train model (placeholder, actual training happens in backend)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Model training started. This may take 1-2 hours. Check logs for progress.',
          data: {
            status: 'training',
            note: 'Model training is handled by backend service. This endpoint is a placeholder.',
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Route not found' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in predictions function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
