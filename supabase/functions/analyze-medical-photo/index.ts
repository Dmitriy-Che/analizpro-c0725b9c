import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, age, gender } = await req.json();
    
    if (!imageBase64) {
      throw new Error('Не предоставлено изображение');
    }
    
    if (!age || !gender) {
      throw new Error('Не предоставлены возраст или пол пациента');
    }

    console.log('Начат анализ медицинского фото');

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
            content: `Ты - медицинский помощник. Анализируй фото анализа крови с учетом возраста и пола пациента.

ДАННЫЕ ПАЦИЕНТА:
Возраст: ${age} лет
Пол: ${gender === 'male' ? 'Мужской' : 'Женский'}

СТРОГО:
1. Используй референсные значения, соответствующие ВОЗРАСТУ и ПОЛУ пациента
2. Покажи ТОЛЬКО показатели с отклонениями от нормы для данного возраста и пола
3. НЕ пиши список нормальных показателей
4. НЕ пиши "в пределах нормы", "показатели в норме" и т.д.
5. Учитывай возрастные особенности при интерпретации результатов
6. ОБЯЗАТЕЛЬНО добавь раздел с рекомендациями по повторным анализам

ФОРМАТ:

Если ВСЕ в норме:
"Ваш результат анализа:
✅ Все показатели в норме для вашего возраста и пола!

📋 Повторные анализы:
Рекомендуется профилактическая проверка через 6-12 месяцев. Можно сдать общий анализ крови для контроля общего состояния здоровья."

Если есть отклонения:
"Ваш результат анализа:

⚠️ Обнаружены отклонения:

[Понятное название (расшифровка аббревиатуры)]: [значение] (норма для ${gender === 'male' ? 'мужчин' : 'женщин'} ${age} лет: [диапазон])
→ [Что это значит простыми словами в 1-2 предложениях, учитывая возраст и пол]

Рекомендация: [что делать с учетом возраста]
К врачу: [специалист]

📋 Повторные анализы:
Срок: [конкретный срок на основе тяжести отклонений: критичные - через 2-4 недели, незначительные - через 1-3 месяца]
Что сдать: [конкретный список показателей, которые нужно пересдать, с учетом обнаруженных отклонений]
Почему: [краткое объяснение, почему важно проконтролировать именно эти показатели в указанный срок]

⚠️ Это ознакомительная информация. Обратитесь к врачу для диагностики."

ЛОГИКА РЕКОМЕНДАЦИЙ ПО ПОВТОРНЫМ АНАЛИЗАМ:
- Критичные отклонения (>30% от нормы) → 2-4 недели, возможно расширенная панель анализов
- Умеренные отклонения (15-30% от нормы) → 1-2 месяца, те же показатели + смежные
- Незначительные отклонения (<15% от нормы) → 2-3 месяца, только отклоненные показатели
- Все в норме → 6-12 месяцев, профилактический общий анализ
- Учитывай возраст и пол при определении частоты контроля

ЗАПРЕЩЕНО:
- Перечислять нормальные показатели
- Писать "Показатели в пределах нормы:"
- Использовать медицинские термины без расшифровки
- Игнорировать возраст и пол при определении референсных значений
- Не указывать рекомендации по повторным анализам`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Проанализируй это медицинское фото анализа для пациента ${age} лет, пол: ${gender === 'male' ? 'мужской' : 'женский'}:`
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
