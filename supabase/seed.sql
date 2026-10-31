-- Development-only test data. Run after schema.sql, then delete these rows
-- with: delete from public.reports where is_test = true;
insert into public.reports (reference_code, user_id, category, reason, brief_reason, description, ward, neighborhood, priority, status, is_test)
select 'TEST-001', u.id, 'Roads & sidewalks', 'A deep pothole is affecting two-wheelers near the market entrance.', 'Pothole near market entrance', 'A deep pothole is affecting two-wheelers near the market entrance.', 'Ward 12', 'Riverside', 'High', 'Submitted', true
from auth.users u where u.email = 'curiumakshat@gmail.com'
and not exists (select 1 from public.reports where reference_code = 'TEST-001');

insert into public.reports (reference_code, user_id, category, reason, brief_reason, description, ward, neighborhood, priority, status, is_test)
select 'TEST-002', u.id, 'Public lighting', 'The streetlight outside the community centre has been off since last week.', 'Streetlight out at community centre', 'The streetlight outside the community centre has been off since last week.', 'Ward 12', 'Riverside', 'Medium', 'In progress', true
from auth.users u where u.email = 'curiumakshat@gmail.com'
and not exists (select 1 from public.reports where reference_code = 'TEST-002');

insert into public.reports (reference_code, user_id, category, reason, brief_reason, description, ward, neighborhood, priority, status, is_test)
select 'TEST-003', u.id, 'Waste management', 'The public bin beside the bus stop is overflowing and needs collection.', 'Overflowing bin beside bus stop', 'The public bin beside the bus stop is overflowing and needs collection.', 'Ward 8', 'Old Town', 'Critical', 'Resolved', true
from auth.users u where u.email = 'curiumakshat@gmail.com'
and not exists (select 1 from public.reports where reference_code = 'TEST-003');
