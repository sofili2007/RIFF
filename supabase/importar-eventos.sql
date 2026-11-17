-- RIFF · eventos reales importados de carteleras oficiales (Tuboleta y Movistar Arena)
-- La función que los lee está en supabase/functions/importar-eventos/index.ts.

-- 1) Columnas para saber de dónde viene cada evento (y no repetirlo). Ya se corrió.
alter table public.eventos add column if not exists fuente text;
alter table public.eventos add column if not exists fuente_url text;
create unique index if not exists eventos_fuente_url_unica on public.eventos (fuente_url);

-- 2) Programar la importación diaria (6:00 a. m. de Bogotá = 11:00 UTC). FALTA CORRERLO:
--    reemplaza PEGA_AQUI_LA_ANON_KEY por la «anon key» del proyecto
--    (Supabase → Edge Functions → importar-eventos → Settings → «Show anon key»; es una llave pública)
--    y corre este bloque en Supabase → SQL Editor.
create extension if not exists pg_net;
create extension if not exists pg_cron;
select cron.schedule('importar-eventos-diario', '0 11 * * *', $$
  select net.http_post(
    url := 'https://oqphkkwdbsoqbbehyeag.supabase.co/functions/v1/importar-eventos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer PEGA_AQUI_LA_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$$);
