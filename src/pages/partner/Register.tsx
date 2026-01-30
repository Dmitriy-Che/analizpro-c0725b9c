import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/new-logo.png';
import { Building2, Mail, Lock, Phone, MapPin, Loader2 } from 'lucide-react';

// Input validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phone);
};

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
    
    // Client-side validation
    if (!formData.email.trim()) {
      toast.error('Введите email');
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error('Неверный формат email');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    if (formData.password.length > 72) {
      toast.error('Пароль слишком длинный');
      return;
    }

    if (!formData.clinicName.trim() || formData.clinicName.trim().length < 2) {
      toast.error('Введите название клиники (минимум 2 символа)');
      return;
    }

    if (formData.contactPhone && !isValidPhone(formData.contactPhone)) {
      toast.error('Неверный формат телефона');
      return;
    }

    setLoading(true);

    try {
      // Call secure edge function for registration
      const { data, error } = await supabase.functions.invoke('register-partner', {
        body: {
          email: formData.email.trim(),
          password: formData.password,
          clinicName: formData.clinicName.trim(),
          contactPhone: formData.contactPhone.trim() || null,
          address: formData.address.trim() || null
        }
      });

      if (error) {
        console.error('Registration error:', error);
        toast.error('Ошибка регистрации. Попробуйте позже.');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Sign in the user after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        toast.success('Регистрация успешна! Войдите в систему.');
        navigate('/partner/login');
        return;
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
                maxLength={100}
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
                maxLength={255}
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
                maxLength={72}
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
                maxLength={72}
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
                maxLength={20}
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
                maxLength={200}
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
