CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_qr_value 
  ON tickets(qr_value);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_owner_match 
  ON tickets(owner_id, match_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_groups_status 
  ON ticket_groups(status, match_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_group 
  ON ticket_group_members(group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gate_snapshots_venue_time 
  ON gate_queue_snapshots(venue_id, recorded_at DESC);
