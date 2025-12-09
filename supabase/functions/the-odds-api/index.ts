/**
 * Supabase Edge Function: The Odds API Proxy
 * Proxies requests to The Odds API to avoid CORS and keep API key secure
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const THE_ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const THE_ODDS_API_KEY = Deno.env.get("THE_ODDS_API_KEY");

interface RequestPayload {
  path: string;
  method?: string;
  params?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Verify API key is configured
    if (!THE_ODDS_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { message: "The Odds API key not configured" } 
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const path = url.pathname.replace("/the-odds-api", "");
    
    // Build The Odds API URL
    const apiUrl = new URL(`${THE_ODDS_API_BASE}${path}`);
    
    // Add API key
    apiUrl.searchParams.set("apiKey", THE_ODDS_API_KEY);
    
    // Copy query parameters from request
    url.searchParams.forEach((value, key) => {
      if (key !== "apiKey") {
        apiUrl.searchParams.set(key, value);
      }
    });

    // Make request to The Odds API
    const response = await fetch(apiUrl.toString(), {
      method: req.method,
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    // Return response
    return new Response(
      JSON.stringify({ 
        success: response.ok, 
        data: data 
      }),
      {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in The Odds API proxy:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { message: error.message || "Internal server error" } 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

