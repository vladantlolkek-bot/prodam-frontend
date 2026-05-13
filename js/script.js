const API_URL = 'https://u2x1d4kzku.loclx.io/api';

// ===== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ =====

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

// ===== ОБНОВЛЕНИЕ МЕНЮ =====

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

// ===== РЕГИСТРАЦИЯ ЧЕРЕЗ СЕРВЕР =====

async function registerUser(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone: '' })
        });
        
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
        return { success: false, error: 'Ошибка подключения к серверу' };
    }
}

// ===== ВХОД ЧЕРЕЗ СЕРВЕР =====

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
        return { success: false, error: 'Ошибка подключения к серверу' };
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener('DOMContentLoaded', () => {
    updateUserMenu();
    
    // Обработчик формы входа (если есть на странице)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('errorMessage');
            
            errorDiv.style.display = 'none';
            
            const result = await loginUser(email, password);
            
            if (result.success) {
                localStorage.setItem('prodam_token', result.token);
                localStorage.setItem('prodam_current_user', JSON.stringify(result.user));
                window.location.href = 'cabinet.html';
            } else {
                errorDiv.textContent = result.error || 'Неверный email или пароль';
                errorDiv.style.display = 'block';
            }
        });
    }
    
    // Обработчик формы регистрации (если есть на странице)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const agree = document.getElementById('agree').checked;
            
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            if (!name || !email || !password || !confirmPassword) {
                errorDiv.textContent = 'Заполните все поля';
                errorDiv.style.display = 'block';
                return;
            }
            if (password !== confirmPassword) {
                errorDiv.textContent = 'Пароли не совпадают';
                errorDiv.style.display = 'block';
                return;
            }
            if (password.length < 6) {
                errorDiv.textContent = 'Пароль должен быть не менее 6 символов';
                errorDiv.style.display = 'block';
                return;
            }
            if (!agree) {
                errorDiv.textContent = 'Примите условия использования';
                errorDiv.style.display = 'block';
                return;
            }
            
            const result = await registerUser(name, email, password);
            
            if (result.success) {
                successDiv.textContent = 'Регистрация успешна! Перенаправляем...';
                successDiv.style.display = 'block';
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                errorDiv.textContent = result.error || 'Ошибка регистрации';
                errorDiv.style.display = 'block';
            }
        });
    }
});
