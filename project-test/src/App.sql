-- label: loadAll
SELECT * FROM todos ORDER BY id DESC;

-- label: save
INSERT INTO todos (text, done) VALUES (?, false);
