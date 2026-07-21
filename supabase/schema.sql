create table if not exists scores (
  id bigint generated always as identity primary key,
  winner_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

create index if not exists scores_score_idx on scores (score desc, created_at asc);
