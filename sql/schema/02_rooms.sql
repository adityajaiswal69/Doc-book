create table public.user_rooms (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  room_id uuid not null,
  role text not null,
  created_at timestamp with time zone null default now(),
  constraint user_rooms_pkey primary key (id),
  constraint user_rooms_user_id_room_id_key unique (user_id, room_id),
  constraint user_rooms_room_id_fkey foreign KEY (room_id) references documents (id) on delete CASCADE,
  constraint user_rooms_role_check check (
    (role = any (array['owner'::text, 'editor'::text]))
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_rooms_user_id on public.user_rooms using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_rooms_room_id on public.user_rooms using btree (room_id) TABLESPACE pg_default;