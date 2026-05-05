import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get partner_id from request body if provided
    let partner_id: string | null = null;
    try {
      const body = await req.json();
      const candidate = body?.partner_id;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof candidate === 'string' && uuidRegex.test(candidate)) {
        partner_id = candidate;
      }
    } catch {
      // No body or invalid JSON - that's fine, partner_id stays null
    }

    // Get IP address from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    const ipAddress = cfConnectingIp || forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    
    console.log(`Tracking visit from IP: ${ipAddress}, partner_id: ${partner_id}`);

    // Get city from IP using free API
    let city = null;
    let country = null;
    
    if (ipAddress && ipAddress !== 'unknown') {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city&lang=ru`);
        const geoData = await geoResponse.json();
        
        if (geoData.status === 'success') {
          city = geoData.city || null;
          country = geoData.country || null;
          console.log(`Location detected: ${city}, ${country}`);
        }
      } catch (geoError) {
        console.error('Geo lookup failed:', geoError);
      }
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert visit record with partner_id
    const { error } = await supabaseClient.from('visits').insert({
      ip_address: ipAddress,
      city: city,
      country: country,
      partner_id: partner_id
    });

    if (error) {
      console.error('Failed to insert visit:', error);
      throw error;
    }

    console.log('Visit tracked successfully');

    return new Response(
      JSON.stringify({ success: true, city, country }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in track-visit:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track visit' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
