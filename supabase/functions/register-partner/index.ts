import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

function sanitizeString(str: string, maxLength: number): string {
  return str.trim().substring(0, maxLength);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^а-яa-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, password, clinicName, contactPhone, address } = body;

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email обязателен' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Неверный формат email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Пароль должен быть не менее 6 символов' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length > 72) {
      return new Response(
        JSON.stringify({ error: 'Пароль слишком длинный' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!clinicName || typeof clinicName !== 'string' || clinicName.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Название клиники обязательно (минимум 2 символа)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (contactPhone && !isValidPhone(contactPhone)) {
      return new Response(
        JSON.stringify({ error: 'Неверный формат телефона' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedClinicName = sanitizeString(clinicName, 100);
    const sanitizedAddress = address ? sanitizeString(address, 200) : null;
    const sanitizedPhone = contactPhone ? sanitizeString(contactPhone, 20) : null;

    console.log(`Partner registration attempt: ${email}, clinic: ${sanitizedClinicName}`);

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Create user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm for smoother onboarding
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message.includes('already')) {
        return new Response(
          JSON.stringify({ error: 'Этот email уже зарегистрирован' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Ошибка создания аккаунта' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Ошибка создания пользователя' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    // 2. Generate unique slug
    let slug = generateSlug(sanitizedClinicName);
    
    // Check if slug exists and make it unique
    const { data: existingPartner } = await supabaseAdmin
      .from('partners')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingPartner) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 3. Create partner record
    const { error: partnerError } = await supabaseAdmin.from('partners').insert({
      user_id: userId,
      name: sanitizedClinicName,
      slug: slug,
      contact_email: email,
      contact_phone: sanitizedPhone,
      address: sanitizedAddress
    });

    if (partnerError) {
      console.error('Partner creation error:', partnerError);
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Ошибка создания профиля клиники' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3.5. Create trial subscription (10 free analyses)
    const { error: subError } = await supabaseAdmin.from('partner_subscriptions').insert({
      partner_id: partnerId,
      plan_type: 'trial',
      analyses_limit: 10,
      analyses_used: 0,
      price: 0,
      is_active: true
    });

    if (subError) {
      console.error('Trial subscription creation error:', subError);
      // Don't fail registration, but log
    }

    // 4. Assign partner role (server-side, secure)
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: userId,
      role: 'partner'
    });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Don't fail registration, but log the error
    }

    console.log(`Partner registered successfully: ${email}, slug: ${slug}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Регистрация успешна',
        slug: slug 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка регистрации. Попробуйте позже.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
