const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const tasks = [
  { id: 1, title: 'Прочитать методичку', category: 'Учеба', done: true },
  { id: 2, title: 'Установить Node.js', category: 'Учеба', done: true },
  { id: 3, title: 'Разобрать Express', category: 'Учеба', done: false },
  { id: 4, title: 'Купить продукты', category: 'Дом', done: false },
  { id: 5, title: 'Убрать комнату', category: 'Дом', done: true },
  { id: 6, title: 'Проверить API', category: 'Учеба', done: false }
];

let nextId = 7;

app.get('/api/tasks', (req, res) => {
  let result = tasks;

  if (req.query.done !== undefined) {
    if (req.query.done !== 'true' && req.query.done !== 'false') {
      return res.status(400).json({
        error: 'done должен быть true или false'
      });
    }

    const done = req.query.done === 'true';
    result = result.filter(task => task.done === done);
  }

  if (req.query.q !== undefined) {
    if (typeof req.query.q !== 'string') {
      return res.status(400).json({
        error: 'q должен быть строкой'
      });
    }

    const q = req.query.q.trim().toLowerCase();
    result = result.filter(task => task.title.toLowerCase().includes(q));
  }

  res.json(result);
});

app.get('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(task => task.id === id);

  if (!task) {
    return res.status(404).json({
      error: 'Not found'
    });
  }

  res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const body = req.body || {};

  if (typeof body.title !== 'string' || body.title.trim() === '') {
    return res.status(400).json({
      error: 'Укажите название задачи'
    });
  }

  if (typeof body.category !== 'string' || body.category.trim() === '') {
    return res.status(400).json({
      error: 'Укажите категорию'
    });
  }

  const task = {
    id: nextId,
    title: body.title.trim(),
    category: body.category.trim(),
    done: false
  };

  nextId = nextId + 1;
  tasks.push(task);

  res.status(201).json(task);
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Tasks API',
    version: 1,
    items: tasks.length
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (status === 400) {
    return res.status(400).json({
      error: 'Некорректный JSON'
    });
  }

  res.status(status).json({
    error: 'Ошибка обработки запроса'
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});