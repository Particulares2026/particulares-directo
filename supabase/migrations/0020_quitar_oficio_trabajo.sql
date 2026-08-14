-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Revierte la migración 0019: se simplifica el filtro de trabajo a una única
-- lista de sectores/profesiones en vez de un desglose de oficios aparte.

alter table public.anuncios drop column if exists oficio;
