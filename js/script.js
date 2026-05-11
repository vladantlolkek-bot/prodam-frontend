const API_URL = 'https://duplex-electable-yogurt.ngrok-free.dev/api';

function getCurrentUser() {
    const user = localStorage.getItem('prodam_current_user');
    return user ? JSON.parse(user) : null;
}

function getToken() {
    return localStorage.getItem('prodam_token');
}

function logout() {
    localStorage.removeItem('prodam_token');
    localStorage.removeItem('prodam_current_user');
    window.location.href = 'index.html';
}

async function updateUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    
    const currentUser = getCurrentUser();
    
    if (currentUser) {
        userMenu.innerHTML = `
            <span class="user-name" onclick="location.href='cabinet.html'">${currentUser.name}</span>
            <button class="btn-outline btn-small" onclick="logout()">Выйти</button>
        `;
    } else {
        userMenu.innerHTML = `
            <a href="login.html" class="btn-outline btn-small">Войти</a>
            <a href="register.html" class="btn btn-small">Регистрация</a>
        `;
    }
}

document.addEventListener('DOMContentLoaded', updateUserMenu);