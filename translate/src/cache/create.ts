import Database from "better-sqlite3";
const db = new Database("./cache.sqlite3");

// Create the 'translation' table
export const createTable = () => {
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS translation (
            id TEXT PRIMARY KEY,
            content TEXT,
            last_used TEXT
        );
    `;
  db.exec(createTableQuery);
};
