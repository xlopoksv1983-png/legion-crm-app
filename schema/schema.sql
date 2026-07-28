-- ============================================================
-- Legion CRM — схема бази даних (PostgreSQL / Supabase)
-- ============================================================
-- Как использовать:
-- 1. Создать бесплатный проект на https://supabase.com
-- 2. Открыть SQL Editor -> New query
-- 3. Вставить весь этот файл и нажать Run
-- ============================================================

-- ---------- РОЛИ И ПОЛЬЗОВАТЕЛИ ----------
-- Supabase Auth уже создаёт таблицу auth.users. Мы добавляем profile-таблицу
-- со ссылкой на неё, где храним роль и связь с клиентом (если это клиент).

create type user_role as enum ('trainer', 'assistant', 'client');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  full_name text,
  created_at timestamptz not null default now()
);

-- ---------- СПРАВОЧНИКИ ----------

create table settings_lists (
  id bigint generated always as identity primary key,
  list_name text not null,        -- напр. 'статус', 'программа', 'группа_мышц'
  value text not null,
  sort_order int not null default 0,
  unique (list_name, value)
);

-- ---------- УПРАЖНЕНИЯ ----------

create table exercises (
  id bigint generated always as identity primary key,
  name text not null,
  muscle_group text not null,
  exercise_type text not null,     -- Базовое / Изолирующее
  equipment text,
  difficulty text,
  video_url text,
  technique_notes text,
  comment text,
  created_at timestamptz not null default now()
);

-- ---------- ПРОДУКТЫ ----------

create table products (
  id bigint generated always as identity primary key,
  name text not null,
  protein_100g numeric not null default 0,
  fat_100g numeric not null default 0,
  carbs_100g numeric not null default 0,
  kcal_100g numeric not null default 0,
  fiber_100g numeric not null default 0,
  salt_100g numeric not null default 0,
  glycemic_index numeric,
  created_at timestamptz not null default now()
);

-- ---------- КЛИЕНТЫ ----------

create table clients (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,  -- заполняется когда клиент регистрируется
  full_name text not null,
  phone text,
  telegram text,
  email text,
  height_cm numeric,
  start_weight_kg numeric,
  birth_date date,
  gender text,
  goal text,
  start_date date not null default current_date,
  next_report_date date,
  price numeric,
  last_payment_date date,
  status text not null default 'Активный',
  program text,
  nutrition_plan text,
  source text,
  trainer_comment text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create index on clients (status);
create index on clients (next_report_date);

-- ---------- АНКЕТА ----------

create table questionnaires (
  client_id bigint primary key references clients(id) on delete cascade,
  city text,
  desired_weight_kg numeric,
  desired_timeline text,
  priorities text,
  chronic_conditions text,
  surgeries text,
  injuries text,
  contraindications text,
  allergies text,
  medications text,
  doctor_recommendations text,
  profession text,
  activity_level text,
  daily_steps int,
  sleep_pattern text,
  stress_level text,
  water_l numeric,
  bad_habits text,
  training_experience text,
  favorite_exercises text,
  uncomfortable_exercises text,
  home_equipment text,
  meals_per_day int,
  food_preferences text,
  disliked_foods text,
  food_allergies text,
  dietary_restrictions text,
  updated_at timestamptz not null default now()
);

-- ---------- ТРЕНИРОВОЧНЫЕ ПРОГРАММЫ (план, задаёт тренер) ----------

create table workout_programs (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients(id) on delete cascade,
  day_name text not null,          -- "День 1", "Ноги", и т.д.
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table workout_program_exercises (
  id bigint generated always as identity primary key,
  program_id bigint not null references workout_programs(id) on delete cascade,
  exercise_id bigint not null references exercises(id),
  sort_order int not null default 0,
  target_sets int,
  target_reps text,           -- "8-10" диапазон или конкретное число
  target_weight numeric,
  target_rir numeric,
  tempo text,
  rest_seconds int,
  comment text
);

-- ---------- ФАКТИЧЕСКИЕ ТРЕНИРОВКИ (журнал) ----------

create table workout_logs (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients(id) on delete cascade,
  exercise_id bigint not null references exercises(id),
  log_date date not null default current_date,
  workout_type text,
  sets int,
  reps int,
  weight_kg numeric,
  rir numeric,
  rpe numeric,
  rest_seconds int,
  comment text,
  created_by uuid references profiles(id),   -- кто внёс запись (клиент или тренер)
  created_at timestamptz not null default now()
);

create index on workout_logs (client_id, log_date);

create table workout_feedback (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients(id) on delete cascade,
  log_date date not null default current_date,
  wellbeing text,
  energy_level text,
  sleep_quality text,
  motivation_level text,
  pain_discomfort text,
  comment text,
  created_at timestamptz not null default now()
);

-- ---------- КАРДИО ----------

create table cardio_logs (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients(id) on delete cascade,
  log_date date not null default current_date,
  cardio_type text,
  duration_min numeric,
  avg_heart_rate numeric,
  kcal numeric,
  distance_km numeric,
  comment text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index on cardio_logs (client_id, log_date);

-- ---------- ЗАМЕРЫ ----------

create table measurements (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients(id) on delete cascade,
  log_date date not null default current_date,
  weight_kg numeric,
  neck_cm numeric,
  shoulder_cm numeric,
  chest_cm numeric,
  waist_cm numeric,
  belly_cm numeric,
  hips_cm numeric,
  thigh_cm numeric,
  calf_cm numeric,
  comment text,
  created_at timestamptz not null default now()
);

create index on measurements (client_id, log_date);

-- ---------- ПИТАНИЕ ----------

create table nutrition_logs (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients(id) on delete cascade,
  log_date date not null default current_date,
  meal_type text,
  product_id bigint not null references products(id),
  weight_g numeric not null,
  comment text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index on nutrition_logs (client_id, log_date);

-- ---------- ФОТО ----------

create table photos (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients(id) on delete cascade,
  log_date date not null default current_date,
  photo_type text not null,   -- 'Профиль' / 'Прогресс'
  angle text,                 -- 'Перед' / 'Бок' / 'Спина' / 'Позирование'
  storage_path text not null, -- путь в Supabase Storage
  comment text,
  created_at timestamptz not null default now()
);

create index on photos (client_id, log_date);

-- ============================================================
-- ROW LEVEL SECURITY — права доступа как в ТЗ:
-- тренер видит и редактирует всё; клиент видит и редактирует
-- только свои данные, и только те поля, что разрешены (это
-- дополнительно ограничивается на уровне приложения / API).
-- ============================================================

alter table clients enable row level security;
alter table questionnaires enable row level security;
alter table workout_programs enable row level security;
alter table workout_program_exercises enable row level security;
alter table workout_logs enable row level security;
alter table workout_feedback enable row level security;
alter table cardio_logs enable row level security;
alter table measurements enable row level security;
alter table nutrition_logs enable row level security;
alter table photos enable row level security;

-- helper: узнать роль текущего пользователя
create or replace function my_role() returns user_role
language sql stable as $$
  select role from profiles where id = auth.uid();
$$;

-- helper: узнать client_id текущего пользователя (если это клиент)
create or replace function my_client_id() returns bigint
language sql stable as $$
  select id from clients where user_id = auth.uid();
$$;

-- Тренер/помощник видит и меняет всё
create policy "trainer full access clients" on clients for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client reads own row" on clients for select
  using (user_id = auth.uid());

create policy "trainer full access questionnaires" on questionnaires for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client own questionnaire" on questionnaires for all
  using (client_id = my_client_id()) with check (client_id = my_client_id());

create policy "trainer full access programs" on workout_programs for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client reads own programs" on workout_programs for select
  using (client_id = my_client_id());

create policy "trainer full access program_exercises" on workout_program_exercises for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client reads own program_exercises" on workout_program_exercises for select
  using (program_id in (select id from workout_programs where client_id = my_client_id()));

create policy "trainer full access workout_logs" on workout_logs for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client manages own workout_logs" on workout_logs for all
  using (client_id = my_client_id()) with check (client_id = my_client_id());

create policy "trainer full access workout_feedback" on workout_feedback for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client manages own workout_feedback" on workout_feedback for all
  using (client_id = my_client_id()) with check (client_id = my_client_id());

create policy "trainer full access cardio_logs" on cardio_logs for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client manages own cardio_logs" on cardio_logs for all
  using (client_id = my_client_id()) with check (client_id = my_client_id());

create policy "trainer full access measurements" on measurements for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client manages own measurements" on measurements for all
  using (client_id = my_client_id()) with check (client_id = my_client_id());

create policy "trainer full access nutrition_logs" on nutrition_logs for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client manages own nutrition_logs" on nutrition_logs for all
  using (client_id = my_client_id()) with check (client_id = my_client_id());

create policy "trainer full access photos" on photos for all
  using (my_role() in ('trainer','assistant')) with check (my_role() in ('trainer','assistant'));
create policy "client manages own photos" on photos for all
  using (client_id = my_client_id()) with check (client_id = my_client_id());

-- exercises, products, settings_lists, profiles: читают все авторизованные,
-- редактирует только тренер
alter table exercises enable row level security;
alter table products enable row level security;
alter table settings_lists enable row level security;
alter table profiles enable row level security;

create policy "everyone reads exercises" on exercises for select using (auth.uid() is not null);
create policy "trainer manages exercises" on exercises for insert with check (my_role()='trainer');
create policy "trainer updates exercises" on exercises for update using (my_role()='trainer');
create policy "trainer deletes exercises" on exercises for delete using (my_role()='trainer');

create policy "everyone reads products" on products for select using (auth.uid() is not null);
create policy "trainer manages products" on products for insert with check (my_role()='trainer');
create policy "trainer updates products" on products for update using (my_role()='trainer');
create policy "trainer deletes products" on products for delete using (my_role()='trainer');

create policy "everyone reads settings_lists" on settings_lists for select using (auth.uid() is not null);
create policy "trainer manages settings_lists" on settings_lists for all using (my_role()='trainer');

create policy "user reads own profile" on profiles for select using (id = auth.uid());
create policy "trainer reads all profiles" on profiles for select using (my_role() in ('trainer','assistant'));
create policy "user updates own profile" on profiles for update using (id = auth.uid());

-- ============================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ (справочники + примеры упражнений/продуктов)
-- ============================================================

insert into settings_lists (list_name, value, sort_order) values
  ('статус','Активный',1),('статус','Пауза',2),('статус','Закончил',3),('статус','Архив',4),
  ('программа','Full Body',1),('программа','Верх / Низ',2),('программа','Push Pull Legs',3),('программа','Индивидуальная',4),
  ('цель','Похудение',1),('цель','Набор массы',2),('цель','Рекомпозиция',3),('цель','Поддержание',4),('цель','Реабилитация',5),
  ('источник','Instagram',1),('источник','Telegram',2),('источник','Рекомендация',3),('источник','Сайт',4),('источник','Другое',5),
  ('группа_мышц','Грудь',1),('группа_мышц','Спина',2),('группа_мышц','Ноги',3),('группа_мышц','Плечи',4),
  ('группа_мышц','Бицепс',5),('группа_мышц','Трицепс',6),('группа_мышц','Пресс',7),('группа_мышц','Ягодицы',8),
  ('группа_мышц','Икры',9),('группа_мышц','Кор',10),
  ('тип_кардио','Ходьба',1),('тип_кардио','Бег',2),('тип_кардио','Велосипед',3),('тип_кардио','Эллипс',4),('тип_кардио','Плавание',5),
  ('приём_пищи','Завтрак',1),('приём_пищи','Обед',2),('приём_пищи','Ужин',3),('приём_пищи','Перекус',4);

insert into exercises (name, muscle_group, exercise_type, equipment, difficulty) values
  ('Приседания со штангой','Ноги','Базовое','Штанга','Средний'),
  ('Жим лёжа','Грудь','Базовое','Штанга','Средний'),
  ('Становая тяга','Спина','Базовое','Штанга','Продвинутый'),
  ('Подтягивания','Спина','Базовое','Собственный вес','Средний'),
  ('Жим штанги стоя','Плечи','Базовое','Штанга','Средний');

insert into products (name, protein_100g, fat_100g, carbs_100g, kcal_100g) values
  ('Куриная грудка', 23.0, 1.9, 0.4, 113),
  ('Рис белый варёный', 2.7, 0.3, 28.0, 130),
  ('Яйцо куриное', 12.7, 10.9, 0.7, 155),
  ('Овсянка на воде', 2.5, 1.7, 12.0, 71),
  ('Творог 5%', 18.0, 5.0, 3.0, 121);

-- ============================================================
-- ХРАНИЛИЩЕ ФОТО (Supabase Storage)
-- ============================================================
-- Создаём приватный bucket "photos". Пути внутри: {client_id}/{filename}
-- Доступ: тренер видит все фото; клиент — только свои (проверка по
-- первой части пути = его client_id).

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "trainer reads all photos storage" on storage.objects for select
  using (bucket_id = 'photos' and my_role() in ('trainer','assistant'));

create policy "trainer uploads photos storage" on storage.objects for insert
  with check (bucket_id = 'photos' and my_role() in ('trainer','assistant'));

create policy "client reads own photos storage" on storage.objects for select
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = my_client_id()::text);

create policy "client uploads own photos storage" on storage.objects for insert
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = my_client_id()::text);
