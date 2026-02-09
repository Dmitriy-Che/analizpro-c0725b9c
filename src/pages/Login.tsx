import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Mail, LogIn } from "lucide-react";
import medicalLogo from "@/assets/new-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Заполните все поля");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Регистрация выполнена! Войдите в систему");
        setIsSignUp(false);
        setPassword("");
      }
    } catch (error: any) {
      console.error("SignUp error:", error);
      toast.error(error.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Заполните все поля");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user is admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .single();

        if (roles) {
          toast.success("Вход выполнен успешно");
          navigate("/admin");
        } else {
          await supabase.auth.signOut();
          toast.error("У вас нет прав администратора");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center py-6 px-4">
      <Card className="w-full max-w-md p-8 rounded-3xl shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={medicalLogo}
            alt="Medical Logo"
            className="w-16 h-16 rounded-full shadow-md object-contain"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-primary mb-2">
            {isSignUp ? "Регистрация администратора" : "Вход для администратора"}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Создайте аккаунт администратора" : "Войдите для доступа к админ-панели"}
          </p>
        </div>

        {/* Login/SignUp Form */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-2 text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="pl-12 py-6 text-base"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-bold mb-2 text-foreground">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-12 py-6 text-base"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-bold text-lg py-6 rounded-2xl shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Вход...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                {isSignUp ? "Зарегистрироваться" : "Войти"}
              </span>
            )}
          </Button>

          {/* Toggle Sign Up / Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword("");
              }}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
            </button>
          </div>

          {/* Back to Home */}
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Вернуться на главную
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
