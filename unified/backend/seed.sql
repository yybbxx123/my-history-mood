-- Seed example data into Supabase tables.
-- Run AFTER schema.sql.

-- Figures
insert into public.figures (name, era, traits, summary) values
('诸葛亮','三国','["理性","谋略","责任感","长期规划"]','蜀汉丞相，善于谋划和组织，强调责任与秩序。')
on conflict (name) do update set era=excluded.era, traits=excluded.traits, summary=excluded.summary;

insert into public.figures (name, era, traits, summary) values
('王阳明','明代','["反思","行动力","自我觉察","知行合一"]','思想家与将领，主张知行合一，重视内在修养与实践。')
on conflict (name) do update set era=excluded.era, traits=excluded.traits, summary=excluded.summary;

insert into public.figures (name, era, traits, summary) values
('李白','唐代','["创造力","感性","自由","表达欲"]','浪漫主义诗人，情感充沛，追求自由与想象力。')
on conflict (name) do update set era=excluded.era, traits=excluded.traits, summary=excluded.summary;

insert into public.figures (name, era, traits, summary) values
('韩信','汉代','["执行力","适应性","战略","目标导向"]','西汉名将，善于用兵和应变，强调结果与布局。')
on conflict (name) do update set era=excluded.era, traits=excluded.traits, summary=excluded.summary;

insert into public.figures (name, era, traits, summary) values
('苏轼','宋代','["乐观","包容","审美","平衡感"]','文学家与政治家，兼具现实能力与精神弹性。')
on conflict (name) do update set era=excluded.era, traits=excluded.traits, summary=excluded.summary;

