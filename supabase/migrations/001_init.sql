-- =========================================================
-- 遊んだ人記録アプリ 初期スキーマ（Supabase / PostgreSQL）
-- 記録の単位：1ゲーム = 1 session
-- =========================================================

-- ---------- tag（ゲームの特徴：人狼系, 大人数, FPS ...） ----------
create table public.tag (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 50),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- game（Among Us, Apex, 雑談 ...） ----------
create table public.game (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, title)
);

-- ---------- game_tag（ゲーム ⇔ タグ 多対多） ----------
create table public.game_tag (
  game_id uuid not null references public.game(id) on delete cascade,
  tag_id  uuid not null references public.tag(id)  on delete cascade,
  primary key (game_id, tag_id)
);
create index game_tag_tag_id_idx on public.game_tag (tag_id);

-- ---------- person（友人メモ） ----------
create table public.person (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 50),
  discord_id text check (discord_id ~ '^[0-9]{17,20}$'),  -- Discordのユーザーアイコン取得用（任意）
  memo       text,
  created_at timestamptz not null default now()
);
-- 同じDiscordユーザーを二重登録しない
create unique index person_user_discord_uidx
  on public.person (user_id, discord_id) where discord_id is not null;

-- ---------- session（遊んだ記録：1ゲーム1行） ----------
create table public.session (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  played_on  date not null,
  game_id    uuid not null references public.game(id) on delete restrict,  -- 記録があるゲームは消せない
  sort_order integer not null default 0,  -- 同じ日の中での並び順（1. 2. 3.）
  memo       text,
  created_at timestamptz not null default now()
);
create index session_user_date_idx on public.session (user_id, played_on);
create index session_game_id_idx   on public.session (game_id);

-- ---------- session_person（記録 ⇔ 参加者 多対多） ----------
create table public.session_person (
  session_id uuid not null references public.session(id) on delete cascade,
  person_id  uuid not null references public.person(id)  on delete cascade,
  primary key (session_id, person_id)
);
create index session_person_person_id_idx on public.session_person (person_id);


-- =========================================================
-- Row Level Security：自分のデータだけ読み書きできる
-- =========================================================
alter table public.tag            enable row level security;
alter table public.game           enable row level security;
alter table public.game_tag       enable row level security;
alter table public.person         enable row level security;
alter table public.session        enable row level security;
alter table public.session_person enable row level security;

create policy "own tag" on public.tag
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own game" on public.game
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own person" on public.person
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- session：他人のゲームを紐付けられないようにチェック
create policy "own session" on public.session
  for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.game g where g.id = game_id and g.user_id = auth.uid())
  );

-- 関係テーブル：両側とも自分のデータであること
create policy "own game_tag" on public.game_tag
  for all
  using (
    exists (select 1 from public.game g where g.id = game_id and g.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.game g where g.id = game_id and g.user_id = auth.uid())
    and exists (select 1 from public.tag t where t.id = tag_id and t.user_id = auth.uid())
  );

create policy "own session_person" on public.session_person
  for all
  using (
    exists (select 1 from public.session s where s.id = session_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.session s where s.id = session_id and s.user_id = auth.uid())
    and exists (select 1 from public.person p where p.id = person_id and p.user_id = auth.uid())
  );


-- =========================================================
-- カレンダー表示用ビュー（1行 = 1記録、タグと参加者をまとめて返す）
-- security_invoker で呼び出したユーザーのRLSがそのまま効く
-- =========================================================
create view public.session_detail
with (security_invoker = true) as
select
  s.id,
  s.played_on,
  s.sort_order,
  s.memo,
  g.id    as game_id,
  g.title as game_title,
  coalesce(
    (select array_agg(t.name order by t.name)
       from public.game_tag gt join public.tag t on t.id = gt.tag_id
      where gt.game_id = g.id),
    '{}'
  ) as tags,
  coalesce(
    (select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'discord_id', p.discord_id)
                      order by p.name)
       from public.session_person sp join public.person p on p.id = sp.person_id
      where sp.session_id = s.id),
    '[]'::jsonb
  ) as participants
from public.session s
join public.game g on g.id = s.game_id;