-- Performance indexes
create index if not exists idx_roadmaps_student_id on roadmaps(student_id);
create index if not exists idx_nodes_roadmap_id on nodes(roadmap_id);
create index if not exists idx_node_completions_student_node on node_completions(student_id, node_id);
create index if not exists idx_chat_messages_student_created on chat_messages(student_id, created_at);
create index if not exists idx_coding_challenges_student_id on coding_challenges(student_id);
create index if not exists idx_study_time_events_student_recorded on study_time_events(student_id, recorded_at);
create index if not exists idx_milestone_test_attempts_student_test on milestone_test_attempts(student_id, test_id);
