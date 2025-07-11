// Configuração para Kubernetes - Usando Ingress para acesso externo
const CONFIG = {
    // URLs dos serviços usando Ingress
    API: {
        AUTH_SERVICE: 'https://api.wecando.click/auth',
        UPLOAD_SERVICE: 'https://api.wecando.click/upload',
        PROCESSING_SERVICE: 'https://api.wecando.click/processing',
        STORAGE_SERVICE: 'https://api.wecando.click/storage'
    },
    
    // URLs para compatibilidade com auth.js e api.js
    AUTH_SERVICE_URL: 'https://api.wecando.click/auth',
    UPLOAD_SERVICE_URL: 'https://api.wecando.click/upload',
    PROCESSING_SERVICE_URL: 'https://api.wecando.click/processing',
    STORAGE_SERVICE_URL: 'https://api.wecando.click/storage',
    
    // Endpoints específicos
    ENDPOINTS: {
        LOGIN: '/login',
        REGISTER: '/register',
        UPLOAD: '/upload',
        PROCESS: '/process',
        STATUS: '/status',
        DOWNLOAD: '/download',
        LIST_FILES: '/files'
    },
    
    // Configurações de upload
    UPLOAD: {
        MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
        ALLOWED_TYPES: [
            'video/mp4',
            'video/avi', 
            'video/mov',
            'video/mkv',
            'video/x-matroska', // .mkv files
            'video/quicktime',  // .mov files
            'video/x-msvideo',  // .avi files
            'video/webm'        // .webm files
        ],
        CHUNK_SIZE: 1024 * 1024 // 1MB chunks
    },
    
    // Configurações da aplicação
    APP: {
        NAME: 'FIAP-X Video Processing',
        VERSION: '2.0.0',
        DEBUG: true,
        POLLING_INTERVAL: 5000 // 5 segundos para verificar status
    }
};

// Mensagens de erro padrão
const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
    AUTH_FAILED: 'Falha na autenticação. Verifique suas credenciais.',
    FILE_TOO_LARGE: `Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    INVALID_FILE_TYPE: 'Tipo de arquivo não suportado.',
    UPLOAD_FAILED: 'Falha no upload do arquivo.',
    SERVER_ERROR: 'Erro interno do servidor.',
};

// Mensagens de sucesso
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login realizado com sucesso!',
    REGISTER_SUCCESS: 'Conta criada com sucesso!',
    UPLOAD_SUCCESS: 'Upload realizado com sucesso!',
    PROCESSING_STARTED: 'Processamento iniciado!',
};

// Função de debug para log
function debugLog(message, data = null) {
    if (CONFIG.APP.DEBUG) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`, data || '');
    }
}

// Função para validar se todos os endpoints estão configurados
function validateConfig() {
    const requiredEndpoints = ['auth', 'upload', 'processing', 'storage'];
    const missing = requiredEndpoints.filter(endpoint => !CONFIG.API_ENDPOINTS[endpoint]);
    
    if (missing.length > 0) {
        console.error('Endpoints faltando na configuração:', missing);
        return false;
    }
    
    debugLog('Configuração validada com sucesso');
    return true;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
    window.ERROR_MESSAGES = ERROR_MESSAGES;
    window.debugLog = debugLog;
    window.validateConfig = validateConfig;
}

// Para Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        SUCCESS_MESSAGES,
        ERROR_MESSAGES,
        debugLog,
        validateConfig
    };
}
