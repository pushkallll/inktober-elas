-- 0007_update_2026_prompts.sql
-- Update prompts to the official 2026 Inktober list

INSERT INTO public.prompts (day, prompt, active)
VALUES 
    (1, 'Apple', true),
    (2, 'Relic', true),
    (3, 'Miniature', true),
    (4, 'Cactus', true),
    (5, 'Smack', true),
    (6, 'Ogre', true),
    (7, 'Panic', true),
    (8, 'Stinky', true),
    (9, 'Ram', true),
    (10, 'Mystical', true),
    (11, 'Rescue', true),
    (12, 'Toss', true),
    (13, 'Flimsy', true),
    (14, 'Lady', true),
    (15, 'Hooray', true),
    (16, 'Gangly', true),
    (17, 'Contraption', true),
    (18, 'Flightless', true),
    (19, 'Confused', true),
    (20, 'Lounge', true),
    (21, 'Hero', true),
    (22, 'Beacon', true),
    (23, 'Dapper', true),
    (24, 'Bake', true),
    (25, 'Fracture', true),
    (26, 'Zip', true),
    (27, 'Dumb', true),
    (28, 'Trophy', true),
    (29, 'Tusk', true),
    (30, 'Cookie', true),
    (31, 'Flex', true)
ON CONFLICT (day) DO UPDATE SET prompt = EXCLUDED.prompt, active = EXCLUDED.active;
