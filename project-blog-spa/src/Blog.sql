-- label: getLatestPosts
-- method: GET
-- path: /api/v1/posts/latest
SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;

-- label: getPostById
-- params: id: number
-- method: GET
-- path: /api/v1/posts/:id
SELECT * FROM posts WHERE id = :id;
