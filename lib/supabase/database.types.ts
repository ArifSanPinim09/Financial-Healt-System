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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_profile: {
        Row: {
          branch_name: string | null
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          branch_name?: string | null
          created_at?: string | null
          id: string
          role?: string
        }
        Update: {
          branch_name?: string | null
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      cs_contact: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean
          prefill_message: string | null
          wa_number: string
        }
        Insert: {
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean
          prefill_message?: string | null
          wa_number: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          prefill_message?: string | null
          wa_number?: string
        }
        Relationships: []
      }
      cs_rotation_state: {
        Row: {
          id: number
          last_used_index: number
          updated_at: string | null
        }
        Insert: {
          id?: number
          last_used_index?: number
          updated_at?: string | null
        }
        Update: {
          id?: number
          last_used_index?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      dimension_result: {
        Row: {
          contribution: number
          created_at: string | null
          dimension: string
          id: string
          raw_score: number
          status: string
          submission_id: string
        }
        Insert: {
          contribution: number
          created_at?: string | null
          dimension: string
          id?: string
          raw_score: number
          status: string
          submission_id: string
        }
        Update: {
          contribution?: number
          created_at?: string | null
          dimension?: string
          id?: string
          raw_score?: number
          status?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dimension_result_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submission"
            referencedColumns: ["submission_id"]
          },
        ]
      }
      question_bank: {
        Row: {
          assessment_type: string
          created_at: string | null
          dimension: string | null
          is_scoring: boolean
          order_index: number
          question_id: string
          question_text: string
        }
        Insert: {
          assessment_type: string
          created_at?: string | null
          dimension?: string | null
          is_scoring?: boolean
          order_index: number
          question_id: string
          question_text: string
        }
        Update: {
          assessment_type?: string
          created_at?: string | null
          dimension?: string | null
          is_scoring?: boolean
          order_index?: number
          question_id?: string
          question_text?: string
        }
        Relationships: []
      }
      question_option: {
        Row: {
          created_at: string | null
          option_detail: string | null
          option_id: string
          option_text: string
          order_index: number
          question_id: string
          score_kkb: number | null
          score_kpr: number | null
          score_ksm: number | null
          score_rating: number | null
        }
        Insert: {
          created_at?: string | null
          option_detail?: string | null
          option_id: string
          option_text: string
          order_index?: number
          question_id: string
          score_kkb?: number | null
          score_kpr?: number | null
          score_ksm?: number | null
          score_rating?: number | null
        }
        Update: {
          created_at?: string | null
          option_detail?: string | null
          option_id?: string
          option_text?: string
          order_index?: number
          question_id?: string
          score_kkb?: number | null
          score_kpr?: number | null
          score_ksm?: number | null
          score_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_option_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["question_id"]
          },
        ]
      }
      submission: {
        Row: {
          assessment_type: string
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          final_score: number | null
          financial_goal: string | null
          financial_need: string | null
          kkb_score: number | null
          kpr_score: number | null
          ksm_gate: boolean | null
          ksm_score: number | null
          persona: string | null
          primary_recommendation: string
          readiness: string | null
          recommendation_confidence: string
          secondary_recommendation: string | null
          submission_id: string
          submitted_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assessment_type: string
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          final_score?: number | null
          financial_goal?: string | null
          financial_need?: string | null
          kkb_score?: number | null
          kpr_score?: number | null
          ksm_gate?: boolean | null
          ksm_score?: number | null
          persona?: string | null
          primary_recommendation: string
          readiness?: string | null
          recommendation_confidence: string
          secondary_recommendation?: string | null
          submission_id?: string
          submitted_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assessment_type?: string
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          final_score?: number | null
          financial_goal?: string | null
          financial_need?: string | null
          kkb_score?: number | null
          kpr_score?: number | null
          ksm_gate?: boolean | null
          ksm_score?: number | null
          persona?: string | null
          primary_recommendation?: string
          readiness?: string | null
          recommendation_confidence?: string
          secondary_recommendation?: string | null
          submission_id?: string
          submitted_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      submission_answer: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          question_id: string
          submission_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          question_id: string
          submission_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          question_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_answer_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "question_option"
            referencedColumns: ["option_id"]
          },
          {
            foreignKeyName: "submission_answer_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "submission_answer_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submission"
            referencedColumns: ["submission_id"]
          },
        ]
      }
      submission_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          submission_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          submission_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          submission_id: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_cs: {
        Args: never
        Returns: {
          id: string
          prefill_message: string
          wa_number: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
