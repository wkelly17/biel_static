import Database from "better-sqlite3";
const db = new Database("cache.sqlite3");
// Function to find a row by ID (sha)

export const findRowById = (id: string) => {
  const stmt = db.prepare("SELECT * FROM translation WHERE id = ?");
  return stmt.get(id);
};

// Function to write a new row
type writeRowParams = {
  id: string;
  content: string;
  lastUsed: string;
};
export const writeRow = ({id, content, lastUsed}: writeRowParams) => {
  const stmt = db.prepare(
    "INSERT INTO translation (id, content, last_used) VALUES (?, ?, ?)"
  );
  stmt.run(id, content, lastUsed);
};

// Function to delete a row by ID
export const deleteRowById = (id: string) => {
  const stmt = db.prepare("DELETE FROM translation WHERE id = ?");
  stmt.run(id);
};
