const API_URL = 'https://u2x1d4kzku.loclx.io/api';

// ===== УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ ЗАПРОСОВ С ТАЙМ-АУТОМ =====
async function fetchWithTimeout(url, options = {}, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('Сервер отвечает слишком долго. Попробуйте ещё раз.');
        }
        throw err;
    }
}

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
            <span class="user-name" onclick="location.href='cabinet.html'">${escapeHtml(currentUser.name)}</span>
            <button class="btn-outline btn-small" onclick="logout()">Выйти</button>
        `;
    } else {
        userMenu.innerHTML = `
            <a href="login.html" class="btn-outline btn-small">Войти</a>
            <a href="register.html" class="btn btn-small">Регистрация</a>
        `;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== РЕГИСТРАЦИЯ ЧЕРЕЗ СЕРВЕР (с тайм-аутом) =====

async function registerUser(name, email, password) {
    try {
        const response = await fetchWithTimeout(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone: '' })
        }, 15000);
        
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Ошибка регистрации:', err);
        return { success: false, error: err.message || 'Ошибка подключения к серверу' };
    }
}

// ===== ВХОД ЧЕРЕЗ СЕРВЕР (с тайм-аутом) =====

async function loginUser(email, password) {
    try {
        const response = await fetchWithTimeout(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }, 15000);
        
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Ошибка входа:', err);
        return { success: false, error: err.message || 'Ошибка подключения к серверу' };
    }
}

// ===== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ (с тайм-аутом) =====

async function fetchUserData() {
    const token = getToken();
    if (!token) return null;
    
    try {
        const response = await fetchWithTimeout(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }, 15000);
        
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error('Ошибка загрузки данных пользователя:', err);
        return null;
    }
}

// ===== ЗАГРУЗКА МАШИН ПОЛЬЗОВАТЕЛЯ (с тайм-аутом) =====

async function fetchUserCars() {
    const token = getToken();
    if (!token) return null;
    
    try {
        const response = await fetchWithTimeout(`${API_URL}/my-cars`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }, 15000);
        
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error('Ошибка загрузки машин:', err);
        return null;
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
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn?.textContent || 'Войти';
            
            errorDiv.style.display = 'none';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '⏳ Подключение...';
            }
            
            const result = await loginUser(email, password);
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
            
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
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn?.textContent || 'Зарегистрироваться';
            
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
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '⏳ Регистрация...';
            }
            
            const result = await registerUser(name, email, password);
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
            
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
