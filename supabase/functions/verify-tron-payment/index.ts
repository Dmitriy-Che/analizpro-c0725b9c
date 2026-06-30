// Авто-сверка USDT-перевода (TRC20) на кошелёк продавца через TronGrid.
// Вызывается со страницы оплаты (поллинг каждые 15 сек, пока заказ 'new').
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USDT TRC20 contract
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.order_id || '');
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [{ data: order }, { data: settings }] = await Promise.all([
      supabase.from('user_orders').select('id, status, price_usd, created_at').eq('id', orderId).maybeSingle(),
      supabase.from('payment_settings').select('key,value'),
    ]);

    if (!order) {
      return new Response(JSON.stringify({ error: 'order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (order.status !== 'new') {
      return new Response(JSON.stringify({ ok: true, already: order.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const settingsMap = Object.fromEntries((settings || []).map((r: any) => [r.key, r.value ?? '']));
    const wallet = (settingsMap.wallet_address || '').trim();
    if (!wallet) {
      return new Response(JSON.stringify({ error: 'wallet_not_configured' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ищем USDT-переводы на кошелёк за последние 24 часа
    const since = Math.max(
      Date.now() - 24 * 3600 * 1000,
      new Date(order.created_at).getTime() - 5 * 60 * 1000,
    );
    const url =
      `https://api.trongrid.io/v1/accounts/${wallet}/transactions/trc20` +
      `?limit=50&only_to=true&contract_address=${USDT_CONTRACT}&min_timestamp=${since}`;

    const tgKey = Deno.env.get('TRONGRID_API_KEY');
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (tgKey) headers['TRON-PRO-API-KEY'] = tgKey;

    const tronRes = await fetch(url, { headers });
    if (!tronRes.ok) {
      const t = await tronRes.text();
      console.error('TronGrid error', tronRes.status, t);
      return new Response(JSON.stringify({ error: 'trongrid_failed', status: tronRes.status }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const tronData = await tronRes.json();
    const txs: any[] = tronData?.data || [];

    // Ищем перевод с суммой = price_usd (целое число USDT) и tx, ещё не использованный
    const expected = Number(order.price_usd);
    const expectedRaw = BigInt(Math.round(expected * 1_000_000)); // USDT = 6 знаков

    for (const tx of txs) {
      const valueRaw = BigInt(tx.value || '0');
      // Допускаем расхождение в 1 цент (1000 raw)
      const diff = valueRaw > expectedRaw ? valueRaw - expectedRaw : expectedRaw - valueRaw;
      if (diff > 10_000n) continue;
      if ((tx.to || '').toLowerCase() !== wallet.toLowerCase()) continue;

      const txHash = tx.transaction_id as string;
      // Проверяем, что этот хеш ещё не привязан к другому заказу
      const { data: existing } = await supabase
        .from('user_orders').select('id').eq('tx_hash', txHash).maybeSingle();
      if (existing && existing.id !== orderId) continue;

      const { data: marked } = await supabase.rpc('mark_order_paid_by_tron', {
        p_order_id: orderId,
        p_tx_hash: txHash,
      });
      if (marked) {
        // Telegram-уведомление админу (не блокируем)
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-admin-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ order_id: orderId }),
          });
        } catch (_) { /* ignore */ }

        return new Response(JSON.stringify({ ok: true, matched: true, tx_hash: txHash }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, matched: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
