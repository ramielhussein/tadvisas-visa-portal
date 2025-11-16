import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TRELLO_API_KEY = Deno.env.get("TRELLO_API_KEY");
    const TRELLO_TOKEN = Deno.env.get("TRELLO_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
      throw new Error("Trello credentials not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { boardId } = await req.json();

    if (!boardId) {
      throw new Error("Board ID is required");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all cards from the Trello board
    const trelloUrl = `https://api.trello.com/1/boards/${boardId}/cards`;
    const params = new URLSearchParams({
      key: TRELLO_API_KEY,
      token: TRELLO_TOKEN,
      fields: "name,desc",
    });

    console.log("Fetching cards from Trello board:", boardId);
    const trelloResponse = await fetch(`${trelloUrl}?${params}`);

    if (!trelloResponse.ok) {
      throw new Error(`Trello API error: ${trelloResponse.statusText}`);
    }

    const cards = await trelloResponse.json();
    console.log(`Found ${cards.length} cards in Trello board`);

    // Helper function to sanitize phone numbers to UAE format
    const sanitizeToUAE = (phone: string): string | null => {
      // Remove all non-digit characters
      let cleaned = phone.replace(/\D/g, "");

      // Handle different formats
      if (cleaned.startsWith("971")) {
        // Already in correct format
        if (cleaned.length === 12) return cleaned;
      } else if (cleaned.startsWith("00971")) {
        // Remove 00 prefix
        cleaned = cleaned.substring(2);
        if (cleaned.length === 12) return cleaned;
      } else if (cleaned.startsWith("0") && cleaned.length === 10) {
        // Local UAE format (0501234567 -> 971501234567)
        return "971" + cleaned.substring(1);
      } else if (cleaned.length === 9) {
        // Missing country code (501234567 -> 971501234567)
        return "971" + cleaned;
      }

      return null;
    };

    // Extract phone numbers from cards
    const phoneRegex = /\b(?:971|00971|0)?[5][0-9]{8}\b/g;
    const leadsToImport: Array<{
      mobile_number: string;
      client_name?: string;
      comments?: string;
      lead_source: string;
    }> = [];

    const seenPhones = new Set<string>();

    for (const card of cards) {
      const text = `${card.name} ${card.desc || ""}`;
      const matches = text.match(phoneRegex);

      if (matches) {
        for (const match of matches) {
          const sanitized = sanitizeToUAE(match);
          
          if (sanitized && sanitized.length === 12 && !seenPhones.has(sanitized)) {
            seenPhones.add(sanitized);
            
            leadsToImport.push({
              mobile_number: sanitized,
              client_name: card.name.replace(phoneRegex, "").trim() || undefined,
              comments: card.desc || undefined,
              lead_source: "Trello Import",
            });
          }
        }
      }
    }

    console.log(`Extracted ${leadsToImport.length} unique phone numbers`);

    if (leadsToImport.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          skipped: 0,
          message: "No phone numbers found in Trello cards",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check which numbers already exist
    const existingPhones = new Set<string>();
    const { data: existingLeads } = await supabase
      .from("leads")
      .select("mobile_number")
      .in("mobile_number", leadsToImport.map(l => l.mobile_number));

    if (existingLeads) {
      existingLeads.forEach(lead => existingPhones.add(lead.mobile_number));
    }

    // Filter out existing leads
    const newLeads = leadsToImport.filter(
      lead => !existingPhones.has(lead.mobile_number)
    );

    console.log(`${newLeads.length} new leads to import, ${existingPhones.size} already exist`);

    // Import new leads
    let imported = 0;
    if (newLeads.length > 0) {
      const { error } = await supabase.from("leads").insert(newLeads);

      if (error) {
        console.error("Error importing leads:", error);
        throw error;
      }

      imported = newLeads.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        skipped: existingPhones.size,
        total: leadsToImport.length,
        message: `Successfully imported ${imported} leads, skipped ${existingPhones.size} existing`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in import-trello-leads function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
