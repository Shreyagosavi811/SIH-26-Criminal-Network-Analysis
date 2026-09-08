-- SIH-2026 Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles (Users/Investigators)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'investigator', -- 'admin', 'investigator', 'analyst'
    badge_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Table: cases (Investigations)
CREATE TABLE public.cases (
    id TEXT PRIMARY KEY, -- e.g., 'CASE-4091'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    status TEXT NOT NULL, -- 'OPEN', 'CLOSED', 'PENDING'
    category TEXT NOT NULL,
    district TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cases are viewable by authenticated users." 
ON public.cases FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cases can be created by authenticated users." 
ON public.cases FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cases can be updated by authenticated users." 
ON public.cases FOR UPDATE USING (auth.role() = 'authenticated');

-- Table: firs (First Information Reports)
CREATE TABLE public.firs (
    id TEXT PRIMARY KEY, -- e.g., 'FIR-8891'
    case_id TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
    suspect_name TEXT NOT NULL,
    complainant TEXT NOT NULL,
    incident_date TEXT NOT NULL,
    location TEXT NOT NULL,
    officer TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for firs
ALTER TABLE public.firs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FIRs are viewable by authenticated users." 
ON public.firs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "FIRs can be created by authenticated users." 
ON public.firs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "FIRs can be updated by authenticated users." 
ON public.firs FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, department, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Investigator'),
    COALESCE(new.raw_user_meta_data->>'department', 'CID Cyber Cell'),
    'investigator'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
