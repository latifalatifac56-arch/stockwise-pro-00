CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'cashier',
    'driver'
);


--
-- Name: delivery_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.delivery_status AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered',
    'failed',
    'cancelled'
);


--
-- Name: movement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.movement_type AS ENUM (
    'in',
    'out',
    'adjustment',
    'transfer',
    'return'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'tmoney',
    'flooz',
    'card',
    'credit'
);


--
-- Name: purchase_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.purchase_status AS ENUM (
    'draft',
    'sent',
    'partial',
    'received',
    'cancelled'
);


--
-- Name: sale_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sale_status AS ENUM (
    'completed',
    'suspended',
    'cancelled'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count existing users with roles
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- First user becomes admin, others become manager
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'manager');
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: accounting_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounting_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_date date NOT NULL,
    type text NOT NULL,
    category text NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method public.payment_method,
    description text,
    reference_id uuid,
    reference_type text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    type text NOT NULL,
    image text,
    barcode text,
    buy_price numeric(15,2) DEFAULT 0 NOT NULL,
    sell_price numeric(15,2) DEFAULT 0 NOT NULL,
    wholesale_price numeric(15,2),
    unit text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    reserved_stock integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    username text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id uuid,
    details text,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- Name: cash_register; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_register (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    opening_balance numeric(15,2) DEFAULT 0 NOT NULL,
    closing_balance numeric(15,2),
    cash_in numeric(15,2) DEFAULT 0,
    cash_out numeric(15,2) DEFAULT 0,
    tmoney_in numeric(15,2) DEFAULT 0,
    flooz_in numeric(15,2) DEFAULT 0,
    card_in numeric(15,2) DEFAULT 0,
    notes text,
    opened_by uuid,
    closed_by uuid,
    opened_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    country text,
    type text DEFAULT 'regular'::text,
    credit_limit numeric(15,2) DEFAULT 0,
    balance numeric(15,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    driver_id uuid,
    client_id uuid,
    delivery_address text NOT NULL,
    delivery_phone text,
    delivery_notes text,
    status public.delivery_status DEFAULT 'pending'::public.delivery_status,
    scheduled_at timestamp with time zone,
    assigned_at timestamp with time zone,
    picked_up_at timestamp with time zone,
    delivered_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    amount_to_collect numeric(15,2),
    amount_collected numeric(15,2),
    driver_commission numeric(15,2),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: delivery_confirmations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_confirmations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    delivery_id uuid NOT NULL,
    receiver_name text NOT NULL,
    receiver_signature text,
    proof_photo text,
    notes text,
    confirmed_at timestamp with time zone DEFAULT now(),
    confirmed_by uuid
);


--
-- Name: delivery_drivers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_drivers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    phone text NOT NULL,
    vehicle_type text,
    vehicle_number text,
    commission_rate numeric(5,2) DEFAULT 10,
    status text DEFAULT 'active'::text,
    total_deliveries integer DEFAULT 0,
    successful_deliveries integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text NOT NULL,
    receipt text,
    date date NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    movement_type public.movement_type NOT NULL,
    quantity integer NOT NULL,
    unit_cost numeric(15,2),
    reference_id uuid,
    reference_type text,
    notes text,
    performed_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    email text,
    avatar_url text,
    status text DEFAULT 'active'::text,
    last_activity timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    po_id uuid NOT NULL,
    article_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    received_quantity integer DEFAULT 0,
    total numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    po_number text NOT NULL,
    supplier_id uuid NOT NULL,
    status public.purchase_status DEFAULT 'draft'::public.purchase_status,
    subtotal numeric(15,2) NOT NULL,
    tax numeric(15,2) DEFAULT 0,
    total numeric(15,2) NOT NULL,
    notes text,
    expected_date date,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: purchase_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    po_id uuid NOT NULL,
    receipt_number text NOT NULL,
    received_by uuid,
    notes text,
    received_at timestamp with time zone DEFAULT now()
);


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    client_id uuid,
    items jsonb NOT NULL,
    subtotal numeric(15,2) NOT NULL,
    discount numeric(15,2) DEFAULT 0,
    tax numeric(15,2) DEFAULT 0,
    total numeric(15,2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    status public.sale_status DEFAULT 'completed'::public.sale_status,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    logo text,
    primary_color text DEFAULT '#3b82f6'::text,
    secondary_color text DEFAULT '#10b981'::text,
    currency text DEFAULT 'FCFA'::text,
    language text DEFAULT 'fr'::text,
    receipt_footer text,
    tax_rate numeric(5,2) DEFAULT 18,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: stock_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_adjustments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    old_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    difference integer NOT NULL,
    reason text NOT NULL,
    notes text,
    adjusted_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: stock_reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    quantity integer NOT NULL,
    reserved_for text NOT NULL,
    reference_id uuid,
    expires_at timestamp with time zone,
    status text DEFAULT 'active'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    whatsapp text,
    address text,
    country text,
    payment_terms text,
    balance numeric(15,2) DEFAULT 0,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: accounting_entries accounting_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_entries
    ADD CONSTRAINT accounting_entries_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: articles articles_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_sku_key UNIQUE (sku);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: cash_register cash_register_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register
    ADD CONSTRAINT cash_register_date_key UNIQUE (date);


--
-- Name: cash_register cash_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register
    ADD CONSTRAINT cash_register_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: delivery_confirmations delivery_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_confirmations
    ADD CONSTRAINT delivery_confirmations_pkey PRIMARY KEY (id);


--
-- Name: delivery_drivers delivery_drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_drivers
    ADD CONSTRAINT delivery_drivers_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: purchase_receipts purchase_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_receipts
    ADD CONSTRAINT purchase_receipts_pkey PRIMARY KEY (id);


--
-- Name: purchase_receipts purchase_receipts_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_receipts
    ADD CONSTRAINT purchase_receipts_receipt_number_key UNIQUE (receipt_number);


--
-- Name: sales sales_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_invoice_number_key UNIQUE (invoice_number);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: stock_adjustments stock_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_pkey PRIMARY KEY (id);


--
-- Name: stock_reservations stock_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_articles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_category ON public.articles USING btree (category);


--
-- Name: idx_articles_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_sku ON public.articles USING btree (sku);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: idx_deliveries_driver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deliveries_driver ON public.deliveries USING btree (driver_id);


--
-- Name: idx_deliveries_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deliveries_status ON public.deliveries USING btree (status);


--
-- Name: idx_inventory_movements_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_movements_article ON public.inventory_movements USING btree (article_id);


--
-- Name: idx_purchase_orders_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders USING btree (supplier_id);


--
-- Name: idx_sales_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_date ON public.sales USING btree (created_at);


--
-- Name: idx_sales_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_invoice ON public.sales USING btree (invoice_number);


--
-- Name: profiles on_profile_created_assign_role; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_created_assign_role AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();


--
-- Name: articles update_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deliveries update_deliveries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: purchase_orders update_purchase_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sales update_sales_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: settings update_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: suppliers update_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: accounting_entries accounting_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_entries
    ADD CONSTRAINT accounting_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: cash_register cash_register_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register
    ADD CONSTRAINT cash_register_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.profiles(id);


--
-- Name: cash_register cash_register_opened_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register
    ADD CONSTRAINT cash_register_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES public.profiles(id);


--
-- Name: deliveries deliveries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: deliveries deliveries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: deliveries deliveries_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.delivery_drivers(id);


--
-- Name: deliveries deliveries_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: delivery_confirmations delivery_confirmations_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_confirmations
    ADD CONSTRAINT delivery_confirmations_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.profiles(id);


--
-- Name: delivery_confirmations delivery_confirmations_delivery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_confirmations
    ADD CONSTRAINT delivery_confirmations_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;


--
-- Name: delivery_drivers delivery_drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_drivers
    ADD CONSTRAINT delivery_drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: inventory_movements inventory_movements_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id);


--
-- Name: inventory_movements inventory_movements_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: purchase_order_items purchase_order_items_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id);


--
-- Name: purchase_order_items purchase_order_items_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchase_receipts purchase_receipts_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_receipts
    ADD CONSTRAINT purchase_receipts_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_receipts purchase_receipts_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_receipts
    ADD CONSTRAINT purchase_receipts_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.profiles(id);


--
-- Name: sales sales_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: sales sales_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: stock_adjustments stock_adjustments_adjusted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_adjusted_by_fkey FOREIGN KEY (adjusted_by) REFERENCES public.profiles(id);


--
-- Name: stock_adjustments stock_adjustments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id);


--
-- Name: stock_reservations stock_reservations_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id);


--
-- Name: stock_reservations stock_reservations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: delivery_drivers Admins can manage drivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage drivers" ON public.delivery_drivers TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Anyone can view roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);


--
-- Name: settings Authenticated can insert settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can insert settings" ON public.settings FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: settings Authenticated can update settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can update settings" ON public.settings FOR UPDATE USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: settings Authenticated users can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage settings" ON public.settings USING (((auth.uid() IS NOT NULL) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR (NOT (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (user_roles.role = 'admin'::public.app_role)))))));


--
-- Name: expenses Authorized staff can create expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized staff can create expenses" ON public.expenses FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: delivery_confirmations Drivers and managers can create confirmations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers and managers can create confirmations" ON public.delivery_confirmations FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'driver'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: deliveries Drivers can update their assigned deliveries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can update their assigned deliveries" ON public.deliveries FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.delivery_drivers
  WHERE ((delivery_drivers.user_id = auth.uid()) AND (delivery_drivers.id = deliveries.driver_id)))));


--
-- Name: deliveries Drivers can view their deliveries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view their deliveries" ON public.deliveries FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.delivery_drivers
  WHERE ((delivery_drivers.user_id = auth.uid()) AND (delivery_drivers.id = deliveries.driver_id)))));


--
-- Name: stock_reservations Everyone can create reservations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can create reservations" ON public.stock_reservations FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: sales Everyone can create sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can create sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: purchase_order_items Everyone can view PO items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view PO items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);


--
-- Name: stock_adjustments Everyone can view adjustments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view adjustments" ON public.stock_adjustments FOR SELECT TO authenticated USING (true);


--
-- Name: articles Everyone can view articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view articles" ON public.articles FOR SELECT TO authenticated USING (true);


--
-- Name: cash_register Everyone can view cash register; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view cash register" ON public.cash_register FOR SELECT TO authenticated USING (true);


--
-- Name: delivery_confirmations Everyone can view confirmations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view confirmations" ON public.delivery_confirmations FOR SELECT TO authenticated USING (true);


--
-- Name: deliveries Everyone can view deliveries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view deliveries" ON public.deliveries FOR SELECT TO authenticated USING (true);


--
-- Name: delivery_drivers Everyone can view drivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view drivers" ON public.delivery_drivers FOR SELECT TO authenticated USING (true);


--
-- Name: inventory_movements Everyone can view inventory movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view inventory movements" ON public.inventory_movements FOR SELECT TO authenticated USING (true);


--
-- Name: purchase_orders Everyone can view purchase orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view purchase orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);


--
-- Name: purchase_receipts Everyone can view receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view receipts" ON public.purchase_receipts FOR SELECT TO authenticated USING (true);


--
-- Name: stock_reservations Everyone can view reservations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view reservations" ON public.stock_reservations FOR SELECT TO authenticated USING (true);


--
-- Name: settings Everyone can view settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view settings" ON public.settings FOR SELECT TO authenticated USING (true);


--
-- Name: purchase_order_items Managers and admins can manage PO items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage PO items" ON public.purchase_order_items TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: accounting_entries Managers and admins can manage accounting; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage accounting" ON public.accounting_entries TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: stock_adjustments Managers and admins can manage adjustments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage adjustments" ON public.stock_adjustments TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: articles Managers and admins can manage articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage articles" ON public.articles TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: cash_register Managers and admins can manage cash register; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage cash register" ON public.cash_register TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: clients Managers and admins can manage clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage clients" ON public.clients TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: deliveries Managers and admins can manage deliveries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage deliveries" ON public.deliveries TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: expenses Managers and admins can manage expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage expenses" ON public.expenses TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: inventory_movements Managers and admins can manage inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage inventory" ON public.inventory_movements TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: purchase_orders Managers and admins can manage purchase orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage purchase orders" ON public.purchase_orders TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: purchase_receipts Managers and admins can manage receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage receipts" ON public.purchase_receipts TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: sales Managers and admins can manage sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage sales" ON public.sales TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: suppliers Managers and admins can manage suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can manage suppliers" ON public.suppliers TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: accounting_entries Managers and admins can view accounting; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can view accounting" ON public.accounting_entries FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: clients Managers and admins can view clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can view clients" ON public.clients FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: expenses Managers and admins can view expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers and admins can view expenses" ON public.expenses FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: user_roles Only admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sales Staff can view sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view sales" ON public.sales FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'cashier'::public.app_role)));


--
-- Name: suppliers Staff can view suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: accounting_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_register; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: deliveries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_confirmations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_drivers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_adjustments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_reservations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


