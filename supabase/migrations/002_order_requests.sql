-- Ujwala Eco Products — Order Requests Schema
-- For Email-Based Order Request Flow without Razorpay dependency

CREATE TABLE IF NOT EXISTS public.order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'India',
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  customization_notes TEXT,
  customer_notes TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_error TEXT,
  confirmed_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  final_confirmed_total NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.order_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(10, 2) NOT NULL,
  variant_snapshot TEXT,
  customization_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_order_requests_customer_id ON public.order_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_requests_request_number ON public.order_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_order_requests_status ON public.order_requests(status);
CREATE INDEX IF NOT EXISTS idx_order_requests_created_at ON public.order_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_request_items_request_id ON public.order_request_items(request_id);

-- Enable RLS
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_request_items ENABLE ROW LEVEL SECURITY;

-- Customer select policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_requests' AND policyname = 'Users can select own order_requests'
  ) THEN
    CREATE POLICY "Users can select own order_requests" ON public.order_requests
      FOR SELECT USING (auth.uid() = customer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_request_items' AND policyname = 'Users can select own order_request_items'
  ) THEN
    CREATE POLICY "Users can select own order_request_items" ON public.order_request_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.order_requests r
          WHERE r.id = order_request_items.request_id AND r.customer_id = auth.uid()
        )
      );
  END IF;
END $$;
