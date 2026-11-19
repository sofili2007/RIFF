-- RIFF · eliminar cuentas y eventos cancelados (correr una vez en Supabase → SQL Editor)
-- Se puede volver a correr sin problema.

-- 1) Al borrar una cuenta (desde la app o desde Supabase → Authentication) se borran también
--    los eventos que publicó; con ellos se van sus métricas, guardados y notificaciones.
do $$
declare r record;
begin
  for r in select con.conname from pg_constraint con
           join pg_attribute a on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
           where con.conrelid = 'public.eventos'::regclass and con.contype = 'f' and a.attname = 'organizador_id'
  loop execute format('alter table public.eventos drop constraint %I', r.conname); end loop;
end $$;
alter table public.eventos add constraint eventos_organizador_id_fkey
  foreign key (organizador_id) references auth.users(id) on delete cascade;

-- 2) Cada métrica recuerda quién la generó: al borrar esa cuenta, sus vistas, guardados y clics
--    dejan de contar en las métricas de los organizadores.
alter table public.metricas add column if not exists usuario_id uuid default auth.uid()
  references auth.users(id) on delete cascade;

-- 3) Eliminar mi cuenta desde la app
create or replace function public.borrar_mi_cuenta() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  delete from auth.users where id = auth.uid(); -- todo lo demás se borra en cascada
end $$;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;

-- Permiso para borrar los archivos propios antes de eliminar la cuenta
drop policy if exists "documentos: borrar propios" on storage.objects;
create policy "documentos: borrar propios" on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "portadas: borrar propias" on storage.objects;
create policy "portadas: borrar propias" on storage.objects for delete to authenticated
  using (bucket_id = 'portadas' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) Evento cancelado: sale de los guardados de todos (con un aviso) y de las notificaciones
create or replace function public.al_cancelar_evento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'cancelado' and old.estado is distinct from 'cancelado' then
    insert into public.notificaciones (usuario_id, tipo, titulo, texto)
    select g.usuario_id, 'evento cancelado', 'Se canceló un evento que guardaste',
           new.titulo || ' · ' || new.venue || ' fue cancelado por el organizador.'
    from public.guardados g where g.evento_id = new.id;
    delete from public.guardados where evento_id = new.id;
    delete from public.notificaciones where evento_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists al_cancelar on public.eventos;
create trigger al_cancelar after update of estado on public.eventos
  for each row execute function public.al_cancelar_evento();

-- Limpia lo que ya estaba cancelado
delete from public.guardados g using public.eventos e where e.id = g.evento_id and e.estado = 'cancelado';
delete from public.notificaciones n using public.eventos e where e.id = n.evento_id and e.estado = 'cancelado';
