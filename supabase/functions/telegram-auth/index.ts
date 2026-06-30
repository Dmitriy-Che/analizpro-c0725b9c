import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Max allowed age of Telegram auth_date (seconds)
const AUTH_DATE_MAX_AGE = 60 * 60 * 24; // 24h — Mini App sessions can be long-lived

async function hmacSha256Hex(keyData: Uint8Array | ArrayBuffer, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(message: string): Promise<ArrayBuffer> {
  return await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verify Telegram Mini App initData per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app */
async function verifyInitData(initData: string, botToken: string): Promise<URLSearchParams | null> {
  const params = new URLSearchParams(initData);
  const providedHash = params.get('hash');
  if (!providedHash) return null;
  params.delete('hash');

  const dataCheckArr: string[] = [];
  const keys = Array.from(params.keys()).sort();
  for (const k of keys) dataCheckArr.push(`${k}=${params.get(k)}`);
  const dataCheckString = dataCheckArr.join('\n');

  // secret_key = HMAC_SHA256(key="WebAppData", message=bot_token)
  const secretKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const secretSig = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(botToken));
  const computedHash = await hmacSha256Hex(secretSig, dataCheckString);

  if (!timingSafeEqualHex(computedHash, providedHash)) return null;

  const authDate = parseInt(params.get('auth_date') || '0', 10);
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > AUTH_DATE_MAX_AGE) return null;

  // restore hash for completeness
  params.set('hash', providedHash);
  return params;
}

/** Verify Telegram Login Widget payload per https://core.telegram.org/widgets/login#checking-authorization */
async function verifyWidgetData(widgetData: Record<string, unknown>, botToken: string): Promise<boolean> {
  const providedHash = typeof widgetData.hash === 'string' ? widgetData.hash : null;
  if (!providedHash) return false;

  const entries = Object.entries(widgetData).filter(([k, v]) => k !== 'hash' && v !== undefined && v !== null);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  // secret_key = SHA256(bot_token)
  const secretKey = await sha256(botToken);
  const computedHash = await hmacSha256Hex(secretKey, dataCheckString);

  if (!timingSafeEqualHex(computedHash, providedHash)) return false;

  const authDate = Number(widgetData.auth_date || 0);
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > AUTH_DATE_MAX_AGE) return false;
  return true;
}

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
      const verified = await verifyInitData(String(initData), botToken);
      if (!verified) {
        return new Response(
          JSON.stringify({ error: 'Неверная или устаревшая подпись Telegram' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const userDataStr = verified.get('user');
      if (!userDataStr) {
        return new Response(
          JSON.stringify({ error: 'Нет данных пользователя' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const parsedUser = JSON.parse(userDataStr);
      userData = {
        id: String(parsedUser.id),
        username: parsedUser.username,
        first_name: parsedUser.first_name,
        last_name: parsedUser.last_name,
        photo_url: parsedUser.photo_url,
      };
    } else if (widgetData && typeof widgetData === 'object') {
      const ok = await verifyWidgetData(widgetData as Record<string, unknown>, botToken);
      if (!ok) {
        return new Response(
          JSON.stringify({ error: 'Неверная или устаревшая подпись Telegram' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userData = {
        id: String((widgetData as any).id),
        username: (widgetData as any).username,
        first_name: (widgetData as any).first_name,
        last_name: (widgetData as any).last_name,
        photo_url: (widgetData as any).photo_url,
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'No authentication data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
