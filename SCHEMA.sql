-- ============================================================
--  ZOONOSIS - Municipalidad de Villa Allende
--  Esquema de base de datos Supabase
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Perfiles de usuarios (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'veterinario'
                  CHECK (role IN ('admin', 'veterinario', 'administrativo')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Animales
CREATE TABLE IF NOT EXISTS animals (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT NOT NULL,
  species              TEXT NOT NULL CHECK (species IN ('perro', 'gato', 'otro')),
  breed                TEXT,
  sex                  TEXT CHECK (sex IN ('macho', 'hembra')),
  birth_date           DATE,
  estimated_age_years  INTEGER,
  color                TEXT,
  registration_number  TEXT,
  tattoo_number        TEXT,
  chip_number          TEXT,
  is_neutered          BOOLEAN DEFAULT FALSE,
  neutering_date       DATE,
  current_weight_kg    DECIMAL(5,2),
  is_active            BOOLEAN DEFAULT TRUE,
  notes                TEXT,
  created_by           UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de peso
CREATE TABLE IF NOT EXISTS weight_records (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id    UUID REFERENCES animals(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg    DECIMAL(5,2) NOT NULL,
  notes        TEXT,
  recorded_by  UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Vacunaciones
CREATE TABLE IF NOT EXISTS vaccinations (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id      UUID REFERENCES animals(id) ON DELETE CASCADE,
  vaccine_name   TEXT NOT NULL,
  date_applied   DATE NOT NULL,
  next_due_date  DATE,
  batch_number   TEXT,
  laboratory     TEXT,
  dose           TEXT,
  cost           DECIMAL(10,2) DEFAULT 0,
  applied_by     UUID REFERENCES auth.users(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Desparasitaciones
CREATE TABLE IF NOT EXISTS dewormings (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id      UUID REFERENCES animals(id) ON DELETE CASCADE,
  product_name   TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'interna'
                   CHECK (type IN ('interna', 'externa', 'ambas')),
  date_applied   DATE NOT NULL,
  next_due_date  DATE,
  dose           TEXT,
  cost           DECIMAL(10,2) DEFAULT 0,
  applied_by     UUID REFERENCES auth.users(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Estudios médicos
CREATE TABLE IF NOT EXISTS medical_studies (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id     UUID REFERENCES animals(id) ON DELETE CASCADE,
  study_type    TEXT NOT NULL,
  date          DATE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  result        TEXT,
  cost          DECIMAL(10,2) DEFAULT 0,
  performed_by  UUID REFERENCES auth.users(id),
  file_url      TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Intervenciones / consultas
CREATE TABLE IF NOT EXISTS interventions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id        UUID REFERENCES animals(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  date             DATE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  diagnosis        TEXT,
  treatment        TEXT,
  medication       TEXT,
  cost             DECIMAL(10,2) DEFAULT 0,
  performed_by     UUID REFERENCES auth.users(id),
  follow_up_date   DATE,
  status           TEXT DEFAULT 'completado'
                     CHECK (status IN ('activo', 'completado', 'cancelado')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Recordatorios
CREATE TABLE IF NOT EXISTS reminders (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id           UUID REFERENCES animals(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  due_date            DATE NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  status              TEXT DEFAULT 'pendiente'
                        CHECK (status IN ('pendiente', 'completado', 'cancelado')),
  related_record_type TEXT,
  related_record_id   UUID,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dewormings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders      ENABLE ROW LEVEL SECURITY;

-- Políticas: todos los usuarios autenticados pueden leer
CREATE POLICY "read_profiles"        ON profiles        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_animals"         ON animals         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_weights"         ON weight_records  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_vaccinations"    ON vaccinations    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_dewormings"      ON dewormings      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_studies"         ON medical_studies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_interventions"   ON interventions   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_reminders"       ON reminders       FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas: todos los autenticados pueden insertar
CREATE POLICY "insert_animals"       ON animals         FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "insert_weights"       ON weight_records  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "insert_vaccinations"  ON vaccinations    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "insert_dewormings"    ON dewormings      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "insert_studies"       ON medical_studies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "insert_interventions" ON interventions   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "insert_reminders"     ON reminders       FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas: todos los autenticados pueden actualizar
CREATE POLICY "update_animals"       ON animals         FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "update_vaccinations"  ON vaccinations    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "update_dewormings"    ON dewormings      FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "update_studies"       ON medical_studies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "update_interventions" ON interventions   FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "update_reminders"     ON reminders       FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas: todos los autenticados pueden eliminar
CREATE POLICY "delete_weights"       ON weight_records  FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "delete_vaccinations"  ON vaccinations    FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "delete_dewormings"    ON dewormings      FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "delete_studies"       ON medical_studies FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "delete_interventions" ON interventions   FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "delete_reminders"     ON reminders       FOR DELETE USING (auth.role() = 'authenticated');

-- Perfil propio
CREATE POLICY "insert_own_profile"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
--  FUNCIÓN: Auto-crear perfil al registrar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'veterinario'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
