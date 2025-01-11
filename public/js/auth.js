import authService from './services/authService.js';

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

// Funcție pentru validarea parolei
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
        errors.push(`Parola trebuie să aibă cel puțin ${minLength} caractere`);
    }
    if (!hasUpperCase) {
        errors.push('Parola trebuie să conțină cel puțin o literă mare');
    }
    if (!hasLowerCase) {
        errors.push('Parola trebuie să conțină cel puțin o literă mică');
    }
    if (!hasNumbers) {
        errors.push('Parola trebuie să conțină cel puțin un număr');
    }
    if (!hasSpecialChar) {
        errors.push('Parola trebuie să conțină cel puțin un caracter special');
    }

    return errors;
}

// Funcție pentru validarea emailului
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Funcționalitate pentru toggle password visibility
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// Verificăm dacă există un warning de autentificare
const authWarning = localStorage.getItem('auth_warning');
if (authWarning) {
    showNotification(authWarning, 'warning');
    localStorage.removeItem('auth_warning');
}

// Handler pentru formularul de login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const remember = loginForm.remember?.checked;

        if (!validateEmail(email)) {
            showNotification('Te rugăm să introduci o adresă de email validă', 'error');
            return;
        }

        try {
            authService.login(email, password);
            showNotification('Autentificare reușită!', 'success');
            setTimeout(() => {
                authService.handleRedirectAfterLogin();
            }, 1000);
        } catch (error) {
            showNotification(error.message || 'Eroare la autentificare', 'error');
        }
    });
}

// Handler pentru formularul de înregistrare
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = signupForm.name.value;
        const email = signupForm.email.value;
        const password = signupForm.password.value;
        const confirmPassword = signupForm.confirmPassword.value;
        const terms = signupForm.terms.checked;

        if (!validateEmail(email)) {
            showNotification('Te rugăm să introduci o adresă de email validă', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Parolele nu coincid', 'error');
            return;
        }

        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            showNotification(passwordErrors[0], 'error');
            return;
        }

        if (!terms) {
            showNotification('Te rugăm să accepți termenii și condițiile', 'error');
            return;
        }

        try {
            // După înregistrare, autentificăm automat utilizatorul
            authService.login(email, password);
            showNotification('Cont creat cu succes!', 'success');
            setTimeout(() => {
                authService.handleRedirectAfterLogin();
            }, 1000);
        } catch (error) {
            showNotification(error.message || 'Eroare la crearea contului', 'error');
        }
    });
}

// Actualizare butoane de navigare
document.querySelectorAll('.auth-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('login')) {
            window.location.href = 'login.html';
        } else if (btn.classList.contains('signup')) {
            window.location.href = 'signup.html';
        }
    });
}); 