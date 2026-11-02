create extension if not exists pgcrypto;
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,display_name text,created_at timestamptz default now());
create table public.courses(id uuid primary key default gen_random_uuid(),title text not null,description text not null,topic text not null);
create table public.enrollments(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,course_id uuid not null references public.courses(id),progress_percent numeric not null default 0 check(progress_percent between 0 and 100),unique(user_id,course_id));
create table public.learning_sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,course_id uuid not null references public.courses(id),started_at timestamptz not null default now(),ended_at timestamptz,minutes_spent integer check(minutes_spent>=0));
create table public.quizzes(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id),title text not null);
create table public.questions(id uuid primary key default gen_random_uuid(),quiz_id uuid not null references public.quizzes(id),position integer not null,prompt text not null,explanation text not null,unique(quiz_id,position));
create table public.question_options(id uuid primary key default gen_random_uuid(),question_id uuid not null references public.questions(id),position integer not null,label text not null,is_correct boolean not null default false,unique(question_id,position));
create unique index one_correct_per_question on public.question_options(question_id) where is_correct;
create table public.quiz_attempts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,quiz_id uuid not null references public.quizzes(id),submission_id uuid not null,score integer not null,total integer not null check(total>0),percentage integer not null check(percentage between 0 and 100),submitted_at timestamptz not null default now(),unique(user_id,submission_id));
create table public.attempt_answers(id uuid primary key default gen_random_uuid(),attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,question_id uuid not null references public.questions(id),selected_option_id uuid references public.question_options(id),correct_option_id uuid not null references public.question_options(id),is_correct boolean not null,question_snapshot text not null,selected_snapshot text,correct_snapshot text not null,explanation_snapshot text not null,unique(attempt_id,question_id));
create index on public.quiz_attempts(user_id,submitted_at desc);create index on public.learning_sessions(user_id,started_at desc);
alter table public.profiles enable row level security;alter table public.courses enable row level security;alter table public.enrollments enable row level security;alter table public.learning_sessions enable row level security;alter table public.quizzes enable row level security;alter table public.questions enable row level security;alter table public.question_options enable row level security;alter table public.quiz_attempts enable row level security;alter table public.attempt_answers enable row level security;
create policy profiles_owner on public.profiles for select to authenticated using(id=auth.uid());
create policy courses_read on public.courses for select to authenticated using(true);
create policy enrollments_owner on public.enrollments for select to authenticated using(user_id=auth.uid());
create policy sessions_owner on public.learning_sessions for select to authenticated using(user_id=auth.uid());
create policy quizzes_read on public.quizzes for select to authenticated using(true);
create policy questions_read on public.questions for select to authenticated using(true);
-- No direct SELECT policy on question_options: correct answer flags remain server-only.
create policy attempts_owner on public.quiz_attempts for select to authenticated using(user_id=auth.uid());
create policy answers_owner on public.attempt_answers for select to authenticated using(exists(select 1 from public.quiz_attempts a where a.id=attempt_id and a.user_id=auth.uid()));
-- Only server-side service role can execute this write function; never expose it to authenticated/anon.
create or replace function public.save_quiz_attempt(p_user_id uuid,p_quiz_id uuid,p_submission_id uuid,p_score integer,p_total integer,p_percentage integer,p_answers jsonb)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_id uuid; v_item jsonb;
begin
 insert into public.quiz_attempts(user_id,quiz_id,submission_id,score,total,percentage) values(p_user_id,p_quiz_id,p_submission_id,p_score,p_total,p_percentage)
 on conflict(user_id,submission_id) do nothing returning id into v_id;
 if v_id is null then select id into v_id from public.quiz_attempts where user_id=p_user_id and submission_id=p_submission_id;return v_id;end if;
 for v_item in select * from jsonb_array_elements(p_answers) loop
 insert into public.attempt_answers(attempt_id,question_id,selected_option_id,correct_option_id,is_correct,question_snapshot,selected_snapshot,correct_snapshot,explanation_snapshot)
 values(v_id,(v_item->>'question_id')::uuid,nullif(v_item->>'selected_option_id','')::uuid,(v_item->>'correct_option_id')::uuid,(v_item->>'is_correct')::boolean,v_item->>'question_snapshot',v_item->>'selected_snapshot',v_item->>'correct_snapshot',v_item->>'explanation_snapshot');
 end loop;
 return v_id;
end $$;
revoke all on function public.save_quiz_attempt(uuid,uuid,uuid,integer,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function public.save_quiz_attempt(uuid,uuid,uuid,integer,integer,integer,jsonb) to service_role;
insert into public.courses(id,title,description,topic) values('11111111-1111-4111-8111-111111111111','JavaScript Fundamentals','Practice variables, functions and arrays.','Programming'),('22222222-2222-4222-8222-222222222222','Study Skills','Build effective learning habits.','Learning');
insert into public.quizzes(id,course_id,title) values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','JavaScript Basics'),('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','Learning Strategies');
insert into public.questions(id,quiz_id,position,prompt,explanation) values
('50000000-0000-4000-8000-000000000001','33333333-3333-4333-8333-333333333333',1,'Which keyword declares a block-scoped variable?','let and const are block-scoped; var is function-scoped.'),
('50000000-0000-4000-8000-000000000002','33333333-3333-4333-8333-333333333333',2,'Which array method creates a new array by transforming each element?','map returns a new array containing transformed values.'),
('50000000-0000-4000-8000-000000000003','44444444-4444-4444-8444-444444444444',1,'Which practice best supports long-term retention?','Spaced repetition revisits material across increasing intervals.'),
('50000000-0000-4000-8000-000000000004','44444444-4444-4444-8444-444444444444',2,'What is active recall?','Active recall means retrieving information from memory without looking at the answer.');
insert into public.question_options(question_id,position,label,is_correct) values
('50000000-0000-4000-8000-000000000001',1,'var',false),('50000000-0000-4000-8000-000000000001',2,'let',true),('50000000-0000-4000-8000-000000000001',3,'function',false),('50000000-0000-4000-8000-000000000001',4,'import',false),
('50000000-0000-4000-8000-000000000002',1,'push',false),('50000000-0000-4000-8000-000000000002',2,'pop',false),('50000000-0000-4000-8000-000000000002',3,'map',true),('50000000-0000-4000-8000-000000000002',4,'shift',false),
('50000000-0000-4000-8000-000000000003',1,'Cramming once',false),('50000000-0000-4000-8000-000000000003',2,'Spaced repetition',true),('50000000-0000-4000-8000-000000000003',3,'Only rereading',false),('50000000-0000-4000-8000-000000000003',4,'Skipping review',false),
('50000000-0000-4000-8000-000000000004',1,'Copying notes',false),('50000000-0000-4000-8000-000000000004',2,'Highlighting everything',false),('50000000-0000-4000-8000-000000000004',3,'Testing yourself from memory',true),('50000000-0000-4000-8000-000000000004',4,'Reading answers immediately',false);
