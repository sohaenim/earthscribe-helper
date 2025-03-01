-- Create verified_claims table
create table if not exists verified_claims (
  id uuid default uuid_generate_v4() primary key,
  claim_hash text not null unique,
  is_verified boolean not null,
  confidence float not null,
  sources jsonb not null default '[]',
  alternative_sources jsonb,
  explanation text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index on claim_hash for faster lookups
create index if not exists verified_claims_claim_hash_idx on verified_claims(claim_hash);

-- Add RLS policies
alter table verified_claims enable row level security;

create policy "Public verified_claims are viewable by everyone"
  on verified_claims for select
  using (true);

create policy "Authenticated users can insert verified_claims"
  on verified_claims for insert
  with check (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_verified_claims_updated_at
  before update on verified_claims
  for each row
  execute function update_updated_at_column();
