-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Earth Science terminology table
create table if not exists earth_science_terms (
  id uuid default uuid_generate_v4() primary key,
  term text not null unique,
  definition text not null,
  category text[] not null,
  related_terms text[] not null default '{}',
  sources text[] not null default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Journal suggestions table
create table if not exists journal_suggestions (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  publisher text not null,
  impact_factor float not null,
  scope text[] not null,
  citation_style text not null,
  website text not null,
  submission_guidelines text not null,
  field text not null,
  search_vector tsvector,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create function to update search vector
create or replace function journal_suggestions_search_vector_update() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.publisher, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.scope, ' '), '')), 'C');
  return new;
end;
$$ language plpgsql;

-- Create trigger for search vector updates
create trigger journal_suggestions_search_vector_trigger
  before insert or update
  on journal_suggestions
  for each row
  execute function journal_suggestions_search_vector_update();

-- Citation patterns table
create table if not exists citation_patterns (
  id uuid default uuid_generate_v4() primary key,
  field text not null,
  pattern text not null,
  example text not null,
  frequency float not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists earth_science_terms_term_idx on earth_science_terms(term);
create index if not exists earth_science_terms_category_idx on earth_science_terms using gin(category);
create index if not exists journal_suggestions_search_idx on journal_suggestions using gin(search_vector);
create index if not exists journal_suggestions_field_idx on journal_suggestions(field);
create index if not exists citation_patterns_field_idx on citation_patterns(field);

-- Add RLS policies
alter table earth_science_terms enable row level security;
alter table journal_suggestions enable row level security;
alter table citation_patterns enable row level security;

-- Public read access
create policy "Public earth_science_terms are viewable by everyone"
  on earth_science_terms for select
  using (true);

create policy "Public journal_suggestions are viewable by everyone"
  on journal_suggestions for select
  using (true);

create policy "Public citation_patterns are viewable by everyone"
  on citation_patterns for select
  using (true);

-- Authenticated users can insert/update
create policy "Authenticated users can insert earth_science_terms"
  on earth_science_terms for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update earth_science_terms"
  on earth_science_terms for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert journal_suggestions"
  on journal_suggestions for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update journal_suggestions"
  on journal_suggestions for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert citation_patterns"
  on citation_patterns for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update citation_patterns"
  on citation_patterns for update
  using (auth.role() = 'authenticated');

-- Update triggers for updated_at
create trigger update_earth_science_terms_updated_at
  before update on earth_science_terms
  for each row
  execute function update_updated_at_column();

create trigger update_journal_suggestions_updated_at
  before update on journal_suggestions
  for each row
  execute function update_updated_at_column();

create trigger update_citation_patterns_updated_at
  before update on citation_patterns
  for each row
  execute function update_updated_at_column();
