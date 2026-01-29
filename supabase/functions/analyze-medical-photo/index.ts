import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { imageBase64, age, gender, studyType, partner_id } = await req.json();
    
    if (!imageBase64) {
      throw new Error('Не предоставлено изображение');
    }
    
    if (!age || !gender) {
      throw new Error('Не предоставлены возраст или пол пациента');
    }

    if (!studyType) {
      throw new Error('Не указан тип исследования');
    }

    console.log(`Начат анализ медицинского исследования: ${studyType}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY не настроен');
    }

    // Вызов Lovable AI Gateway с моделью google/gemini-2.5-flash
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: studyType === 'lab' 
              ? `Ты - медицинский помощник. Анализируй фото лабораторного анализа с учетом возраста и пола пациента.

ДАННЫЕ ПАЦИЕНТА:
Возраст: ${age} лет
Пол: ${gender === 'male' ? 'Мужской' : 'Женский'}

СТРОГО:
1. Используй референсные значения, соответствующие ВОЗРАСТУ и ПОЛУ пациента
2. Покажи ТОЛЬКО показатели с отклонениями от нормы для данного возраста и пола
3. НЕ пиши список нормальных показателей
4. Учитывай возрастные особенности при интерпретации результатов

ФОРМАТ:

Если ВСЕ в норме:
"Ваш результат анализа:
✅ Все показатели в норме для вашего возраста и пола!

📋 Повторные анализы:
Рекомендуется профилактическая проверка через 6-12 месяцев."

Если есть отклонения - для КАЖДОГО показателя создай отдельный блок:

"Ваш результат анализа:

📊 Показатели, на которые стоит обратить внимание:

━━━━━━━━━━━━━━━━━━━━

[Показатель 1 - Понятное название (расшифровка)]: [значение]
Референсный диапазон для ${gender === 'male' ? 'мужчин' : 'женщин'} ${age} лет: [диапазон]

💡 Что это может означать:
[Спокойное объяснение конкретно для этого показателя: что он измеряет, почему может быть отклонение, насколько это распространено]

🔍 Рекомендации для этого показателя:
- [Какому специалисту показать]
- [Какие дополнительные исследования могут понадобиться]
- [Какие факторы могут влиять на этот показатель]

━━━━━━━━━━━━━━━━━━━━

[Повтори для каждого показателя с отклонением]

📋 Повторные анализы:
Срок: [конкретный срок]
Что сдать: [список показателей]
Почему: [объяснение]

ℹ️ Помните: отклонение показателя не всегда означает заболевание. Врач поможет разобраться в ситуации с учётом всех факторов вашего здоровья."

ЗАПРЕЩЕНО:
- Перечислять нормальные показатели
- Использовать медицинские термины без расшифровки
- Давать общие объяснения вместо конкретных для каждого показателя`
              : studyType === 'ultrasound'
              ? `Ты - медицинский помощник. Анализируй УЗИ снимок или текстовое заключение врача по УЗИ.

ДАННЫЕ ПАЦИЕНТА:
Возраст: ${age} лет
Пол: ${gender === 'male' ? 'Мужской' : 'Женский'}

ЗАДАЧА:
1. Если это СНИМОК УЗИ - проанализируй визуальные структуры, эхогенность, размеры органов
2. Если это ТЕКСТОВОЕ ЗАКЛЮЧЕНИЕ - прочитай текст и объясни простым языком, что означают медицинские термины
3. Учитывай возрастные и половые нормы

ФОРМАТ:

Если всё в норме:
"Результат УЗИ:
✅ По данным исследования патологических изменений не обнаружено. Все органы и структуры соответствуют возрастной норме.

📋 Контрольное обследование:
Рекомендуется профилактическое УЗИ через 12 месяцев."

Если есть особенности - для КАЖДОЙ находки создай отдельный блок:

"Результат УЗИ:

🔍 Обнаруженные особенности:

━━━━━━━━━━━━━━━━━━━━

Орган/область: [название]
Находка: [что обнаружено простым языком]

💡 Что это может означать:
[Спокойное объяснение: насколько это серьёзно, как часто встречается, возможные причины]

🔍 Рекомендации:
- К какому врачу обратиться: [специалист]
- Дополнительные обследования: [какие могут понадобиться]
- Срочность: [плановая консультация / в ближайшее время / срочно]

━━━━━━━━━━━━━━━━━━━━

[Повтори для каждой находки]

📋 Контрольное обследование:
Срок: [когда повторить УЗИ]
Что проверить: [какие органы/области]
Почему: [объяснение]

ℹ️ Помните: многие находки на УЗИ требуют наблюдения, но не всегда являются заболеванием. Врач оценит клиническую картину полностью."

ЗАПРЕЩЕНО:
- Использовать сложные медицинские термины без объяснения
- Пугать пациента
- Ставить диагнозы`
              : `Ты - медицинский помощник. Анализируй МРТ снимок или текстовое заключение врача по МРТ.

ДАННЫЕ ПАЦИЕНТА:
Возраст: ${age} лет
Пол: ${gender === 'male' ? 'Мужской' : 'Женский'}

ЗАДАЧА:
1. Если это СНИМОК МРТ - проанализируй визуализируемые структуры, сигналы, патологические изменения
2. Если это ТЕКСТОВОЕ ЗАКЛЮЧЕНИЕ - прочитай текст и объясни простым языком медицинские термины и выводы врача
3. Учитывай возрастные изменения (норма для данного возраста)

ФОРМАТ:

Если всё в норме:
"Результат МРТ:
✅ По данным исследования патологических изменений не выявлено. Все структуры соответствуют возрастной норме.

📋 Контрольное обследование:
Рекомендуется по показаниям или через 12-24 месяца."

Если есть особенности - для КАЖДОЙ находки создай отдельный блок:

"Результат МРТ:

🧲 Обнаруженные изменения:

━━━━━━━━━━━━━━━━━━━━

Область/структура: [название]
Изменение: [что обнаружено простым языком]
МР-характеристики: [объяснение сигналов и что они означают]

💡 Что это может означать:
[Спокойное объяснение: возможные причины, насколько серьёзно, типичность для данного возраста]

🔍 Рекомендации:
- К какому врачу: [специалист - невролог, нейрохирург, онколог и т.д.]
- Дополнительная диагностика: [какая может понадобиться]
- Срочность: [плановая / в течение недели / срочно]

━━━━━━━━━━━━━━━━━━━━

[Повтори для каждой находки]

📋 Контрольное обследование:
Срок: [когда повторить МРТ]
Область: [что контролировать]
Почему: [объяснение необходимости контроля]

ℹ️ Помните: МРТ очень чувствительный метод и может выявлять изменения, которые не всегда клинически значимы. Врач интерпретирует результаты в контексте вашего состояния."

ЗАПРЕЩЕНО:
- Использовать сложные медицинские термины без расшифровки
- Пугать пациента страшными диагнозами
- Делать окончательные выводы - только описывать и объяснять`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: studyType === 'lab' 
                  ? `Проанализируй это фото лабораторного анализа для пациента ${age} лет, пол: ${gender === 'male' ? 'мужской' : 'женский'}. Если на изображении есть текстовое заключение врача, также прочитай и объясни его:`
                  : studyType === 'ultrasound'
                  ? `Проанализируй этот снимок УЗИ или заключение врача по УЗИ для пациента ${age} лет, пол: ${gender === 'male' ? 'мужской' : 'женский'}. Если это текст - прочитай и объясни простым языком. Если это снимок - опиши видимые структуры и возможные изменения:`
                  : `Проанализируй этот снимок МРТ или заключение врача по МРТ для пациента ${age} лет, пол: ${gender === 'male' ? 'мужской' : 'женский'}. Если это текст - прочитай и объясни простым языком. Если это снимок - опиши видимые структуры и возможные изменения:`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка AI Gateway:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Превышен лимит запросов. Пожалуйста, попробуйте позже.' }), 
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Требуется пополнение кредитов Lovable AI.' }), 
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`Ошибка AI Gateway: ${response.status}`);
    }

    const data = await response.json();
    const analysisResult = data.choices[0].message.content;

    console.log('Анализ успешно завершен');

    // Determine status based on keywords
    let status = 'normal';
    const lowerResult = analysisResult.toLowerCase();
    
    if (
      lowerResult.includes('срочно') ||
      lowerResult.includes('критично') ||
      lowerResult.includes('немедленно') ||
      lowerResult.includes('опасно')
    ) {
      status = 'critical';
    } else if (
      lowerResult.includes('обратить внимание') ||
      lowerResult.includes('повышен') ||
      lowerResult.includes('понижен') ||
      lowerResult.includes('отклонение')
    ) {
      status = 'warning';
    }

    // Get city from IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const ipAddress = cfConnectingIp || forwardedFor?.split(',')[0]?.trim() || realIp || null;
    
    let city = null;
    if (ipAddress) {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,city`);
        const geoData = await geoResponse.json();
        if (geoData.status === 'success') {
          city = geoData.city || null;
        }
      } catch (geoError) {
        console.error('Geo lookup failed:', geoError);
      }
    }

    // Log the analysis to database using service role to bypass RLS
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseClient.from('analysis_logs').insert({
        age: age,
        gender: gender,
        status: status,
        city: city,
        partner_id: partner_id || null
      });
      
      console.log('Analysis logged successfully with city:', city);
    } catch (logError) {
      console.error('Failed to log analysis:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ result: analysisResult }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Ошибка в analyze-medical-photo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
