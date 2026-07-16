import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: settings } = await supabase
      .from('payment_settings')
      .select('key,value')
      .in('key', ['qr_image_url', 'qr_image_path']);
    const map = Object.fromEntries((settings || []).map((r: any) => [r.key, r.value ?? '']));
    let url = map.qr_image_url || '';
    if (!url && map.qr_image_path) {
      const { data: signed } = await supabase.storage
        .from('payment-qr')
        .createSignedUrl(map.qr_image_path, 60 * 60 * 24);
      url = signed?.signedUrl || '';
    }
    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
