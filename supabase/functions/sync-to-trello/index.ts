import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrelloCardRequest {
  leadData: {
    client_name: string;
    mobile_number: string;
    email?: string;
    emirate?: string;
    nationality_code?: string;
    service_required?: string;
    status: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadData }: TrelloCardRequest = await req.json();

    const TRELLO_API_KEY = Deno.env.get("TRELLO_API_KEY");
    const TRELLO_TOKEN = Deno.env.get("TRELLO_TOKEN");
    const TRELLO_LIST_ID = Deno.env.get("TRELLO_LIST_ID");

    if (!TRELLO_API_KEY || !TRELLO_TOKEN || !TRELLO_LIST_ID) {
      console.log("Trello credentials not configured");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Trello integration not configured",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create card name
    const cardName = `${leadData.client_name} - ${leadData.mobile_number}`;

    // Create card description
    const description = `
**Lead Information**

📱 Mobile: ${leadData.mobile_number}
📧 Email: ${leadData.email || "N/A"}
📍 Emirate: ${leadData.emirate || "N/A"}
🌍 Nationality: ${leadData.nationality_code || "N/A"}
💼 Service: ${leadData.service_required || "N/A"}
🎯 Status: ${leadData.status}

---
*Synced from TADCRM*
    `.trim();

    // Create Trello card
    const trelloUrl = `https://api.trello.com/1/cards`;
    const params = new URLSearchParams({
      key: TRELLO_API_KEY,
      token: TRELLO_TOKEN,
      idList: TRELLO_LIST_ID,
      name: cardName,
      desc: description,
    });

    const trelloResponse = await fetch(`${trelloUrl}?${params}`, {
      method: "POST",
    });

    if (!trelloResponse.ok) {
      throw new Error(`Trello API error: ${trelloResponse.statusText}`);
    }

    const trelloCard = await trelloResponse.json();

    console.log("Trello card created:", trelloCard.id);

    return new Response(
      JSON.stringify({
        success: true,
        cardId: trelloCard.id,
        cardUrl: trelloCard.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in sync-to-trello function:", error);
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
