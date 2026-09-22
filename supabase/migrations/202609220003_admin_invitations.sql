create table if not exists public.admin_users (
  email text primary key,
  password_salt text not null,
  password_hash text not null,
  invited_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_invitations (
  id uuid primary key,
  email text not null unique,
  token_hash text not null unique,
  invited_by text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz
);

alter table public.admin_users enable row level security;
alter table public.admin_invitations enable row level security;

create or replace function public.accept_admin_invitation(
  invitation_id uuid,
  invited_email text,
  password_salt text,
  password_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted_email text;
  inviter_email text;
begin
  update public.admin_invitations
  set accepted_at = now()
  where id = invitation_id
    and email = invited_email
    and accepted_at is null
    and expires_at > now()
  returning email, invited_by into accepted_email, inviter_email;

  if accepted_email is null then
    return false;
  end if;

  insert into public.admin_users (email, password_salt, password_hash, invited_by)
  values (accepted_email, password_salt, password_hash, inviter_email);

  return true;
end;
$$;

revoke all on function public.accept_admin_invitation(uuid, text, text, text) from public;
grant execute on function public.accept_admin_invitation(uuid, text, text, text) to service_role;
