-- ============================================================
--  MIGRACIÓN 01 — Refugio canino + Adopciones
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Nuevos campos en tabla animals
ALTER TABLE animals
  ADD COLUMN IF NOT EXISTS recognition_number TEXT,
  ADD COLUMN IF NOT EXISTS coat               TEXT,
  ADD COLUMN IF NOT EXISTS animal_status      TEXT DEFAULT 'vivo'
    CHECK (animal_status IN ('vivo','fallecido','extraviado','recuperado')),
  ADD COLUMN IF NOT EXISTS location           TEXT DEFAULT 'refugio'
    CHECK (location IN ('refugio','hogar_definitivo','bionodo','provisorio')),
  ADD COLUMN IF NOT EXISTS entry_date         DATE,
  ADD COLUMN IF NOT EXISTS nextgard_date      DATE;

-- Tabla de adopciones
CREATE TABLE IF NOT EXISTS adoptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id       UUID REFERENCES animals(id) ON DELETE CASCADE,
  adopter_name    TEXT NOT NULL,
  adopter_address TEXT,
  adopter_phone   TEXT,
  adoption_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para adopciones
ALTER TABLE adoptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_adoptions"   ON adoptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "insert_adoptions" ON adoptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "update_adoptions" ON adoptions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "delete_adoptions" ON adoptions FOR DELETE USING (auth.role() = 'authenticated');
