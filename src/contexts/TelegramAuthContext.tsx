import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TelegramUser {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

interface UserAnalysis {
  id: string;
  created_at: string;
  study_type: string;
  age: number;
  gender: string;
  result_summary: string;
  full_result: string;
}

interface TelegramAuthContextType {
  user: TelegramUser | null;
  recentAnalyses: UserAnalysis[];
  isLoading: boolean;
  isMiniApp: boolean;
  isAuthenticated: boolean;
  login: (widgetData: Record<string, string>) => Promise<void>;
  loginWithMiniApp: () => Promise<void>;
  logout: () => void;
  refreshAnalyses: () => Promise<void>;
}

const TelegramAuthContext = createContext<TelegramAuthContextType | undefined>(undefined);

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export function TelegramAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<UserAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMiniApp, setIsMiniApp] = useState(false);

  // Check if running in Telegram Mini App
  useEffect(() => {
    const checkMiniApp = () => {
      if (window.Telegram?.WebApp?.initData) {
        setIsMiniApp(true);
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        return true;
      }
      return false;
    };

    // Check immediately and after a small delay (for script loading)
    if (!checkMiniApp()) {
      setTimeout(checkMiniApp, 500);
    }
  }, []);

  // Try to restore session from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('telegram_user');
    const storedAnalyses = localStorage.getItem('recent_analyses');
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        if (storedAnalyses) {
          setRecentAnalyses(JSON.parse(storedAnalyses));
        }
      } catch {
        localStorage.removeItem('telegram_user');
        localStorage.removeItem('recent_analyses');
      }
    }
    setIsLoading(false);
  }, []);

  // Auto-login for Mini App
  useEffect(() => {
    if (isMiniApp && !user && window.Telegram?.WebApp?.initData) {
      loginWithMiniApp();
    }
  }, [isMiniApp, user]);

  const loginWithMiniApp = useCallback(async () => {
    if (!window.Telegram?.WebApp?.initData) {
      console.error('Not in Telegram Mini App');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: {
          initData: window.Telegram.WebApp.initData,
          isMiniApp: true,
        },
      });

      if (error) throw error;

      if (data.success && data.user) {
        setUser(data.user);
        setRecentAnalyses(data.recentAnalyses || []);
        localStorage.setItem('telegram_user', JSON.stringify(data.user));
        localStorage.setItem('recent_analyses', JSON.stringify(data.recentAnalyses || []));
      }
    } catch (error) {
      console.error('Mini App login error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (widgetData: Record<string, string>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: {
          widgetData,
          isMiniApp: false,
        },
      });

      if (error) throw error;

      if (data.success && data.user) {
        setUser(data.user);
        setRecentAnalyses(data.recentAnalyses || []);
        localStorage.setItem('telegram_user', JSON.stringify(data.user));
        localStorage.setItem('recent_analyses', JSON.stringify(data.recentAnalyses || []));
      }
    } catch (error) {
      console.error('Widget login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setRecentAnalyses([]);
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('recent_analyses');
  }, []);

  const refreshAnalyses = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_analyses')
        .select('*')
        .eq('telegram_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) {
        setRecentAnalyses(data as UserAnalysis[]);
        localStorage.setItem('recent_analyses', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to refresh analyses:', error);
    }
  }, [user]);

  return (
    <TelegramAuthContext.Provider
      value={{
        user,
        recentAnalyses,
        isLoading,
        isMiniApp,
        isAuthenticated: !!user,
        login,
        loginWithMiniApp,
        logout,
        refreshAnalyses,
      }}
    >
      {children}
    </TelegramAuthContext.Provider>
  );
}

export function useTelegramAuth() {
  const context = useContext(TelegramAuthContext);
  if (context === undefined) {
    throw new Error('useTelegramAuth must be used within a TelegramAuthProvider');
  }
  return context;
}
