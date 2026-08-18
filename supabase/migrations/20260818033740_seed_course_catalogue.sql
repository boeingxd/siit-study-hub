-- Seeds the Digital Engineering (DE) program's major courses — SIIT's
-- CS-adjacent program (formerly ICT), renamed in the 2023 curriculum.
-- Sourced from SIIT's official 2023 Undergraduate Catalog:
-- https://admissions.siit.tu.ac.th/wp-content/uploads/2024/02/SIIT-Undergraduate-Catalog-2023.pdf
--
-- This is a deliberate partial seed (major/technical courses only, one
-- program deep) — matching docs/PLAN.md's cold-start strategy of depth in
-- one cohort over breadth across all of SIIT. General-ed and other
-- programs' courses can be added the same way once there's demand.
--
-- Runs as the migration role, which bypasses the courses_write_admin_only
-- RLS policy — this is how the catalogue is meant to be maintained, not
-- through the app.

insert into public.courses (code, title, program, credits) values
  ('DES102', 'Object-Oriented Programming', 'Digital Engineering (DE)', 3),
  ('DES103', 'Object-Oriented Programming Laboratory', 'Digital Engineering (DE)', 1),
  ('DES201', 'Discrete Mathematics', 'Digital Engineering (DE)', 3),
  ('DES221', 'Data Structures and Algorithms', 'Digital Engineering (DE)', 3),
  ('DES227', 'Algorithm Design', 'Digital Engineering (DE)', 3),
  ('DES229', 'Human Computer Interface Design', 'Digital Engineering (DE)', 3),
  ('DES231', 'Data Structures and Algorithms Laboratory', 'Digital Engineering (DE)', 1),
  ('DES232', 'Introduction to Data Communications', 'Digital Engineering (DE)', 3),
  ('DES322', 'Digital Business Experience', 'Digital Engineering (DE)', 3),
  ('DES324', 'Entrepreneurship for Digital Business', 'Digital Engineering (DE)', 3),
  ('DES329', 'System Analysis and Design', 'Digital Engineering (DE)', 3),
  ('DES331', 'Computer Networks Architectures and Protocols', 'Digital Engineering (DE)', 3),
  ('DES332', 'Computer and Network Security', 'Digital Engineering (DE)', 3),
  ('DES352', 'Networking Laboratory', 'Digital Engineering (DE)', 1),
  ('DES400', 'Project Development', 'Digital Engineering (DE)', 1),
  ('DES403', 'Digital Engineering Project', 'Digital Engineering (DE)', 5),
  ('DES421', 'Location-based Services and Digital Mapping', 'Digital Engineering (DE)', 3),
  ('DES422', 'Business Application Development', 'Digital Engineering (DE)', 3),
  ('DES423', 'Applied Machine Learning and AI', 'Digital Engineering (DE)', 3),
  ('DES424', 'Cloud-based Application Development', 'Digital Engineering (DE)', 3),
  ('DES431', 'Big Data Analytic and Machine Learning', 'Digital Engineering (DE)', 3),
  ('DES432', 'Statistics and Data Modeling', 'Digital Engineering (DE)', 3),
  ('DES433', 'Data Visualization', 'Digital Engineering (DE)', 3),
  ('DES435', 'Virtual Reality and Augmented Reality for Data Analytic', 'Digital Engineering (DE)', 3),
  ('CSS221', 'Computer Graphics and Applications', 'Digital Engineering (DE)', 3),
  ('CSS224', 'Computer Architectures', 'Digital Engineering (DE)', 3),
  ('CSS225', 'Operating System', 'Digital Engineering (DE)', 3),
  ('CSS322', 'Scientific Computing', 'Digital Engineering (DE)', 3),
  ('CSS324', 'Artificial Intelligence', 'Digital Engineering (DE)', 3),
  ('CSS325', 'Database Systems', 'Digital Engineering (DE)', 3),
  ('CSS326', 'Database Programming Laboratory', 'Digital Engineering (DE)', 1),
  ('CSS332', 'Microcontrollers and Applications', 'Digital Engineering (DE)', 3)
on conflict (code) do nothing;
