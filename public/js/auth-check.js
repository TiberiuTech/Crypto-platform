// Setăm starea inițială imediat
(function() {
    const user = JSON.parse(localStorage.getItem('user'));
    document.documentElement.classList.add(user ? 'is-authenticated' : 'not-authenticated');
})();

import authService from './services/authService.js';

// Verificăm dacă suntem pe o pagină protejată
const protectedPages = ['wallet.html', 'trade.html'];
const currentPath = window.location.pathname.toLowerCase();

// Funcție pentru actualizarea UI-ului în funcție de starea autentificării
function updateAuthUI() {
    const navbar = document.querySelector('.navbar');
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    const navRight = document.querySelector('.nav-right');
    
    if (!authButtons || !userProfile || !navbar || !navRight) return;

    const user = JSON.parse(localStorage.getItem('user'));

    // Setăm starea inițială corectă
    if (user) {
        document.documentElement.classList.add('is-authenticated');
        document.documentElement.classList.remove('not-authenticated');
        
        const usernameElement = userProfile.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = user.name || user.email;
        }

        // Adăugăm handler pentru logout
        const logoutBtn = userProfile.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authService.logout();
                window.location.href = '/pages/login.html';
            });
        }
    } else {
        document.documentElement.classList.remove('is-authenticated');
        document.documentElement.classList.add('not-authenticated');

        // Verificăm dacă suntem pe o pagină protejată
        if (protectedPages.some(page => currentPath.includes(page.toLowerCase()))) {
            localStorage.setItem('redirect_after_login', window.location.pathname);
            window.location.href = '/pages/login.html';
            return;
        }
    }
}

// Verificăm autentificarea pentru paginile protejate
if (protectedPages.some(page => currentPath.includes(page.toLowerCase()))) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        localStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = '/pages/login.html';
    }
}

// Actualizăm UI-ul la încărcarea paginii
document.addEventListener('DOMContentLoaded', updateAuthUI);

// Adăugăm un event listener pentru schimbări în localStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
        updateAuthUI();
    }
});

// Verificăm dacă există un warning de autentificare
const authWarning = localStorage.getItem('auth_warning');
if (authWarning) {
    showNotification(authWarning, 'warning');
    localStorage.removeItem('auth_warning');
}

// Funcție pentru afișarea notificărilor
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
} 