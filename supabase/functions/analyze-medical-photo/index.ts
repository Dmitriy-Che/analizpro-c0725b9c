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

    const { imageBase64, age, gender, studyType, partner_id, user_id, device_id } = body;
    
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

    // B2C entitlement consumption (when no partner)
    let entitlementId: string | null = null;
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    if (!partner_id) {
      if (!user_id && !device_id) {
        return new Response(
          JSON.stringify({ error: 'Не указан идентификатор пользователя.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const { data: entData, error: entErr } = await supabaseAdmin.rpc('consume_entitlement', {
        p_user_id: user_id || null,
        p_device_id: device_id || null,
      });
      if (entErr) {
        console.error('consume_entitlement error', entErr);
        return new Response(
          JSON.stringify({ error: 'Ошибка проверки прав. Попробуйте позже.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!entData) {
        return new Response(
          JSON.stringify({ error: 'Нет доступных расшифровок. Выберите тариф или активируйте бесплатную расшифровку.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      entitlementId = entData as string;
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
            content: `Ты - медицинский помощник для русских экспатов. Анализируй медицинские исследования и возвращай результат в формате JSON.

ВАЖНО ПО ЯЗЫКАМ:
- Документ может быть на одном из 4 языков: английском (en), вьетнамском (vi), тайском (th) или русском (ru).
- Автоматически определи язык документа.
- Все названия показателей, объяснения, рекомендации и описания ВСЕГДА возвращай НА РУССКОМ ЯЗЫКЕ — независимо от языка исходного документа.
- В поле "language_detected" верни код языка документа: "en", "vi", "th", "ru" или "other".

ДАННЫЕ ПАЦИЕНТА:
Возраст: ${age} лет
Пол: ${gender === 'male' ? 'Мужской' : 'Женский'}
Тип исследования: ${studyType === 'lab' ? 'Лабораторные анализы' : studyType === 'ultrasound' ? 'УЗИ' : 'МРТ'}

КРИТИЧЕСКИ ВАЖНО - ВЕРНИ ТОЛЬКО JSON БЕЗ MARKDOWN:
Не используй \`\`\`json или любые другие markdown-теги. Верни чистый JSON.

ФОРМАТ ОТВЕТА (JSON):
{
  "overall_status": "normal" | "warning" | "critical",
  "summary": "Краткое описание результатов (1-2 предложения)",
  "normal_count": число показателей в норме,
  "abnormal_count": число показателей с отклонениями,
  "indicators": [
    {
      "name": "Название показателя понятным языком",
      "value": число или "текст",
      "unit": "единица измерения",
      "reference_min": число (опционально),
      "reference_max": число (опционально),
      "reference_text": "Текстовый референс если нет чисел",
      "status": "normal" | "low" | "high" | "critical_low" | "critical_high",
      "explanation": "Простое объяснение что это значит и почему важно (2-3 предложения)",
      "recommendation": "Конкретная рекомендация что делать (1-2 предложения)",
      "specialist": "К какому врачу обратиться"
    }
  ],
  "general_recommendations": "Общие рекомендации по результатам",
  "follow_up": "Когда повторить исследование",
  "language_detected": "en" | "vi" | "th" | "ru" | "other"
}

ПРАВИЛА:
1. В массив indicators включай ТОЛЬКО показатели с отклонениями (status НЕ "normal")
2. Если ВСЁ в норме - indicators должен быть пустым массивом []
3. normal_count - общее количество показателей в норме
4. abnormal_count - количество показателей с отклонениями
5. overall_status: "normal" если всё в норме, "warning" если есть небольшие отклонения, "critical" если есть серьёзные отклонения
6. Используй референсные значения для возраста ${age} лет и пола ${gender === 'male' ? 'мужского' : 'женского'}
7. Объяснения пиши ПРОСТЫМ языком, понятным обычному человеку
8. НЕ пугай пациента, но будь честен об отклонениях

${studyType === 'lab' ? `
ДЛЯ ЛАБОРАТОРНЫХ АНАЛИЗОВ:
- Указывай точные числовые значения и референсы
- Объясняй каждый показатель: за что отвечает, почему может быть отклонение
- Рекомендуй конкретных специалистов
` : studyType === 'ultrasound' ? `
ДЛЯ УЗИ:
- Если это снимок - опиши видимые структуры
- Если это заключение врача - объясни термины простым языком
- Каждую находку оформи как отдельный "показатель" в indicators
- Для status используй: normal (норма), low (требует наблюдения), high (требует консультации), critical_high (срочно к врачу)
` : `
ДЛЯ МРТ:
- Если это снимок - опиши видимые структуры и изменения
- Если это заключение врача - объясни термины простым языком
- Каждую находку оформи как отдельный "показатель" в indicators
- Для status используй: normal (норма), low (требует наблюдения), high (требует консультации), critical_high (срочно к врачу)
`}

ЗАПРЕЩЕНО:
- Использовать markdown форматирование
- Возвращать что-либо кроме JSON
- Ставить диагнозы
- Пугать пациента`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Проанализируй это изображение ${studyType === 'lab' ? 'лабораторного анализа' : studyType === 'ultrasound' ? 'УЗИ' : 'МРТ'} для пациента ${age} лет, пол: ${gender === 'male' ? 'мужской' : 'женский'}. Верни результат в формате JSON.`
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

      // Save B2C analysis report to user_analyses
      if (!partner_id && (user_id || device_id)) {
        let parsed: any = null;
        let langDetected: string | null = null;
        try {
          parsed = JSON.parse(analysisResult);
          langDetected = parsed?.language_detected ?? null;
        } catch {}

        const { error: saveErr } = await supabaseClient.from('user_analyses').insert({
          user_id: user_id || null,
          device_id: device_id || null,
          entitlement_id: entitlementId,
          age: age,
          gender: gender,
          study_type: studyType,
          language_detected: langDetected,
          result_json: parsed,
          full_result: analysisResult,
          title: studyType === 'lab' ? 'Лабораторные анализы' : studyType === 'ultrasound' ? 'УЗИ' : 'МРТ',
        });
        if (saveErr) console.error('Failed to save user_analyses', saveErr);
      }
    } catch (logError) {
      console.error('Failed to log analysis:', logError);
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
