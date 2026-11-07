const express = require('express');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new DatabaseSync(path.join(__dirname, 'data.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    done INTEGER NOT NULL DEFAULT 0
  )
`);

function toTask(row) {
  return { ...row, done: Boolean(row.done) };
}

app.get('/api/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY id').all();
  res.json(rows.map(toTask));
});

app.get('/api/tasks/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Задача не найдена' });
  res.json(toTask(row));
});

app.post('/api/tasks', (req, res) => {
  const { title, description = '' } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Введите название' });
  }
  if (typeof description !== 'string') {
    return res.status(400).json({ error: 'Описание должно быть строкой' });
  }
  const result = db.prepare(
    'INSERT INTO tasks (title, description) VALUES (?, ?)'
  ).run(title.trim(), description.trim());
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(toTask(row));
});

app.patch('/api/tasks/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Задача не найдена' });

  const body = req.body || {};
  const title = body.title === undefined ? row.title : body.title;
  const description = body.description === undefined ? row.description : body.description;
  const done = body.done === undefined ? Boolean(row.done) : body.done;
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Введите название' });
  }
  if (typeof description !== 'string' || typeof done !== 'boolean') {
    return res.status(400).json({ error: 'Проверьте описание и признак выполнения' });
  }
  db.prepare('UPDATE tasks SET title = ?, description = ?, done = ? WHERE id = ?')
    .run(title.trim(), description.trim(), Number(done), row.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(row.id);
  res.json(toTask(updated));
});

app.delete('/api/tasks/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }
  res.status(204).end();
});

app.use((error, req, res, next) => {
  if (error.status === 400) {
    return res.status(400).json({ error: 'Некорректный JSON' });
  }
  console.error(error);
  res.status(500).json({ error: 'Ошибка сервера' });
});

app.listen(3000, () => console.log('Откройте http://localhost:3000'));
