import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { order_id } = await req.json();
    if (!order_id || typeof order_id !== 'string') {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [{ data: orderRows }, { data: settings }] = await Promise.all([
      supabase.from('user_orders').select('id, order_number, tariff_code, price_usd, status, created_at, user_id, device_id').eq('id', order_id).maybeSingle(),
      supabase.from('payment_settings').select('key,value'),
    ]);

    const order: any = orderRows;
    if (!order) {
      return new Response(JSON.stringify({ error: 'order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const settingsMap = Object.fromEntries((settings || []).map((r: any) => [r.key, r.value ?? '']));
    const chatId = settingsMap.admin_telegram_chat_id;
    if (!chatId) {
      // chat_id ещё не настроен — не ошибка, просто молча выходим
      return new Response(JSON.stringify({ ok: true, skipped: 'no admin chat_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Получаем email пользователя, если есть
    let email = '';
    if (order.user_id) {
      const { data: u } = await supabase.auth.admin.getUserById(order.user_id);
      email = u.user?.email || '';
    }

    const created = new Date(order.created_at).toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const text =
      `🛒 <b>Новый заказ #${order.order_number}</b>\n` +
      `Тариф: <b>${order.tariff_code}</b>\n` +
      `Сумма: <b>$${order.price_usd}</b>\n` +
      `Клиент: ${email || `гость (${(order.device_id || '').slice(0, 8)})`}\n` +
      `Время: ${created} МСК\n\n` +
      `Откройте админ-панель для активации.`;

    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const tgData = await tg.json();
    if (!tg.ok || !tgData.ok) {
      console.error('Telegram error', tgData);
      return new Response(JSON.stringify({ error: 'telegram_failed', details: tgData }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
