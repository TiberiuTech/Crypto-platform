class AuthService {
    constructor() {
        this.isAuthenticated = false;
        this.checkAuthStatus();
    }

    checkAuthStatus() {
        // Verificăm dacă există un token în localStorage
        const token = localStorage.getItem('auth_token');
        this.isAuthenticated = !!token;
        return this.isAuthenticated;
    }

    login(email, password) {
        // Simulăm un login reușit
        localStorage.setItem('auth_token', 'dummy_token');
        localStorage.setItem('user_email', email);
        this.isAuthenticated = true;
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_email');
        this.isAuthenticated = false;
        window.location.href = '/index.html';
    }

    requireAuth(redirectUrl = '/public/pages/login.html') {
        if (!this.checkAuthStatus()) {
            // Salvăm pagina curentă pentru a reveni după autentificare
            localStorage.setItem('redirect_after_login', window.location.pathname);
            
            // Afișăm notificarea
            this.showAuthWarning();
            
            // Redirecționăm către pagina de login
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    showAuthWarning() {
        localStorage.setItem('auth_warning', 'Pentru a accesa această pagină trebuie să fii autentificat.');
    }

    handleRedirectAfterLogin() {
        const redirectUrl = localStorage.getItem('redirect_after_login');
        if (redirectUrl) {
            localStorage.removeItem('redirect_after_login');
            window.location.href = redirectUrl;
        } else {
            window.location.href = '/public/pages/wallet.html';
        }
    }
}

export default new AuthService(); 