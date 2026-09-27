-- 0003_seed_prompts.sql
-- Seed the database with Inktober prompts

INSERT INTO public.prompts (day, prompt, active)
VALUES 
    (1, 'Dream', true),
    (2, 'Discover', true),
    (3, 'Boots', true),
    (4, 'Exotic', true),
    (5, 'Binoculars', true),
    (6, 'Trek', true),
    (7, 'Passport', true),
    (8, 'Hike', true),
    (9, 'Sun', true),
    (10, 'Nomadic', true),
    (11, 'Snacks', true),
    (12, 'Remote', true),
    (13, 'Horizon', true),
    (14, 'Roam', true),
    (15, 'Guidebook', true),
    (16, 'Grungy', true),
    (17, 'Journal', true),
    (18, 'Drive', true),
    (19, 'Ridge', true),
    (20, 'Uncharted', true),
    (21, 'Rhinoceros', true),
    (22, 'Camp', true),
    (23, 'Rust', true),
    (24, 'Expedition', true),
    (25, 'Scarecrow', true),
    (26, 'Camera', true),
    (27, 'Road', true),
    (28, 'Jumbo', true),
    (29, 'Navigator', true),
    (30, 'Violin', true),
    (31, 'Landmark', true)
ON CONFLICT (day) DO UPDATE SET prompt = EXCLUDED.prompt, active = EXCLUDED.active;
