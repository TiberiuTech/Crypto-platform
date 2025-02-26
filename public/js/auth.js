function isAuthenticated() {
    return localStorage.getItem('user') !== null;
}

function showAlert(message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert-message';
    messageDiv.textContent = message;
    
    const button = document.createElement('button');
    button.className = 'alert-button';
    button.textContent = 'OK';
    button.onclick = () => {
        document.body.removeChild(overlay);
        if (callback) {
            setTimeout(callback, 100);
        }
    };
    
    alertBox.appendChild(messageDiv);
    alertBox.appendChild(button);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
}

window.showAlert = showAlert;

function redirectToLoginWithWarning() {
    localStorage.setItem('loginWarning', 'You must be authenticated to access this section.');
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/pages/login.html';
}

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
        localStorage.setItem('loginWarning', 'You must be authenticated to access this section.');
        window.location.href = '/pages/login.html';
    } else {
        window.location.href = e.target.closest('a').href;
    }
}

function checkLoginWarning() {
    const warning = localStorage.getItem('loginWarning');
    if (warning) {
        showAlert(warning);
        localStorage.removeItem('loginWarning');
    }
}

function init() {
    setupProtectedLinks();
    checkForWarning();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { isAuthenticated, showAlert };

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }

    return errors;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

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

const authWarning = localStorage.getItem('auth_warning');
if (authWarning) {
    showAlert(authWarning);
    localStorage.removeItem('auth_warning');
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        if (!validateEmail(email)) {
            showAlert('Please enter a valid email address');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error during authentication');
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            
            const redirectUrl = localStorage.getItem('redirect_after_login');
            if (redirectUrl) {
                localStorage.removeItem('redirect_after_login');
                window.location.href = redirectUrl;
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            showAlert(error.message || 'Error during authentication');
        }
    });
}

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
            showAlert('Please enter a valid email address');
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
            showAlert('Please accept the terms and conditions');
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error during account creation');
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            showAlert('Account created successfully!', () => {
                window.location.href = '/';
            });
        } catch (error) {
            showAlert(error.message || 'Error during account creation');
        }
    });
}

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

function updateUIForAuthState() {
    const userProfile = document.querySelector('.user-profile');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!userProfile || !authButtons) return;
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user) {
        userProfile.style.display = 'flex';
        authButtons.style.display = 'none';
        
        const usernameElement = userProfile.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = user.name || user.email;
        }
    } else {
        userProfile.style.display = 'none';
        authButtons.style.display = 'flex';
    }
}

function handleLogout() {
    localStorage.removeItem('user');
    updateUIForAuthState();
    window.location.href = '/';
}

document.querySelector('.logout-btn')?.addEventListener('click', handleLogout);

function initializeUI() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        updateUIForAuthState();
        
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeUI); 