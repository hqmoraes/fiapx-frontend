// Gerenciamento de autenticação
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || 'null');
    }

    // Fazer login
    async login(email, password) {
        try {
            debugLog('Tentando fazer login', { email, authURL: CONFIG.AUTH_SERVICE_URL });
            
            // Garantir que está usando HTTPS se a página for HTTPS
            let loginURL = `${CONFIG.AUTH_SERVICE_URL}/login`;
            if (window.location.protocol === 'https:' && loginURL.startsWith('http:')) {
                loginURL = loginURL.replace('http:', 'https:');
                debugLog('Forçando HTTPS para login:', loginURL);
            }
            
            const response = await fetch(loginURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            debugLog('Resposta do login', data);

            if (!response.ok) {
                throw new Error(data.message || ERROR_MESSAGES.AUTH_FAILED);
            }

            // Salvar token e dados do usuário
            this.token = data.token;
            this.user = data.user;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user_data', JSON.stringify(this.user));

            debugLog('Login bem-sucedido', this.user);
            return { success: true, user: this.user };

        } catch (error) {
            debugLog('Erro no login', error);
            throw error;
        }
    }

    // Fazer registro
    async register(name, email, password) {
        try {
            debugLog('Tentando fazer registro', { name, email });
            
            const response = await fetch(`${CONFIG.AUTH_SERVICE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: name, email, password })
            });

            const data = await response.json();
            debugLog('Resposta do registro', data);

            if (!response.ok) {
                throw new Error(data.message || 'Erro no registro');
            }

            // Salvar token e dados do usuário
            this.token = data.token;
            this.user = data.user;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user_data', JSON.stringify(this.user));

            debugLog('Registro bem-sucedido', this.user);
            return { success: true, user: this.user };

        } catch (error) {
            debugLog('Erro no registro', error);
            throw error;
        }
    }

    // Fazer logout
    logout() {
        debugLog('Fazendo logout');
        
        this.token = null;
        this.user = null;
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Recarregar a página para limpar o estado
        window.location.reload();
    }

    // Verificar se está autenticado
    isAuthenticated() {
        return this.token !== null && this.user !== null;
    }

    // Obter token de autorização
    getAuthToken() {
        return this.token;
    }

    // Obter dados do usuário
    getUser() {
        return this.user;
    }

    // Obter headers com autorização
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Verificar se o token ainda é válido
    async validateToken() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${CONFIG.AUTH_SERVICE_URL}/me`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                // Token inválido, fazer logout
                this.logout();
                return false;
            }

            const userData = await response.json();
            this.user = userData;
            localStorage.setItem('user_data', JSON.stringify(this.user));
            
            return true;

        } catch (error) {
            debugLog('Erro na validação do token', error);
            this.logout();
            return false;
        }
    }
}

// Instância global do gerenciador de autenticação
const authManager = new AuthManager();

// Eventos de autenticação
document.addEventListener('DOMContentLoaded', function() {
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const logoutBtn = document.getElementById('logoutBtn');

    // Alternar entre login e registro
    showRegisterLink?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    });

    showLoginLink?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });

    // Formulário de login
    loginFormElement?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Entrando...';
            submitBtn.disabled = true;
            
            await authManager.login(email, password);
            
            showNotification(SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
            
            // Mostrar seção da aplicação
            showMainApp();
            
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Formulário de registro
    registerFormElement?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Cadastrando...';
            submitBtn.disabled = true;
            
            await authManager.register(name, email, password);
            
            showNotification(SUCCESS_MESSAGES.REGISTER_SUCCESS, 'success');
            
            // Mostrar seção da aplicação
            showMainApp();
            
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Botão de logout
    logoutBtn?.addEventListener('click', function() {
        authManager.logout();
    });

    // Verificar se já está autenticado
    if (authManager.isAuthenticated()) {
        authManager.validateToken().then(isValid => {
            if (isValid) {
                showMainApp();
            }
        });
    }
});

// Mostrar seção principal da aplicação
function showMainApp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    
    // Mostrar informações do usuário
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    
    if (userInfo && userName) {
        userInfo.style.display = 'flex';
        userName.textContent = authManager.getUser()?.name || 'Usuário';
    }
    
    // Inicializar dados da aplicação
    initializeApp();
}

// Mostrar seção de login
function showLoginSection() {
    document.getElementById('appSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'flex';
    
    // Esconder informações do usuário
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.style.display = 'none';
    }
}
