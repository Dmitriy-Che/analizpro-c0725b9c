ALTER TABLE public.telegram_users
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS telegram_users_user_id_idx ON public.telegram_users(user_id);