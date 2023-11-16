import Database from "better-sqlite3";

interface Cache {
  findRowById(id: string): any;
  writeRow(params: {id: string; content: string; lastUsed: string}): void;
  deleteRowById(id: string): void;
}

export const createTranslationCache = (dbPath: string): Cache => {
  const db = new Database(dbPath);

  const findRowById = (id: string) => {
    const stmt = db.prepare("SELECT * FROM translation WHERE id = ?");
    return stmt.get(id);
  };

  const writeRow = ({
    id,
    content,
    lastUsed,
  }: {
    id: string;
    content: string;
    lastUsed: string;
  }) => {
    const stmt = db.prepare(
      "INSERT INTO translation (id, content, last_used) VALUES (?, ?, ?)"
    );
    stmt.run(id, content, lastUsed);
  };

  const deleteRowById = (id: string) => {
    const stmt = db.prepare("DELETE FROM translation WHERE id = ?");
    stmt.run(id);
  };

  return {
    findRowById,
    writeRow,
    deleteRowById,
  };
};

/* 
I can't think of a way without an interface to present how to manage the "cache", and at that point, just plain and simple HOOK IT UP to crowdin and let them do it and handle it
*/
