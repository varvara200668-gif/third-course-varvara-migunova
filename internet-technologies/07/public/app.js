let tasks = [];
let loading = false;

const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const descriptionInput = document.querySelector('#task-description');
const list = document.querySelector('#task-list');
const message = document.querySelector('#message');
const refreshButton = document.querySelector('#refresh');

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? 'error' : '';
}

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error('Сервер недоступен. Запустите его и нажмите «Обновить список».');
  }

  if (!response.ok) {
    let text = 'HTTP ' + response.status;
    try {
      const data = await response.json();
      text += ': ' + (data.error || 'Ошибка запроса');
    } catch {
    }
    throw new Error(text);
  }
  if (response.status === 204) return null;
  return response.json();
}

function render() {
  list.replaceChildren();
  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Список пуст';
    list.append(empty);
    return;
  }

  for (const task of tasks) {
    const li = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = task.title;
    if (task.done) title.className = 'done';

    const description = document.createElement('p');
    description.textContent = task.description;
    const status = document.createElement('p');
    status.textContent = task.done ? 'Выполнена' : 'Не выполнена';

    const changeButton = document.createElement('button');
    changeButton.textContent = task.done ? 'Вернуть в работу' : 'Выполнить';
    changeButton.addEventListener('click', () => {
      runOperation(async () => {
        await request('/api/tasks/' + task.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done: !task.done })
        });
        await refreshTasks();
        showMessage('Задача изменена');
      });
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => {
      if (!confirm('Удалить задачу «' + task.title + '»?')) return;
      runOperation(async () => {
        await request('/api/tasks/' + task.id, { method: 'DELETE' });
        await refreshTasks();
        showMessage('Задача удалена');
      });
    });

    li.append(title, description, status, changeButton, deleteButton);
    list.append(li);
  }
}

async function refreshTasks() {
  tasks = await request('/api/tasks');
  render();
}

async function runOperation(action) {
  if (loading) return;
  loading = true;
  document.querySelectorAll('button').forEach(button => button.disabled = true);
  showMessage('Загрузка...');
  try {
    await action();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    loading = false;
    document.querySelectorAll('button').forEach(button => button.disabled = false);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!titleInput.value.trim()) {
    showMessage('Введите название', true);
    return;
  }
  runOperation(async () => {
    await request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim()
      })
    });
    form.reset();
    await refreshTasks();
    showMessage('Задача добавлена');
  });
});

function loadTasks() {
  runOperation(async () => {
    await refreshTasks();
    showMessage('Данные загружены');
  });
}
refreshButton.addEventListener('click', loadTasks);
loadTasks();
