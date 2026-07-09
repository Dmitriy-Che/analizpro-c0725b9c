import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTH_DATE_MAX_AGE = 60 * 60 * 24; // 24h

async function hmacSha256(keyData: Uint8Array | ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyInitData(initData: string, botToken: string): Promise<URLSearchParams | null> {
  const params = new URLSearchParams(initData);
  const providedHash = params.get('hash');
  if (!providedHash) return null;
  params.delete('hash');

  const keys = Array.from(params.keys()).sort();
  const dataCheckString = keys.map((k) => `${k}=${params.get(k)}`).join('\n');

  const secretSig = await hmacSha256(new TextEncoder().encode('WebAppData'), botToken);
  const computed = bufToHex(await hmacSha256(secretSig, dataCheckString));

  if (!timingSafeEqualHex(computed, providedHash)) return null;

  const authDate = parseInt(params.get('auth_date') || '0', 10);
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > AUTH_DATE_MAX_AGE) return null;

  params.set('hash', providedHash);
  return params;
}

function randomPassword(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)) + 'Aa1!';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    if (!initData || typeof initData !== 'string') {
      return new Response(JSON.stringify({ error: 'initData required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured');

    const verified = await verifyInitData(initData, botToken);
    if (!verified) {
      return new Response(JSON.stringify({ error: 'Неверная или устаревшая подпись Telegram' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userDataStr = verified.get('user');
    if (!userDataStr) {
      return new Response(JSON.stringify({ error: 'Нет данных пользователя Telegram' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const tgUser = JSON.parse(userDataStr);
    const telegramId = String(tgUser.id);
    const email = `tg_${telegramId}@telegram.local`;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Find existing mapping
    const { data: tgRow } = await admin
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    let userId: string | null = tgRow?.user_id ?? null;
    const password = randomPassword();

    if (!userId) {
      // Try to create user
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramId,
          telegram_username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          avatar_url: tgUser.photo_url,
          provider: 'telegram',
        },
      });
      if (createErr || !created?.user) {
        // Maybe user already exists — look up by listing (fallback)
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = list?.users?.find((u) => u.email === email);
        if (!found) throw createErr ?? new Error('Не удалось создать пользователя');
        userId = found.id;
        await admin.auth.admin.updateUserById(userId, { password });
      } else {
        userId = created.user.id;
      }
    } else {
      // Reset password to a known value so we can sign in
      await admin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: {
          telegram_id: telegramId,
          telegram_username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          avatar_url: tgUser.photo_url,
          provider: 'telegram',
        },
      });
    }

    // Upsert telegram_users row and link user_id
    await admin.from('telegram_users').upsert({
      telegram_id: telegramId,
      user_id: userId,
      username: tgUser.username ?? null,
      first_name: tgUser.first_name ?? null,
      last_name: tgUser.last_name ?? null,
      photo_url: tgUser.photo_url ?? null,
      last_login: new Date().toISOString(),
    }, { onConflict: 'telegram_id' });

    // Sign in with the just-set password to obtain a session
    const anon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({ email, password });
    if (signInErr || !signIn?.session) {
      throw signInErr ?? new Error('Не удалось получить сессию');
    }

    return new Response(JSON.stringify({
      success: true,
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
      user: {
        id: userId,
        telegram_id: telegramId,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        photo_url: tgUser.photo_url,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('telegram-miniapp-auth error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Ошибка аутентификации' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
