-- SQL Script to set up the database schema for RupeeRise
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    age INT,
    balance NUMERIC DEFAULT 0,
    role TEXT DEFAULT 'user',
    email TEXT,
    "referralCode" TEXT UNIQUE,
    "totalReferralEarnings" NUMERIC DEFAULT 0,
    "referredBy" TEXT,
    "isVip" BOOLEAN DEFAULT FALSE,
    "vipPurchasedAt" TIMESTAMPTZ,
    kyc_url TEXT,
    bank_details TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE public.users ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES public.users(id) ON DELETE CASCADE,
    "userName" TEXT,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    net_payout NUMERIC,
    "processedAt" TIMESTAMPTZ,
    reason TEXT
);

-- 3. Create VIP Requests Table
CREATE TABLE IF NOT EXISTS public.vip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES public.users(id) ON DELETE CASCADE,
    "userName" TEXT,
    "transactionId" TEXT,
    status TEXT DEFAULT 'pending',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    "processedAt" TIMESTAMPTZ
);

-- 4. Create Enquiries Table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT,
    "contactNumber" TEXT,
    email TEXT,
    enquiry TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    commission NUMERIC DEFAULT 10,
    "vipThreshold" NUMERIC DEFAULT 99,
    "minWithdrawal" NUMERIC DEFAULT 500,
    "upiId" TEXT DEFAULT 'payment.admin@upi',
    "qrUrl" TEXT,
    "apkUrl" TEXT
);

-- 6. Create Referral Earnings Table
CREATE TABLE IF NOT EXISTS public.referral_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES public.users(id) ON DELETE CASCADE,
    from_uid UUID REFERENCES public.users(id) ON DELETE SET NULL,
    level INT,
    amount NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Ad Rewards Table
CREATE TABLE IF NOT EXISTS public.ad_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    "adNetwork" TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Insert Global Settings if not exists
INSERT INTO public.settings (id, commission, "vipThreshold", "minWithdrawal", "upiId")
VALUES ('global', 10, 99, 500, 'payment.admin@upi')
ON CONFLICT (id) DO NOTHING;

-- 8. Functions & Triggers (Auto-profile creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, "referralCode", role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.phone,
    UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)),
    CASE 
      WHEN NEW.email = 'ashishnehra450@gmail.com' OR NEW.id::text = 'ashishnehra450@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function for Admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND (role = 'admin' OR email = 'ashishnehra450@gmail.com' OR phone = 'ashishnehra450@gmail.com')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_rewards ENABLE ROW LEVEL SECURITY;

-- 9. Basic RLS Policies (Hardened)

-- Drop existing if any
DROP POLICY IF EXISTS "Manage own profile" ON public.users;
DROP POLICY IF EXISTS "Manage own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Manage own VIP requests" ON public.vip_requests;
DROP POLICY IF EXISTS "Manage own enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Manage own referral earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "Manage own ad rewards" ON public.ad_rewards;

-- Users
CREATE POLICY "Manage own profile" ON public.users FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (is_admin());

-- Withdrawals
CREATE POLICY "Manage own withdrawals" ON public.withdrawals FOR ALL USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR SELECT USING (is_admin());

-- VIP Requests
CREATE POLICY "Manage own VIP requests" ON public.vip_requests FOR ALL USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);
CREATE POLICY "Admins can view all VIP requests" ON public.vip_requests FOR SELECT USING (is_admin());

-- Enquiries
CREATE POLICY "Manage own enquiries" ON public.enquiries FOR ALL USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);
CREATE POLICY "Admins can view all enquiries" ON public.enquiries FOR SELECT USING (is_admin());

-- Referral Earnings
CREATE POLICY "Manage own referral earnings" ON public.referral_earnings FOR ALL USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);
CREATE POLICY "Admins can view all referral earnings" ON public.referral_earnings FOR SELECT USING (is_admin());

-- Ad Rewards
CREATE POLICY "Manage own ad rewards" ON public.ad_rewards FOR ALL USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);
CREATE POLICY "Admins can view all ad rewards" ON public.ad_rewards FOR SELECT USING (is_admin());

-- Settings (Publicly readable)
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (TRUE);

-- 10. Bootstrap Admin Role
-- Ensure the hardcoded admin email has the admin role
UPDATE public.users SET role = 'admin' WHERE email = 'ashishnehra450@gmail.com' OR phone = 'ashishnehra450@gmail.com';

-- 11. Fix Replica Identity (Prevents "replica identity" errors during updates/realtime)
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.vip_requests REPLICA IDENTITY FULL;
ALTER TABLE public.enquiries REPLICA IDENTITY FULL;
ALTER TABLE public.settings REPLICA IDENTITY FULL;
ALTER TABLE public.referral_earnings REPLICA IDENTITY FULL;
ALTER TABLE public.ad_rewards REPLICA IDENTITY FULL;

-- 12. Enable Realtime Publications (Supabase Realtime)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.users, 
    public.withdrawals, 
    public.vip_requests, 
    public.enquiries, 
    public.settings, 
    public.referral_earnings, 
    public.ad_rewards;

-- 13. Admin Overrides (Example: allowing service role or specific admins to see all)
-- In Supabase, service role always bypasses RLS, which we use in server.ts.

-- 14. Storage Configuration (KYC and Settings buckets)
-- Create buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc', 'kyc', true), ('settings', 'settings', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for KYC bucket
DROP POLICY IF EXISTS "Public KYC Upload" ON storage.objects;
CREATE POLICY "Public KYC Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc');

DROP POLICY IF EXISTS "Public KYC Access" ON storage.objects;
CREATE POLICY "Public KYC Access" ON storage.objects FOR SELECT USING (bucket_id = 'kyc');

-- Policies for Settings bucket
DROP POLICY IF EXISTS "Admin Settings Upload" ON storage.objects;
CREATE POLICY "Admin Settings Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'settings');

DROP POLICY IF EXISTS "Public Settings Access" ON storage.objects;
CREATE POLICY "Public Settings Access" ON storage.objects FOR SELECT USING (bucket_id = 'settings');
