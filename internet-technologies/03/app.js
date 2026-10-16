const state = {
    users: [],
    isLoading: false,
    error: null,
    filter: ""
};

const loadButton = document.getElementById("load");
const refreshButton = document.getElementById("refresh");
const searchInput = document.getElementById("search");
const message = document.getElementById("message");
const usersBlock = document.getElementById("users");
const statistics = document.getElementById("statistics");


async function loadUsers() {
    state.isLoading = true;
    state.error = null;
    render();

    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        if (!response.ok) {
            throw new Error("HTTP: " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Вместо списка пришли другие данные");
        }

        state.users = data;
    } catch (error) {
        state.error = "Не удалось загрузить пользователей. " + error.message;
        console.error(error);
    }

    state.isLoading = false;
    render();
}


function getFilteredUsers(users, filter) {
    const text = filter.trim().toLowerCase();

    return users.filter(function (user) {
        return user.name.toLowerCase().includes(text) ||
            user.username.toLowerCase().includes(text) ||
            user.email.toLowerCase().includes(text);
    });
}


function createUserCard(user) {
    const card = document.createElement("div");
    card.className = "user";

    const name = document.createElement("h3");
    name.textContent = user.name;

    const username = document.createElement("p");
    username.textContent = "Username: " + user.username;

    const email = document.createElement("p");
    email.textContent = "Email: " + user.email;

    const city = document.createElement("p");
    city.textContent = "Город: " + user.address.city;

    const company = document.createElement("p");
    company.textContent = "Компания: " + user.company.name;

    card.append(name, username, email, city, company);

    return card;
}


function renderUsers(users) {
    for (const user of users) {
        usersBlock.append(createUserCard(user));
    }
}


function render() {
    usersBlock.textContent = "";
    statistics.textContent = "";
    message.textContent = "";

    loadButton.disabled = state.isLoading;
    refreshButton.disabled = state.isLoading;

    if (state.isLoading) {
        message.textContent = "Загрузка...";
        return;
    }

    if (state.error) {
        message.textContent = state.error;
        return;
    }

    if (state.users.length === 0) {
        message.textContent = "Список пуст. Нажмите «Загрузить».";
        return;
    }

    const filteredUsers = getFilteredUsers(state.users, state.filter);

    renderUsers(filteredUsers);

    if (filteredUsers.length === 0) {
        message.textContent = "Пользователи не найдены.";
    }

    const cities = [];

    for (const user of state.users) {
        if (!cities.includes(user.address.city)) {
            cities.push(user.address.city);
        }
    }

    statistics.textContent =
        "Всего: " + state.users.length +
        ". Показано: " + filteredUsers.length +
        ". Уникальных городов: " + cities.length + ".";
}


loadButton.addEventListener("click", loadUsers);
refreshButton.addEventListener("click", loadUsers);

searchInput.addEventListener("input", function () {
    state.filter = searchInput.value;
    render();
});

render();