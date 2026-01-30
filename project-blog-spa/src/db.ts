import Database from 'better-sqlite3';
import path from 'path';

let db: any = null;

export default function getDB() {
  if (db) return db;

  const dbPath = path.resolve(process.cwd(), 'viand_test.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      author_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countStmt = db.prepare('SELECT count(*) as count FROM posts');
  const countResult = (countStmt.get() as any);
  if (!countResult || countResult.count === 0) {
    console.log("🌱 Seeding Viand Test Database...");
    const insert = db.prepare('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)');
    insert.run('Hello Viand!', 'This is the first post from a real SQLite database.', 'user1');
    insert.run('Nitro Bridge', 'The bridge is officially carrying SQL traffic.', 'user1');
    insert.run('Sibling Power', 'Siblings make data fetching a breeze.', 'user2');
  }

  return db;
}
