import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/hooks/usePartner';
import logo from '@/assets/new-logo.png';
import { Building2, Mail, Lock, Phone, MapPin, Loader2 } from 'lucide-react';

export default function PartnerRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    clinicName: '',
    contactPhone: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    if (!formData.clinicName.trim()) {
      toast.error('Введите название клиники');
      return;
    }

    setLoading(true);

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/partner/dashboard`
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Этот email уже зарегистрирован');
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Ошибка создания аккаунта');
        return;
      }

      // 2. Generate unique slug
      let slug = generateSlug(formData.clinicName);
      
      // Check if slug exists and make it unique
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (existingPartner) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      // 3. Create partner record
      const { error: partnerError } = await supabase.from('partners').insert({
        user_id: authData.user.id,
        name: formData.clinicName.trim(),
        slug: slug,
        contact_email: formData.email,
        contact_phone: formData.contactPhone || null,
        address: formData.address || null
      });

      if (partnerError) {
        console.error('Partner creation error:', partnerError);
        toast.error('Ошибка создания профиля клиники');
        return;
      }

      // 4. Assign partner role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'partner'
      });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        // Don't fail registration for role error
      }

      toast.success('Регистрация успешна! Добро пожаловать!');
      navigate('/partner/dashboard');

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Ошибка регистрации. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="АнализПро" className="w-20 h-20 mx-auto rounded-full shadow-lg" />
          </Link>
          <h1 className="text-2xl font-bold mt-4">Регистрация клиники</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Станьте партнёром АнализПро
          </p>
        </div>

        <Card className="p-6 border-2 border-border/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Clinic Name */}
            <div className="space-y-2">
              <Label htmlFor="clinicName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Название клиники *
              </Label>
              <Input
                id="clinicName"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                placeholder="Медицинский центр 'Здоровье'"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="clinic@example.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Пароль *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Минимум 6 символов"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Подтвердите пароль *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Повторите пароль"
                required
              />
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Телефон
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            {/* Address (optional) */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Адрес
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="г. Москва, ул. Примерная, д. 1"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Регистрация...
                </>
              ) : (
                'Зарегистрироваться'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Уже есть аккаунт? </span>
            <Link to="/partner/login" className="text-primary hover:underline font-medium">
              Войти
            </Link>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Регистрируясь, вы соглашаетесь с условиями использования сервиса
        </p>
      </div>
    </div>
  );
}
