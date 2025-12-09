/**
 * Supabase Edge Function: The Odds API Proxy
 * Proxies requests to The Odds API to avoid CORS and keep API key secure
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const THE_ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const THE_ODDS_API_KEY = Deno.env.get("THE_ODDS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASE_PROJECT_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

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

    // This function is deployed with --no-verify-jwt, so it's public
    // We don't need to verify authentication for this proxy function
    
    // Parse request URL
    const url = new URL(req.url);
    let path = url.pathname.replace("/the-odds-api", "");
    
    // Handle Supabase client POST requests (they send path in body)
    if (req.method === 'POST') {
      try {
        const contentType = req.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const body = await req.json();
          if (body.path) {
            // Remove leading / if present and /the-odds-api prefix
            path = body.path.replace(/^\/?the-odds-api\/?/, '').replace(/^\//, '');
          }
        }
      } catch (e) {
        // If body parsing fails, use URL path
      }
    }
    
    // If path starts with /, remove it
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // Handle /compare endpoint (custom logic, not in The Odds API)
    // Support both formats: /sports/{sport}/events/{eventId}/compare and sports/{sport}/events/{eventId}/compare
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (normalizedPath.includes("/events/") && normalizedPath.includes("/compare")) {
      // Extract sport and eventId from path: /sports/{sport}/events/{eventId}/compare
      const pathParts = normalizedPath.split("/").filter(p => p); // Remove empty strings
      const sportIndex = pathParts.indexOf("sports");
      const eventsIndex = pathParts.indexOf("events");
      
      if (sportIndex !== -1 && eventsIndex !== -1 && eventsIndex < pathParts.length - 1) {
        const sport = pathParts[sportIndex + 1];
        const eventId = pathParts[eventsIndex + 1];
        const market = url.searchParams.get("market") || "h2h";
        
        try {
          // Get odds for the sport to find the event
          const oddsUrl = new URL(`${THE_ODDS_API_BASE}/sports/${sport}/odds`);
          oddsUrl.searchParams.set("apiKey", THE_ODDS_API_KEY);
          oddsUrl.searchParams.set("regions", "us,uk,eu");
          oddsUrl.searchParams.set("markets", market);
          oddsUrl.searchParams.set("oddsFormat", "decimal");
          
          const oddsResponse = await fetch(oddsUrl.toString());
          
          if (!oddsResponse.ok) {
            throw new Error(`The Odds API returned ${oddsResponse.status}`);
          }
          
          const oddsData = await oddsResponse.json();
          
          // Find the event by ID
          const event = Array.isArray(oddsData) 
            ? oddsData.find((e: any) => e.id === eventId)
            : null;
          
          if (!event) {
            // Event not found in current odds - return empty comparisons instead of 404
            return new Response(
              JSON.stringify({ 
                success: true, 
                data: {
                  event: { id: eventId },
                  comparisons: {},
                  bestBookmakers: {},
                }
              }),
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              }
            );
          }
        
        // Compare odds across bookmakers
        const comparisons: Record<string, any> = {};
        const bestBookmakers: Record<string, string> = {};
        
        if (event.bookmakers && Array.isArray(event.bookmakers)) {
          event.bookmakers.forEach((bookmaker: any) => {
            if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
              bookmaker.markets.forEach((marketData: any) => {
                if (marketData.key === market && marketData.outcomes && Array.isArray(marketData.outcomes)) {
                  marketData.outcomes.forEach((outcome: any) => {
                    const key = outcome.name || outcome.description || "unknown";
                    if (!comparisons[key]) {
                      comparisons[key] = {
                        name: key,
                        allOdds: [],
                        bestOdds: 0,
                        bestBookmaker: "",
                      };
                    }
                    const odds = parseFloat(outcome.price) || 0;
                    const bookmakerName = bookmaker.title || bookmaker.key;
                    
                    // Add to allOdds array (format expected by frontend)
                    comparisons[key].allOdds.push({
                      odds,
                      bookmaker: bookmakerName,
                    });
                    
                    if (odds > comparisons[key].bestOdds) {
                      comparisons[key].bestOdds = odds;
                      comparisons[key].bestBookmaker = bookmakerName;
                      bestBookmakers[key] = bookmakerName;
                    }
                  });
                }
              });
            }
          });
        }
        
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: {
                event,
                comparisons,
                bestBookmakers,
              }
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        } catch (error: any) {
          console.error("Error processing compare request:", error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: { message: error.message || "Error processing comparison" } 
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
      }
    }
    
    // For other endpoints, proxy to The Odds API
    // Build The Odds API URL
    // Ensure path starts with / for proper URL construction
    const apiPath = path.startsWith('/') ? path : `/${path}`;
    const apiUrl = new URL(`${THE_ODDS_API_BASE}${apiPath}`);
    
    // Add API key
    apiUrl.searchParams.set("apiKey", THE_ODDS_API_KEY);
    
    // Copy query parameters from request (except sync and save which are backend-specific)
    url.searchParams.forEach((value, key) => {
      if (key !== "apiKey" && key !== "sync" && key !== "save") {
        apiUrl.searchParams.set(key, value);
      }
    });

    // Make request to The Odds API
    console.log("Fetching from The Odds API:", apiUrl.toString());
    const response = await fetch(apiUrl.toString(), {
      method: req.method,
      headers: {
        "Accept": "application/json",
      },
    });

    // Check if response is OK and is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error(`The Odds API returned non-JSON (${response.status}):`, errorText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { message: `The Odds API returned ${response.status}. Expected JSON but got ${contentType || 'unknown'}` } 
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

    let data;
    try {
      data = await response.json();
    } catch (e: any) {
      const errorText = await response.text();
      console.error("Failed to parse The Odds API response:", e.message, errorText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { message: `Failed to parse response from The Odds API: ${e.message}` } 
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

    // Check if The Odds API returned an error (even with 200 status)
    if (data.message && data.error_code) {
      console.error("The Odds API error:", data.message, data.error_code);
      return new Response(
        JSON.stringify({ 
          success: false, 
          data: data // Return the error from The Odds API
        }),
        {
          status: response.status, // Use the status from The Odds API
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

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

