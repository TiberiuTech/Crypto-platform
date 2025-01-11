import authService from './services/authService.js';

// Ascundem conținutul paginii inițial pentru paginile protejate
const protectedPages = ['wallet.html', 'trade.html'];
const currentPath = window.location.pathname.toLowerCase();

// Adăugăm un script inline la începutul documentului
if (protectedPages.some(page => currentPath.includes(page.toLowerCase()))) {
    // Injectăm un script care rulează imediat
    const style = document.createElement('style');
    style.textContent = `
        body > *:not(.navbar) {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // Verificăm autentificarea
    if (!authService.checkAuthStatus()) {
        authService.requireAuth();
    } else {
        // Dacă utilizatorul este autentificat, eliminăm stilul
        document.addEventListener('DOMContentLoaded', () => {
            style.remove();
        });
    }
}

// Verificăm dacă există un warning de autentificare
const authWarning = localStorage.getItem('auth_warning');
if (authWarning) {
    // Afișăm warning-ul și îl ștergem din localStorage
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