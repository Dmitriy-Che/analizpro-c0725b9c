export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          content: string
          created_at: string
          html_code: string | null
          id: string
          is_active: boolean
          link: string | null
          page: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          html_code?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          page: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          html_code?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          page?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      analysis_counter: {
        Row: {
          count: number
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      analysis_logs: {
        Row: {
          age: number | null
          city: string | null
          created_at: string | null
          gender: string | null
          id: string
          partner_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          city?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          partner_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          city?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          partner_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_subscriptions: {
        Row: {
          activated_at: string
          activated_by: string | null
          analyses_limit: number
          analyses_used: number
          created_at: string
          id: string
          is_active: boolean
          partner_id: string
          plan_type: string
          price: number
          requested_plan: string | null
        }
        Insert: {
          activated_at?: string
          activated_by?: string | null
          analyses_limit?: number
          analyses_used?: number
          created_at?: string
          id?: string
          is_active?: boolean
          partner_id: string
          plan_type?: string
          price?: number
          requested_plan?: string | null
        }
        Update: {
          activated_at?: string
          activated_by?: string | null
          analyses_limit?: number
          analyses_used?: number
          created_at?: string
          id?: string
          is_active?: boolean
          partner_id?: string
          plan_type?: string
          price?: number
          requested_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscriptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscriptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          device_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          device_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          device_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          invitee_device_id: string
          invitee_ip: string | null
          invitee_user_id: string | null
          qualified_at: string | null
          referrer_code: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_device_id: string
          invitee_ip?: string | null
          invitee_user_id?: string | null
          qualified_at?: string | null
          referrer_code: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_device_id?: string
          invitee_ip?: string | null
          invitee_user_id?: string | null
          qualified_at?: string | null
          referrer_code?: string
          rewarded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          action: string
          admin_id: string | null
          analyses_limit: number
          created_at: string
          id: string
          partner_id: string
          plan_type: string
          price: number
        }
        Insert: {
          action: string
          admin_id?: string | null
          analyses_limit: number
          created_at?: string
          id?: string
          partner_id: string
          plan_type: string
          price: number
        }
        Update: {
          action?: string
          admin_id?: string | null
          analyses_limit?: number
          created_at?: string
          id?: string
          partner_id?: string
          plan_type?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tariffs: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          period_days: number | null
          price_usd: number
          reports_limit: number
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          period_days?: number | null
          price_usd?: number
          reports_limit?: number
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          period_days?: number | null
          price_usd?: number
          reports_limit?: number
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          photo_url: string | null
          telegram_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          photo_url?: string | null
          telegram_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          photo_url?: string | null
          telegram_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_analyses: {
        Row: {
          age: number | null
          created_at: string | null
          device_id: string | null
          entitlement_id: string | null
          expires_at: string
          full_result: string | null
          gender: string | null
          id: string
          language_detected: string | null
          result_json: Json | null
          result_summary: string | null
          study_type: string | null
          telegram_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          device_id?: string | null
          entitlement_id?: string | null
          expires_at?: string
          full_result?: string | null
          gender?: string | null
          id?: string
          language_detected?: string | null
          result_json?: Json | null
          result_summary?: string | null
          study_type?: string | null
          telegram_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          device_id?: string | null
          entitlement_id?: string | null
          expires_at?: string
          full_result?: string | null
          gender?: string | null
          id?: string
          language_detected?: string | null
          result_json?: Json | null
          result_summary?: string | null
          study_type?: string | null
          telegram_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_analyses_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "user_entitlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_analyses_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          created_at: string
          device_id: string | null
          expires_at: string | null
          id: string
          order_id: string | null
          reports_total: number
          reports_used: number
          source: string
          tariff_code: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          reports_total: number
          reports_used?: number
          source: string
          tariff_code?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          reports_total?: number
          reports_used?: number
          source?: string
          tariff_code?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_entitlements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "user_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entitlements_tariff_code_fkey"
            columns: ["tariff_code"]
            isOneToOne: false
            referencedRelation: "tariffs"
            referencedColumns: ["code"]
          },
        ]
      }
      user_orders: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          notes: string | null
          order_number: number
          paid_at: string | null
          price_usd: number
          processed_at: string | null
          status: string
          tariff_code: string
          tx_hash: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          price_usd: number
          processed_at?: string | null
          status?: string
          tariff_code: string
          tx_hash?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          price_usd?: number
          processed_at?: string | null
          status?: string
          tariff_code?: string
          tx_hash?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_orders_tariff_code_fkey"
            columns: ["tariff_code"]
            isOneToOne: false
            referencedRelation: "tariffs"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          partner_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          partner_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      partners_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_change_order_tariff: {
        Args: { p_order_id: string; p_tariff_code: string }
        Returns: undefined
      }
      admin_delete_order: { Args: { p_order_id: string }; Returns: undefined }
      admin_delete_referral: {
        Args: { p_referral_id: string }
        Returns: undefined
      }
      admin_list_orders: {
        Args: never
        Returns: {
          created_at: string
          device_id: string
          effective_status: string
          expires_at: string
          id: string
          order_number: number
          paid_at: string
          price_usd: number
          processed_at: string
          reports_left: number
          reports_total: number
          reports_used: number
          status: string
          tariff_code: string
          tariff_title: string
          user_email: string
          user_id: string
        }[]
      }
      admin_list_referrals: {
        Args: never
        Returns: {
          created_at: string
          id: string
          invitee_analyses_count: number
          invitee_device_id: string
          invitee_email: string
          invitee_ip: string
          invitee_user_id: string
          qualified_at: string
          referrer_code: string
          referrer_device_id: string
          referrer_email: string
          referrer_user_id: string
          rewarded_at: string
          status: string
        }[]
      }
      admin_process_order: { Args: { p_order_id: string }; Returns: string }
      admin_referral_stats: {
        Args: never
        Returns: {
          conversion_pct: number
          flagged: number
          qualified: number
          rewarded: number
          top_referrers: Json
          total_invites: number
        }[]
      }
      admin_set_referral_status: {
        Args: { p_referral_id: string; p_status: string }
        Returns: undefined
      }
      check_partner_limit: { Args: { p_partner_id: string }; Returns: boolean }
      claim_guest_data: { Args: { p_device_id: string }; Returns: undefined }
      consume_entitlement: {
        Args: { p_device_id: string; p_user_id: string }
        Returns: string
      }
      create_order: {
        Args: { p_device_id: string; p_tariff_code: string }
        Returns: string
      }
      get_analysis_stats: {
        Args: never
        Returns: {
          avg_age: number
          critical_count: number
          female_count: number
          male_count: number
          normal_count: number
          today_analyses: number
          top_cities: Json
          total_analyses: number
          total_visits: number
          visits_last_30_days: number
          warning_count: number
        }[]
      }
      get_my_entitlements: {
        Args: { p_device_id: string }
        Returns: {
          expires_at: string
          id: string
          reports_total: number
          reports_used: number
          source: string
          tariff_code: string
        }[]
      }
      get_my_order: {
        Args: { p_device_id: string; p_order_id: string }
        Returns: {
          created_at: string
          id: string
          paid_at: string
          price_usd: number
          status: string
          tariff_code: string
        }[]
      }
      get_my_referral_stats: { Args: { p_device_id: string }; Returns: Json }
      get_my_reports: {
        Args: { p_device_id: string }
        Returns: {
          age: number
          created_at: string
          expires_at: string
          full_result: string
          gender: string
          id: string
          language_detected: string
          order_number: number
          result_json: Json
          study_type: string
          tariff_code: string
          tariff_title: string
          title: string
        }[]
      }
      get_or_create_referral_code: {
        Args: { p_device_id: string }
        Returns: string
      }
      get_partner_stats: {
        Args: { p_partner_id: string }
        Returns: {
          avg_age: number
          critical_count: number
          female_count: number
          male_count: number
          normal_count: number
          today_analyses: number
          top_cities: Json
          total_analyses: number
          total_visits: number
          visits_last_30_days: number
          warning_count: number
        }[]
      }
      get_partner_subscription: {
        Args: { p_partner_id: string }
        Returns: {
          activated_at: string
          analyses_limit: number
          analyses_used: number
          is_active: boolean
          plan_type: string
          price: number
          requested_plan: string
        }[]
      }
      get_partner_visits_by_day: {
        Args: { p_partner_id: string }
        Returns: {
          visit_count: number
          visit_date: string
        }[]
      }
      get_public_payment_settings: {
        Args: never
        Returns: {
          key: string
          value: string
        }[]
      }
      get_visits_by_day: {
        Args: never
        Returns: {
          visit_count: number
          visit_date: string
        }[]
      }
      grant_free_trial: {
        Args: { p_device_id: string; p_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_analysis_counter: { Args: never; Returns: number }
      increment_partner_usage: {
        Args: { p_partner_id: string }
        Returns: undefined
      }
      mark_order_paid_by_tron: {
        Args: { p_order_id: string; p_tx_hash: string }
        Returns: boolean
      }
      mark_order_paid_by_user: {
        Args: { p_device_id: string; p_order_id: string }
        Returns: undefined
      }
      purge_expired_reports: { Args: never; Returns: number }
      qualify_referral: {
        Args: { p_device_id: string; p_user_id?: string }
        Returns: Json
      }
      register_referral: {
        Args: { p_device_id: string; p_ip?: string; p_ref_code: string }
        Returns: Json
      }
      request_subscription_plan: {
        Args: { p_plan: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "partner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "partner"],
    },
  },
} as const
