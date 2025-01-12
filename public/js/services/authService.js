class AuthService {
    constructor() {
        this.isAuthenticated = false;
        this.checkAuthStatus();
    }

    checkAuthStatus() {
        const user = localStorage.getItem('user');
        this.isAuthenticated = !!user;
        return this.isAuthenticated;
    }

    login(email, password) {
        // Simulăm un login reușit
        const user = {
            email: email,
            name: email.split('@')[0]
        };
        localStorage.setItem('user', JSON.stringify(user));
        this.isAuthenticated = true;
        
        // Verificăm dacă există o pagină de redirecționare
        const redirectUrl = localStorage.getItem('redirect_after_login');
        if (redirectUrl) {
            localStorage.removeItem('redirect_after_login');
            window.location.href = redirectUrl;
        } else {
            window.location.href = '/';
        }
    }

    logout() {
        localStorage.removeItem('user');
        this.isAuthenticated = false;
        window.location.href = '/';
    }

    requireAuth() {
        if (!this.checkAuthStatus()) {
            localStorage.setItem('redirect_after_login', window.location.pathname);
            localStorage.setItem('auth_warning', 'Pentru a accesa această pagină trebuie să fii autentificat.');
            window.location.href = '/pages/login.html';
            return false;
        }
        return true;
    }
}

export default new AuthService(); 