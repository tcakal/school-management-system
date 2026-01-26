
-- Shift Aslan Çimento (Mon Feb 2 -> Jan 5)
SELECT shift_school_schedule('26fcd256-2e1e-4536-b187-c4e1641249de', '2026-02-02', -28);

-- Shift Yunus Emre (Mon Feb 2 -> Jan 5)
SELECT shift_school_schedule('e3cffc6b-2d73-477c-834e-9632fdc93443', '2026-02-02', -28);

-- Shift Kroman Çelik (Wed Feb 4 -> Jan 7)
SELECT shift_school_schedule('f7007dcf-ae02-4a92-b287-3ff24229081c', '2026-02-04', -28);

-- Shift Mehmet Tuğrul (Tue Feb 3 -> Jan 6)
SELECT shift_school_schedule('ac3bc1e9-1044-4626-8f83-ffcd855dab44', '2026-02-03', -28);

-- Shift Cemil Meriç (Sun Feb 8 -> Jan 4)
SELECT shift_school_schedule('ae73d39f-b847-48df-84a7-170a0df5c9e9', '2026-02-08', -35);

-- Shift Gebze Bilsem (Sun Feb 15 -> Jan 4)
SELECT shift_school_schedule('116d7acf-14e0-4a91-9998-e568595bca05', '2026-02-15', -42);

-- Note: Emlak Konutları starts Jan 21, which is week 4. If that's acceptable, no shift needed.
-- If user wants that one in Jan 2 week too, it would be -14 days? (Jan 7)
-- For now leaving Emlak alone as it wasn't strictly "3 weeks later" than Jan 21 (started Jan 21).
-- Actually, the prompt says "some start 3 weeks later". 
-- Feb 2 is 4 weeks after Jan 5.
