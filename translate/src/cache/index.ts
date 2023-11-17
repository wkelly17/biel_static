import Database, {type RunResult} from "better-sqlite3";

export interface Cache {
  findRowById(id: string): any;
  findByContent(content: string): any;
  findByManualContent(content: string): any;
  writeRow(params: {id: string; content: string; lastUsed: string}): void;
  updateManualTranslationCol(params: {
    rowId: string;
    manualContent: string;
    lastUsed: string;
  }): RunResult;
  deleteRowById(id: string): void;
}

export const createTranslationCache = (dbPath: string): Cache => {
  const db = new Database(dbPath);

  const findRowById = (id: string) => {
    const stmt = db.prepare("SELECT * FROM translation WHERE id = ?");
    return stmt.get(id);
  };
  const findByContent = (content: string) => {
    const stmt = db.prepare("SELECT * FROM translation WHERE content = ?");
    return stmt.get(content);
  };
  const findByManualContent = (content: string) => {
    const stmt = db.prepare(
      "SELECT * FROM translation WHERE manual_translation = ?"
    );
    return stmt.get(content);
  };
  const updateManualTranslationCol = ({
    rowId,
    manualContent,
    lastUsed,
  }: {
    rowId: string;
    manualContent: string;
    lastUsed: string;
  }) => {
    const updateQuery = `
    UPDATE translation
    SET manual_translation = @manualContent,
          last_used = @lastUsed
    WHERE id = @rowId;
`;

    return db.prepare(updateQuery).run({manualContent, rowId, lastUsed});
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
    findByContent,
    findByManualContent,
    updateManualTranslationCol,
    writeRow,
    deleteRowById,
  };
};

/* 
I can't think of a way without an interface to present how to manage the "cache", and at that point, just plain and simple HOOK IT UP to crowdin and let them do it and handle it
*/
