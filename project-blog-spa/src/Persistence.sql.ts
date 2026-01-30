import { eventHandler, readBody, getMethod, getRouterParams } from 'h3';
// @ts-ignore
import getDB from './db.js';

export default eventHandler(async (event) => {
  const method = getMethod(event).toUpperCase();
  const params = getRouterParams(event);
  let urlObj;
  try {
    // Fallback base for relative paths
    urlObj = new URL(event.path || '', 'http://localhost');
  } catch (e) {
    urlObj = new URL('http://localhost');
  }
  const queryParams = Object.fromEntries(urlObj.searchParams);
  let label = urlObj.searchParams.get('__label');
  let body: any = {};
  
  if (method !== 'GET') {
    try {
      body = await readBody(event) || {};
      if (body.__label) label = body.__label;
    } catch (e) {}
  }

  // Combine all possible parameter sources
  const allParams = { ...queryParams, ...params, ...body };

  if (label === "loadAll" || (method === "POST" && event.path.startsWith("/api/sql/loadAll"))) {
    console.log("🗄️ Viand SQL Execute: loadAll");
    const db = getDB();
    try {
      const stmt = db.prepare(`SELECT * FROM notes;`);
      const result = stmt.all(allParams);
      return result;
    } catch (err: any) {
      return { fatal: true, error: err.message, label: "loadAll" };
    }
  }
  else if (label === "save" || (method === "POST" && event.path.startsWith("/api/sql/save"))) {
    console.log("🗄️ Viand SQL Execute: save");
    const db = getDB();
    try {
      const stmt = db.prepare(`INSERT INTO notes (text) VALUES (?);`);
      const result = stmt.run(allParams);
      return { success: true, ...result };
    } catch (err: any) {
      return { fatal: true, error: err.message, label: "save" };
    }
  }

  return {
    error: 'No matching Viand SQL endpoint found',
    path: event.path,
    method
  };
});
