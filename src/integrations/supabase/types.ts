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
      accounting_entries: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_date: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          barcode: string | null
          buy_price: number
          category: string
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          min_stock: number
          name: string
          reserved_stock: number
          sell_price: number
          sku: string
          status: string | null
          stock: number
          type: string
          unit: string
          updated_at: string | null
          wholesale_price: number | null
        }
        Insert: {
          barcode?: string | null
          buy_price?: number
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          min_stock?: number
          name: string
          reserved_stock?: number
          sell_price?: number
          sku: string
          status?: string | null
          stock?: number
          type: string
          unit: string
          updated_at?: string | null
          wholesale_price?: number | null
        }
        Update: {
          barcode?: string | null
          buy_price?: number
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          min_stock?: number
          name?: string
          reserved_stock?: number
          sell_price?: number
          sku?: string
          status?: string | null
          stock?: number
          type?: string
          unit?: string
          updated_at?: string | null
          wholesale_price?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          details: string | null
          entity: string
          entity_id: string | null
          id: string
          timestamp: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          action: string
          details?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          action?: string
          details?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register: {
        Row: {
          card_in: number | null
          cash_in: number | null
          cash_out: number | null
          closed_at: string | null
          closed_by: string | null
          closing_balance: number | null
          date: string
          flooz_in: number | null
          id: string
          notes: string | null
          opened_at: string | null
          opened_by: string | null
          opening_balance: number
          tmoney_in: number | null
        }
        Insert: {
          card_in?: number | null
          cash_in?: number | null
          cash_out?: number | null
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          date: string
          flooz_in?: number | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          opened_by?: string | null
          opening_balance?: number
          tmoney_in?: number | null
        }
        Update: {
          card_in?: number | null
          cash_in?: number | null
          cash_out?: number | null
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          date?: string
          flooz_in?: number | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          opened_by?: string | null
          opening_balance?: number
          tmoney_in?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          balance: number | null
          country: string | null
          created_at: string | null
          credit_limit: number | null
          email: string | null
          id: string
          name: string
          phone: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          amount_collected: number | null
          amount_to_collect: number | null
          assigned_at: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          delivery_address: string
          delivery_notes: string | null
          delivery_phone: string | null
          driver_commission: number | null
          driver_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          picked_up_at: string | null
          sale_id: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount_collected?: number | null
          amount_to_collect?: number | null
          assigned_at?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivery_address: string
          delivery_notes?: string | null
          delivery_phone?: string | null
          driver_commission?: number | null
          driver_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          picked_up_at?: string | null
          sale_id: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount_collected?: number | null
          amount_to_collect?: number | null
          assigned_at?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivery_address?: string
          delivery_notes?: string | null
          delivery_phone?: string | null
          driver_commission?: number | null
          driver_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          picked_up_at?: string | null
          sale_id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_confirmations: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          delivery_id: string
          id: string
          notes: string | null
          proof_photo: string | null
          receiver_name: string
          receiver_signature: string | null
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          delivery_id: string
          id?: string
          notes?: string | null
          proof_photo?: string | null
          receiver_name: string
          receiver_signature?: string | null
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          delivery_id?: string
          id?: string
          notes?: string | null
          proof_photo?: string | null
          receiver_name?: string
          receiver_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          id: string
          name: string
          phone: string
          status: string | null
          successful_deliveries: number | null
          total_deliveries: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_number: string | null
          vehicle_type: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          name: string
          phone: string
          status?: string | null
          successful_deliveries?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          status?: string | null
          successful_deliveries?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_drivers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          id: string
          receipt: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          id?: string
          receipt?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          receipt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          performed_by: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          performed_by?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          last_activity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          last_activity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_activity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          po_id: string
          quantity: number
          received_quantity: number | null
          total: number
          unit_price: number
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          po_id: string
          quantity: number
          received_quantity?: number | null
          total: number
          unit_price: number
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          po_id?: string
          quantity?: number
          received_quantity?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          po_number: string
          status: Database["public"]["Enums"]["purchase_status"] | null
          subtotal: number
          supplier_id: string
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          po_number: string
          status?: Database["public"]["Enums"]["purchase_status"] | null
          subtotal: number
          supplier_id: string
          tax?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          status?: Database["public"]["Enums"]["purchase_status"] | null
          subtotal?: number
          supplier_id?: string
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          id: string
          notes: string | null
          po_id: string
          receipt_number: string
          received_at: string | null
          received_by: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          po_id: string
          receipt_number: string
          received_at?: string | null
          received_by?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          po_id?: string
          receipt_number?: string
          received_at?: string | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          discount: number | null
          id: string
          invoice_number: string
          items: Json
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["sale_status"] | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          id?: string
          invoice_number: string
          items: Json
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["sale_status"] | null
          subtotal: number
          tax?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string
          items?: Json
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["sale_status"] | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          company_name: string
          created_at: string | null
          currency: string | null
          id: string
          language: string | null
          logo: string | null
          primary_color: string | null
          receipt_footer: string | null
          secondary_color: string | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          logo?: string | null
          primary_color?: string | null
          receipt_footer?: string | null
          secondary_color?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          logo?: string | null
          primary_color?: string | null
          receipt_footer?: string | null
          secondary_color?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          adjusted_by: string | null
          article_id: string
          created_at: string | null
          difference: number
          id: string
          new_quantity: number
          notes: string | null
          old_quantity: number
          reason: string
        }
        Insert: {
          adjusted_by?: string | null
          article_id: string
          created_at?: string | null
          difference: number
          id?: string
          new_quantity: number
          notes?: string | null
          old_quantity: number
          reason: string
        }
        Update: {
          adjusted_by?: string | null
          article_id?: string
          created_at?: string | null
          difference?: number
          id?: string
          new_quantity?: number
          notes?: string | null
          old_quantity?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          article_id: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          quantity: number
          reference_id: string | null
          reserved_for: string
          status: string | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          quantity: number
          reference_id?: string | null
          reserved_for: string
          status?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          quantity?: number
          reference_id?: string | null
          reserved_for?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          payment_terms: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "driver"
      delivery_status:
        | "pending"
        | "assigned"
        | "in_transit"
        | "delivered"
        | "failed"
        | "cancelled"
      movement_type: "in" | "out" | "adjustment" | "transfer" | "return"
      payment_method: "cash" | "tmoney" | "flooz" | "card" | "credit"
      purchase_status: "draft" | "sent" | "partial" | "received" | "cancelled"
      sale_status: "completed" | "suspended" | "cancelled"
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
      app_role: ["admin", "manager", "cashier", "driver"],
      delivery_status: [
        "pending",
        "assigned",
        "in_transit",
        "delivered",
        "failed",
        "cancelled",
      ],
      movement_type: ["in", "out", "adjustment", "transfer", "return"],
      payment_method: ["cash", "tmoney", "flooz", "card", "credit"],
      purchase_status: ["draft", "sent", "partial", "received", "cancelled"],
      sale_status: ["completed", "suspended", "cancelled"],
    },
  },
} as const
