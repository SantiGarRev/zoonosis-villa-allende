-- ============================================================
--  MIGRACIÓN 02 — Edad en meses para cachorros
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE animals
  ADD COLUMN IF NOT EXISTS estimated_age_months INT;
