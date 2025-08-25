create table public.documents (
  id uuid not null default gen_random_uuid (),
  title text not null default 'Untitled Document'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  content text null default ''::text,
  type text not null default 'document'::text,
  parent_id uuid null,
  order_index integer not null default 0,
  constraint documents_pkey primary key (id),
  constraint documents_parent_id_fkey foreign KEY (parent_id) references documents (id) on delete CASCADE,
  constraint documents_type_check check (
    (
      type = any (array['document'::text, 'folder'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_documents_updated_at on public.documents using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_documents_content_gin on public.documents using gin (to_tsvector('english'::regconfig, content)) TABLESPACE pg_default;

create index IF not exists idx_documents_title_gin on public.documents using gin (to_tsvector('english'::regconfig, title)) TABLESPACE pg_default;

create index IF not exists idx_documents_content_length on public.documents using btree (length(content)) TABLESPACE pg_default;

create index IF not exists idx_documents_title_length on public.documents using btree (length(title)) TABLESPACE pg_default;

create index IF not exists idx_documents_parent_id on public.documents using btree (parent_id) TABLESPACE pg_default;

create index IF not exists idx_documents_order_index on public.documents using btree (order_index) TABLESPACE pg_default;

create index IF not exists idx_documents_type on public.documents using btree (type) TABLESPACE pg_default;

create trigger update_documents_updated_at BEFORE
update on documents for EACH row
execute FUNCTION update_updated_at_column ();