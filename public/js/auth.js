// Funcție pentru verificarea dacă utilizatorul este autentificat
function isAuthenticated() {
    return localStorage.getItem('user') !== null;
}

// Funcție pentru afișarea alertei personalizate
function showAlert(message, callback) {
    // Creăm overlay-ul
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    
    // Creăm alerta
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    
    // Adăugăm mesajul
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert-message';
    messageDiv.textContent = message;
    
    // Adăugăm butonul OK
    const button = document.createElement('button');
    button.className = 'alert-button';
    button.textContent = 'OK';
    button.onclick = () => {
        document.body.removeChild(overlay);
        if (callback) {
            setTimeout(callback, 100);
        }
    };
    
    // Asamblăm alerta
    alertBox.appendChild(messageDiv);
    alertBox.appendChild(button);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
}

// Facem showAlert disponibil global
window.showAlert = showAlert;

// Funcție pentru redirecționare către login cu warning
function redirectToLoginWithWarning() {
    localStorage.setItem('loginWarning', 'Trebuie să vă autentificați pentru a accesa această secțiune.');
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/pages/login.html';
}

// Funcție pentru atașarea event listener-ilor
function setupProtectedLinks() {
    const protectedLinks = document.querySelectorAll('a[href*="wallet"], a[href*="trade"]');
    protectedLinks.forEach(link => {
        link.addEventListener('click', handleProtectedLink);
    });
}

function handleProtectedLink(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated()) {
        localStorage.setItem('loginWarning', 'Trebuie să vă autentificați pentru a accesa această secțiune.');
        window.location.replace('/pages/login.html');
    }
}

// Funcție pentru verificarea și afișarea warning-ului pe pagina de login
function checkLoginWarning() {
    const warning = localStorage.getItem('loginWarning');
    if (warning) {
        showAlert(warning);
        localStorage.removeItem('loginWarning');
    }
}

// Inițializare când documentul este gata
function init() {
    setupProtectedLinks();
    checkForWarning();
}

// Atașăm event listener-ul când DOM-ul este încărcat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Exportăm funcțiile necesare
export { isAuthenticated, showAlert };

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
    showAlert(authWarning);
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
            showAlert('Te rugăm să introduci o adresă de email validă');
            return;
        }

        try {
            authService.login(email, password);
            showAlert('Autentificare reușită!', () => {
                authService.handleRedirectAfterLogin();
            });
        } catch (error) {
            showAlert(error.message || 'Eroare la autentificare');
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
            showAlert('Te rugăm să introduci o adresă de email validă');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('Parolele nu coincid');
            return;
        }

        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            showAlert(passwordErrors[0]);
            return;
        }

        if (!terms) {
            showAlert('Te rugăm să accepți termenii și condițiile');
            return;
        }

        try {
            authService.login(email, password);
            showAlert('Cont creat cu succes!', () => {
                authService.handleRedirectAfterLogin();
            });
        } catch (error) {
            showAlert(error.message || 'Eroare la crearea contului');
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

function checkForWarning() {
    const warning = localStorage.getItem('loginWarning');
    if (warning) {
        showAlert(warning);
        localStorage.removeItem('loginWarning');
    }
} 