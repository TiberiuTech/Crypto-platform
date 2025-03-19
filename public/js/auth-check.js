(function() {
    const user = JSON.parse(localStorage.getItem('user'));
    document.documentElement.classList.add(user ? 'is-authenticated' : 'not-authenticated');
})();

import authService from './services/authService.js';

const protectedPages = ['wallet.html', 'trade.html'];
const currentPath = window.location.pathname.toLowerCase();

function updateAuthUI() {
    const navbar = document.querySelector('.navbar');
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    const navRight = document.querySelector('.nav-right');
    
    if (!authButtons || !userProfile || !navbar || !navRight) return;

    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
        document.documentElement.classList.add('is-authenticated');
        document.documentElement.classList.remove('not-authenticated');
        
        const usernameElement = userProfile.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = user.name || user.email;
        }

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

        if (protectedPages.some(page => currentPath.includes(page.toLowerCase()))) {
            localStorage.setItem('redirect_after_login', window.location.pathname);
            window.location.href = '/pages/login.html';
            return;
        }
    }
}

if (protectedPages.some(page => currentPath.includes(page.toLowerCase()))) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        localStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = '/pages/login.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    setActiveNavLink();
});

function setActiveNavLink() {
    const currentPath = window.location.pathname.toLowerCase();
    const navLinks = document.querySelectorAll('.nav-link');
    const logo = document.querySelector('.logo');
    
    // Elimină clasa active de pe toate link-urile și logo
    navLinks.forEach(link => link.classList.remove('active'));
    if (logo) logo.classList.remove('active');
    
    // Verifică dacă suntem pe pagina principală
    if (currentPath === '/' || currentPath === '/index.html') {
        // Setăm logo-ul ca activ pe pagina principală
        if (logo) logo.classList.add('active');
        return;
    }
    
    // Adaugă clasa active pe link-ul corespunzător paginii curente
    navLinks.forEach(link => {
        const href = link.getAttribute('href').toLowerCase();
        if (currentPath.includes(href.split('/').pop())) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
        updateAuthUI();
    }
});

const authWarning = localStorage.getItem('auth_warning');
if (authWarning) {
    showNotification(authWarning, 'warning');
    localStorage.removeItem('auth_warning');
}

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