import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
const VALID_GENDERS = ['male', 'female'] as const;
const VALID_STUDY_TYPES = ['lab', 'ultrasound', 'mri'] as const;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in base64 characters
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidBase64Image(data: string): boolean {
  if (!data || typeof data !== 'string') return false;
  if (data.length > MAX_IMAGE_SIZE) return false;
  // Check for valid image data URL prefix
  return /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(data);
}

function isValidAge(age: unknown): age is number {
  if (typeof age !== 'number') return false;
  return Number.isInteger(age) && age >= 0 && age <= 150;
}

function isValidGender(gender: unknown): gender is typeof VALID_GENDERS[number] {
  return typeof gender === 'string' && VALID_GENDERS.includes(gender as typeof VALID_GENDERS[number]);
}

function isValidStudyType(studyType: unknown): studyType is typeof VALID_STUDY_TYPES[number] {
  return typeof studyType === 'string' && VALID_STUDY_TYPES.includes(studyType as typeof VALID_STUDY_TYPES[number]);
}

function isValidUUID(id: unknown): boolean {
  if (id === null || id === undefined) return true; // Optional field
  return typeof id === 'string' && UUID_REGEX.test(id);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Неверный формат запроса' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64, age, gender, studyType, partner_id } = body;
    
    // Validate imageBase64
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Не предоставлено изображение' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!isValidBase64Image(imageBase64)) {
      return new Response(
        JSON.stringify({ error: 'Неверный формат изображения. Поддерживаются JPEG, PNG, GIF, WebP до 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate age
    if (!isValidAge(age)) {
      return new Response(
        JSON.stringify({ error: 'Неверный возраст. Укажите целое число от 0 до 150.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate gender
    if (!isValidGender(gender)) {
      return new Response(
        JSON.stringify({ error: 'Неверный пол. Допустимые значения: male, female.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate studyType
    if (!isValidStudyType(studyType)) {
      return new Response(
        JSON.stringify({ error: 'Неверный тип исследования. Допустимые значения: lab, ultrasound, mri.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate partner_id (optional)
    if (!isValidUUID(partner_id)) {
      return new Response(
        JSON.stringify({ error: 'Неверный формат partner_id.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Начат анализ медицинского исследования: ${studyType}, возраст: ${age}, пол: ${gender}`);

    // Check partner subscription limit if partner_id is provided
    if (partner_id) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: subscription, error: subError } = await supabaseClient
        .from('partner_subscriptions')
        .select('analyses_used, analyses_limit, is_active')
        .eq('partner_id', partner_id)
        .eq('is_active', true)
        .single();

      if (subError || !subscription) {
        console.log('No active subscription found for partner:', partner_id);
        return new Response(
          JSON.stringify({ 
            error: 'У клиники нет активной подписки. Обратитесь к администратору для активации тарифа.' 
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (subscription.analyses_used >= subscription.analyses_limit) {
        console.log('Partner limit reached:', subscription.analyses_used, '/', subscription.analyses_limit);
        return new Response(
          JSON.stringify({ 
            error: 'Лимит расшифровок вашей клиники исчерпан. Обратитесь к администратору для продления подписки.' 
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Partner limit check passed:', subscription.analyses_used, '/', subscription.analyses_limit);
    }

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
        const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,city&lang=ru`);
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

      // Increment partner usage counter
      if (partner_id) {
        const { error: incrementError } = await supabaseClient.rpc('increment_partner_usage', {
          p_partner_id: partner_id
        });
        
        if (incrementError) {
          console.error('Failed to increment partner usage:', incrementError);
        } else {
          console.log('Partner usage incremented for:', partner_id);
        }
      }
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
    return new Response(
      JSON.stringify({ error: 'Произошла ошибка при обработке запроса. Попробуйте позже.' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
