-- RIFF · esquema de la base de datos (Supabase / Postgres)
-- Se corre una sola vez en: Supabase → SQL Editor → New query → pegar → Run.
-- Crea las tablas de spec.md, la seguridad (RLS), las automatizaciones y los eventos iniciales de Bogotá.

-- ============ TABLAS ============
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text default '', apellido text default '', correo text default '',
  rol text not null default 'publico' check (rol in ('publico','organizador')),
  generos text[] not null default '{}', presupuesto_min int, presupuesto_max int, presupuesto_etiqueta text,
  cuenta_musica text not null default 'ninguna' check (cuenta_musica in ('ninguna','spotify','apple music')),
  artistas text[] not null default '{}', tutorial_visto boolean not null default false,
  created_at timestamptz not null default now());
create table if not exists public.organizadores (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  tipo text not null default 'organizador' check (tipo in ('venue','artista','organizador')),
  correo text default '', descripcion text default '', ubicacion text default '', redes text default '',
  estado_verificacion text not null default 'pendiente' check (estado_verificacion in ('pendiente','en revision','verificado','rechazado')),
  motivo_rechazo text, documentos jsonb not null default '{}', created_at timestamptz not null default now());
create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  titulo text not null, portada text not null default 'assets/mapa-bogota.jpg', generos text[] not null default '{}',
  formato text default 'En vivo', tipo_venue text default 'Teatro', edad text default 'Todo público',
  fecha timestamptz not null, fecha_fin timestamptz, nota_fecha text default '',
  venue text not null, direccion text default '', lat double precision, lng double precision,
  precio_desde int, precio_hasta int, descripcion text default '', venta_nombre text default '', venta_url text default '',
  organizador_id uuid references auth.users(id) on delete set null,
  estado text not null default 'publicado' check (estado in ('en revision','publicado','rechazado','cancelado')),
  motivo_rechazo text, created_at timestamptz not null default now());
create table if not exists public.guardados (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  evento_id bigint not null references public.eventos(id) on delete cascade,
  recordatorio text not null default '1 día antes', created_at timestamptz not null default now(),
  primary key (usuario_id, evento_id));
create table if not exists public.notificaciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null, titulo text not null, texto text default '',
  evento_id bigint references public.eventos(id) on delete cascade,
  leida boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.metricas (
  id bigint generated always as identity primary key,
  evento_id bigint not null references public.eventos(id) on delete cascade,
  tipo text not null check (tipo in ('vista','guardado','clic_venta')), created_at timestamptz not null default now());
create table if not exists public.busquedas (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  texto text not null, created_at timestamptz not null default now());

-- ============ SEGURIDAD (RLS): cada quien ve y cambia solo lo suyo ============
alter table public.perfiles enable row level security;
alter table public.organizadores enable row level security;
alter table public.eventos enable row level security;
alter table public.guardados enable row level security;
alter table public.notificaciones enable row level security;
alter table public.metricas enable row level security;
alter table public.busquedas enable row level security;
create policy "perfil propio: ver" on public.perfiles for select using (auth.uid() = id);
create policy "perfil propio: crear" on public.perfiles for insert with check (auth.uid() = id);
create policy "perfil propio: editar" on public.perfiles for update using (auth.uid() = id);
create policy "organizadores: ver todos" on public.organizadores for select using (true);
create policy "organizador propio: crear" on public.organizadores for insert with check (auth.uid() = id);
create policy "organizador propio: editar" on public.organizadores for update using (auth.uid() = id);
create policy "eventos: ver publicados o propios" on public.eventos for select using (estado = 'publicado' or organizador_id = auth.uid());
create policy "eventos: crear propios" on public.eventos for insert with check (auth.uid() = organizador_id);
create policy "eventos: editar propios" on public.eventos for update using (auth.uid() = organizador_id);
create policy "guardados propios" on public.guardados for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "notificaciones propias: ver" on public.notificaciones for select using (auth.uid() = usuario_id);
create policy "notificaciones propias: crear" on public.notificaciones for insert with check (auth.uid() = usuario_id);
create policy "notificaciones propias: editar" on public.notificaciones for update using (auth.uid() = usuario_id);
create policy "busquedas propias" on public.busquedas for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "metricas: cualquiera registra" on public.metricas for insert with check (true);
create policy "metricas: el organizador ve las suyas" on public.metricas for select
  using (exists (select 1 from public.eventos e where e.id = evento_id and e.organizador_id = auth.uid()));

-- ============ AUTOMATIZACIONES ============
-- Al registrarse se crea su perfil (y su ficha de organizador si aplica)
create or replace function public.nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'rol', 'publico');
begin
  insert into public.perfiles (id, nombre, apellido, correo, rol)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre',''), coalesce(new.raw_user_meta_data->>'apellido',''), new.email, r)
  on conflict (id) do nothing;
  if r = 'organizador' then
    insert into public.organizadores (id, nombre, tipo, correo)
    values (new.id, coalesce(new.raw_user_meta_data->>'nombre',''), coalesce(new.raw_user_meta_data->>'tipo','organizador'), new.email)
    on conflict (id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists al_registrarse on auth.users;
create trigger al_registrarse after insert on auth.users for each row execute function public.nuevo_usuario();
-- Cuando un evento queda publicado: avisa al organizador y a quien tenga esos géneros en sus gustos
create or replace function public.avisar_evento_publicado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'publicado' and (tg_op = 'INSERT' or old.estado is distinct from 'publicado') then
    if new.organizador_id is not null then
      insert into public.notificaciones (usuario_id, tipo, titulo, texto, evento_id)
      values (new.organizador_id, 'evento aprobado', 'Tu evento fue aprobado', new.titulo || ' ya se ve en el feed, el mapa y los filtros.', new.id);
    end if;
    insert into public.notificaciones (usuario_id, tipo, titulo, texto, evento_id)
    select p.id, 'según tus gustos', 'Nuevo evento de ' || lower(new.generos[1]),
           new.titulo || ' · ' || new.venue || '. Encaja con tus gustos.', new.id
    from public.perfiles p
    where p.rol = 'publico' and p.generos && new.generos and p.id is distinct from new.organizador_id;
  end if;
  return new;
end $$;
drop trigger if exists al_publicar on public.eventos;
create trigger al_publicar after insert or update of estado on public.eventos for each row execute function public.avisar_evento_publicado();
-- Métricas resumidas para el panel del organizador (solo de sus eventos)
create or replace function public.resumen_metricas(dias int default 7)
returns table (evento_id bigint, vistas bigint, guardados bigint, clics bigint)
language sql security invoker stable as $$
  select e.id,
    count(*) filter (where m.tipo = 'vista'),
    count(*) filter (where m.tipo = 'guardado'),
    count(*) filter (where m.tipo = 'clic_venta')
  from public.eventos e
  left join public.metricas m on m.evento_id = e.id and m.created_at > now() - make_interval(days => dias)
  where e.organizador_id = auth.uid()
  group by e.id;
$$;

-- ============ ARCHIVOS (portadas públicas y documentos privados) ============
insert into storage.buckets (id, name, public) values ('portadas', 'portadas', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false) on conflict do nothing;
create policy "portadas: ver" on storage.objects for select using (bucket_id = 'portadas');
create policy "portadas: subir" on storage.objects for insert to authenticated with check (bucket_id = 'portadas');
create policy "documentos: subir propios" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documentos: ver propios" on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ EVENTOS INICIALES ============
-- Ya están cargados en la base de datos del proyecto (12 eventos de Bogotá con las imágenes de assets/).
-- Para verlos o agregar más: Supabase → Table Editor → eventos.
