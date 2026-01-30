-- label: loadAll
SELECT * FROM notes;

-- label: save
INSERT INTO notes (text) VALUES (?);
