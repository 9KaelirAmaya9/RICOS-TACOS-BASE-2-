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
      branding_settings: {
        Row: {
          accent_color: string
          address: string
          company_name: string
          created_at: string | null
          email: string
          id: string
          location: string
          phone: string
          primary_color: string
          secondary_color: string
          tagline: string
          updated_at: string | null
          website: string
        }
        Insert: {
          accent_color?: string
          address?: string
          company_name?: string
          created_at?: string | null
          email?: string
          id?: string
          location?: string
          phone?: string
          primary_color?: string
          secondary_color?: string
          tagline?: string
          updated_at?: string | null
          website?: string
        }
        Update: {
          accent_color?: string
          address?: string
          company_name?: string
          created_at?: string | null
          email?: string
          id?: string
          location?: string
          phone?: string
          primary_color?: string
          secondary_color?: string
          tagline?: string
          updated_at?: string | null
          website?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          company_name: string | null
          contact_name: string
          created_at: string | null
          email: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string | null
          email: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string | null
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_history: {
        Row: {
          change_type: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_value: string | null
          notes: string | null
          old_value: string | null
          order_id: string
        }
        Insert: {
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          order_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agreement_pdf_url: string | null
          agreement_signed: boolean | null
          agreement_signed_by: string | null
          agreement_signed_date: string | null
          agreement_signed_pdf_url: string | null
          amount_paid: number | null
          client_id: string | null
          completion_date: string | null
          created_at: string | null
          customer_address: string | null
          customer_deposit: number | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          estimated_cost: number | null
          final_cost: number | null
          id: string
          invoice_number: string
          invoice_pdf_url: string | null
          labor_hours: number | null
          labor_rate: number | null
          notes: string | null
          order_status: Database["public"]["Enums"]["order_status"] | null
          parts_needed: string | null
          parts_total: number | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pdf_url: string | null
          reference_number: string | null
          scheduled_date: string | null
          service_type: string
          signature_data: string | null
          technician_name: string | null
          updated_at: string | null
          vehicle_color: string | null
          vehicle_license_plate: string | null
          vehicle_make: string | null
          vehicle_mileage: number | null
          vehicle_model: string | null
          vehicle_vin: string | null
          vehicle_year: string | null
        }
        Insert: {
          agreement_pdf_url?: string | null
          agreement_signed?: boolean | null
          agreement_signed_by?: string | null
          agreement_signed_date?: string | null
          agreement_signed_pdf_url?: string | null
          amount_paid?: number | null
          client_id?: string | null
          completion_date?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_deposit?: number | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          invoice_number: string
          invoice_pdf_url?: string | null
          labor_hours?: number | null
          labor_rate?: number | null
          notes?: string | null
          order_status?: Database["public"]["Enums"]["order_status"] | null
          parts_needed?: string | null
          parts_total?: number | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pdf_url?: string | null
          reference_number?: string | null
          scheduled_date?: string | null
          service_type: string
          signature_data?: string | null
          technician_name?: string | null
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_license_plate?: string | null
          vehicle_make?: string | null
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_vin?: string | null
          vehicle_year?: string | null
        }
        Update: {
          agreement_pdf_url?: string | null
          agreement_signed?: boolean | null
          agreement_signed_by?: string | null
          agreement_signed_date?: string | null
          agreement_signed_pdf_url?: string | null
          amount_paid?: number | null
          client_id?: string | null
          completion_date?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_deposit?: number | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          labor_hours?: number | null
          labor_rate?: number | null
          notes?: string | null
          order_status?: Database["public"]["Enums"]["order_status"] | null
          parts_needed?: string | null
          parts_total?: number | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pdf_url?: string | null
          reference_number?: string | null
          scheduled_date?: string | null
          service_type?: string
          signature_data?: string | null
          technician_name?: string | null
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_license_plate?: string | null
          vehicle_make?: string | null
          vehicle_mileage?: number | null
          vehicle_model?: string | null
          vehicle_vin?: string | null
          vehicle_year?: string | null
        }
        Relationships: []
      }
      service_agreements: {
        Row: {
          agreement_text: string
          client_signature: string | null
          created_at: string | null
          id: string
          order_id: string
          pdf_url: string | null
          signature_url: string | null
          signed_at: string | null
        }
        Insert: {
          agreement_text: string
          client_signature?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          pdf_url?: string | null
          signature_url?: string | null
          signed_at?: string | null
        }
        Update: {
          agreement_text?: string
          client_signature?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          pdf_url?: string | null
          signature_url?: string | null
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_agreements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
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
      work_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          labor_cost: number | null
          notes: string | null
          parts_cost: number | null
          pdf_url: string | null
          services_requested: string[] | null
          status: string | null
          total_cost: number | null
          updated_at: string | null
          vehicle_color: string | null
          vehicle_license_plate: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_vin: string | null
          vehicle_year: string | null
          work_order_number: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          labor_cost?: number | null
          notes?: string | null
          parts_cost?: number | null
          pdf_url?: string | null
          services_requested?: string[] | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_license_plate?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_vin?: string | null
          vehicle_year?: string | null
          work_order_number: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          labor_cost?: number | null
          notes?: string | null
          parts_cost?: number | null
          pdf_url?: string | null
          services_requested?: string[] | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_license_plate?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_vin?: string | null
          vehicle_year?: string | null
          work_order_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      generate_work_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_status: "unpaid" | "partial" | "paid" | "refunded"
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
      app_role: ["admin", "user"],
      order_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_status: ["unpaid", "partial", "paid", "refunded"],
    },
  },
} as const
