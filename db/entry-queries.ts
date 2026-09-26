export const sql={
 claim:"UPDATE entries SET owner_id=? WHERE owner_id=''",
 list:"SELECT id,title,kind,starts,minutes,sound,notes,done,recurrence,(SELECT json_group_array(occurrence) FROM entry_completions WHERE entry_id=entries.id) AS completed FROM entries WHERE owner_id=? ORDER BY starts",
 create:"INSERT INTO entries (id,title,kind,starts,minutes,sound,notes,done,owner_id,recurrence) VALUES (?,?,?,?,?,?,?,?,?,?)",
 update:"UPDATE entries SET title=?,kind=?,starts=?,minutes=?,sound=?,notes=?,done=?,recurrence=CASE WHEN ? THEN ? ELSE recurrence END WHERE id=? AND owner_id=?",
 remove:"DELETE FROM entries WHERE id=? AND owner_id=?"
};
