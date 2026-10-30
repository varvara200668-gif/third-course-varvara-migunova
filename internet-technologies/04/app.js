
const API_URL = 'https://jsonplaceholder.typicode.com';

const state = {
    posts: [],
    isLoading: false,
    isSaving: false,
    error: null,
    editingId: null
};

const form = document.getElementById('postForm');
const titleInput = document.getElementById('title');
const bodyInput = document.getElementById('body');
const searchInput = document.getElementById('search');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');
const postsElement = document.getElementById('posts');
const statusElement = document.getElementById('status');
const errorElement = document.getElementById('error');
const formTitle = document.getElementById('formTitle');

async function loadPosts() {
    state.isLoading = true;
    state.error = null;
    render();

    try {
        const response = await fetch(API_URL + '/posts?_limit=10', {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        state.posts = await response.json();
    } catch (error) {
        state.error = 'Ошибка загрузки: ' + error.message;
    } finally {
        state.isLoading = false;
        render();
    }
}

async function createPost(data) {
    const response = await fetch(API_URL + '/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return await response.json();
}

async function updatePost(id, data) {
    const response = await fetch(API_URL + '/posts/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return await response.json();
}

async function deletePost(id) {
    const response = await fetch(API_URL + '/posts/' + id, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
}

function getFilteredPosts(posts, filter) {
    const text = filter.toLowerCase().trim();
    return posts.filter(post =>
        post.title.toLowerCase().includes(text) ||
        post.body.toLowerCase().includes(text)
    );
}

function renderPosts(posts) {
    postsElement.innerHTML = '';

    if (state.isLoading) return;
    if (posts.length === 0) {
        postsElement.textContent = 'Публикаций нет';
        return;
    }

    for (const post of posts) {
        const item = document.createElement('div');
        item.className = 'post';

        const heading = document.createElement('h3');
        heading.textContent = '№' + post.id + ' — ' + post.title;

        const description = document.createElement('p');
        description.textContent = post.body;

        const editButton = document.createElement('button');
        editButton.textContent = 'Редактировать';
        editButton.disabled = state.isSaving;
        editButton.onclick = () => {
            state.editingId = post.id;
            titleInput.value = post.title;
            bodyInput.value = post.body;
            state.error = null;
            render();
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.disabled = state.isSaving;
        deleteButton.onclick = () => handleDelete(post.id);

        item.append(heading, description, editButton, deleteButton);
        postsElement.append(item);
    }
}

function render() {
    statusElement.textContent = state.isLoading ? 'Загрузка...' :
        state.isSaving ? 'Выполняется запрос...' : '';
    errorElement.textContent = state.error || '';
    saveButton.disabled = state.isLoading || state.isSaving;
    cancelButton.disabled = state.isSaving;
    titleInput.disabled = state.isSaving;
    bodyInput.disabled = state.isSaving;
    saveButton.textContent = state.isSaving ? 'Сохранение...' :
        state.editingId === null ? 'Сохранить' : 'Сохранить изменения';
    formTitle.textContent = state.editingId === null ?
        'Новая публикация' : 'Редактирование публикации';

    renderPosts(getFilteredPosts(state.posts, searchInput.value));
}

function resetForm() {
    form.reset();
    state.editingId = null;
}

async function handleDelete(id) {
    if (state.isSaving) return;
    state.isSaving = true;
    state.error = null;
    render();

    try {
        await deletePost(id);
        state.posts = state.posts.filter(post => post.id !== id);
        if (state.editingId === id) resetForm();
    } catch (error) {
        state.error = 'Ошибка удаления: ' + error.message;
    } finally {
        state.isSaving = false;
        render();
    }
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state.isSaving || state.isLoading) return;

    const data = {
        title: titleInput.value.trim(),
        body: bodyInput.value.trim()
    };

    if (!data.title || !data.body) {
        state.error = 'Заполните заголовок и текст';
        render();
        return;
    }

    state.isSaving = true;
    state.error = null;
    render();

    try {
        if (state.editingId === null) {
            const newPost = await createPost({ ...data, userId: 1 });
            state.posts.unshift(newPost);
        } else {
            const updatedPost = await updatePost(state.editingId, data);
            state.posts = state.posts.map(post =>
                post.id === state.editingId ? { ...post, ...updatedPost } : post
            );
        }
        resetForm();
    } catch (error) {
        state.error = 'Ошибка сохранения: ' + error.message;
    } finally {
        state.isSaving = false;
        render();
    }
});

cancelButton.addEventListener('click', () => {
    resetForm();
    state.error = null;
    render();
});

searchInput.addEventListener('input', render);

loadPosts();
