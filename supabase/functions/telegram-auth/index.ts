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
    const { initData, widgetData, isMiniApp } = await req.json();
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    let userData: {
      id: string;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };

    if (isMiniApp && initData) {
      const urlParams = new URLSearchParams(initData);
      const userDataStr = urlParams.get('user');
      if (!userDataStr) {
        throw new Error('No user data in initData');
      }
      
      const parsedUser = JSON.parse(userDataStr);
      userData = {
        id: String(parsedUser.id),
        username: parsedUser.username,
        first_name: parsedUser.first_name,
        last_name: parsedUser.last_name,
        photo_url: parsedUser.photo_url,
      };
    } else if (widgetData) {
      userData = {
        id: String(widgetData.id),
        username: widgetData.username,
        first_name: widgetData.first_name,
        last_name: widgetData.last_name,
        photo_url: widgetData.photo_url,
      };
    } else {
      throw new Error('No authentication data provided');
    }

    console.log('Authenticated user:', userData.id, userData.username);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existingUser } = await supabaseClient
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', userData.id)
      .single();

    if (existingUser) {
      await supabaseClient
        .from('telegram_users')
        .update({
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url,
          last_login: new Date().toISOString(),
        })
        .eq('telegram_id', userData.id);
    } else {
      await supabaseClient
        .from('telegram_users')
        .insert({
          telegram_id: userData.id,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url,
        });
    }

    const { data: analyses } = await supabaseClient
      .from('user_analyses')
      .select('*')
      .eq('telegram_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(3);

    return new Response(
      JSON.stringify({ success: true, user: userData, recentAnalyses: analyses || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Telegram auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка аутентификации' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
