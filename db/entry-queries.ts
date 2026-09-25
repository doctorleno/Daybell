export const sql={
 claim:"UPDATE entries SET owner_id=? WHERE owner_id=''",
 list:"SELECT id,title,kind,starts,minutes,sound,notes,done FROM entries WHERE owner_id=? ORDER BY starts",
 create:"INSERT INTO entries (id,title,kind,starts,minutes,sound,notes,done,owner_id) VALUES (?,?,?,?,?,?,?,?,?)",
 update:"UPDATE entries SET title=?,kind=?,starts=?,minutes=?,sound=?,notes=?,done=? WHERE id=? AND owner_id=?",
 remove:"DELETE FROM entries WHERE id=? AND owner_id=?"
};
