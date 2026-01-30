# 🗄️ SQL Siblings

Viand allows you to write raw SQL files (`.sql`) alongside your `.viand` components. These are automatically transpiled into server-side API endpoints powered by **Nitro**.

## How it works

1.  Create a `.sql` file (e.g., `Blog.sql`).
2.  Use comments to define metadata like specific methods or labels.
3.  Viand's CLI detects these files and generates a Nitro event handler (`Blog.sql.ts`).
4.  The handler connects to your database (configured via `db.ts` or environment variables) and executes the query.

## Syntax

```sql
-- label: getLatestPosts
-- method: GET
-- path: /api/posts/latest
SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;

-- label: getPostById
-- params: id
-- method: GET
-- path: /api/posts/:id
SELECT * FROM posts WHERE id = :id;
```

## Parameter Binding

Viand supports named parameters using the `:paramName` syntax. These are automatically safely bound to the underlying driver (e.g., `better-sqlite3`, `postgres`).

- URL Parameters: `/api/posts/:id` -> `:id`
- Query Strings: `?foo=bar` -> `:foo`
- JSON Body: `{ "foo": "bar" }` -> `:foo`

## Database Connection

For the prototype phase, Viand expects a `db.ts` (or similar connector) to export a function that returns a database instance compatible with `prepare/run/all` (like `better-sqlite3`).

Future versions will support `DATABASE_URL` auto-configuration.
