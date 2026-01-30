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

  if (label === "getLatestPosts" || (method === "GET" && event.path.startsWith("/api/v1/posts/latest"))) {
    console.log("🗄️ Viand SQL Execute: getLatestPosts");
    const db = getDB();
    try {
      const stmt = db.prepare(`SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;`);
      const result = stmt.all(allParams);
      return result;
    } catch (err: any) {
      return { fatal: true, error: err.message, label: "getLatestPosts" };
    }
  }
  else if (label === "getPostById" || (method === "GET" && event.path.startsWith("/api/v1/posts/"))) {
    console.log("🗄️ Viand SQL Execute: getPostById");
    const db = getDB();
    try {
      const stmt = db.prepare(`SELECT * FROM posts WHERE id = :id;`);
      const result = stmt.all(allParams);
      return result;
    } catch (err: any) {
      return { fatal: true, error: err.message, label: "getPostById" };
    }
  }

  return {
    error: 'No matching Viand SQL endpoint found',
    path: event.path,
    method
  };
});
