// Configuração HTTPS para produção - fiapx.wecando.click
const CONFIG = {
    // URLs HTTPS via Ingress (produção)
    AUTH_SERVICE_URL: 'https://api.wecando.click/auth',
    UPLOAD_SERVICE_URL: 'https://api.wecando.click/upload', 
    PROCESSING_SERVICE_URL: 'https://api.wecando.click/processing',
    STORAGE_SERVICE_URL: 'https://api.wecando.click/storage',
    
    // Configurações da aplicação
    APP_NAME: 'FIAP X - Video Processing Platform',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB por arquivo
    MAX_SIMULTANEOUS_FILES: 30, // Máximo 30 arquivos simultâneos
    ALLOWED_VIDEO_TYPES: [
        'video/mp4', 
        'video/avi', 
        'video/mov', 
        'video/mkv', 
        'video/webm',
        'video/x-matroska',  // .mkv
        'video/quicktime',   // .mov
        'video/x-msvideo',   // .avi
        'video/x-ms-wmv',    // .wmv
        'video/3gpp',        // .3gp
        'video/x-flv',       // .flv
        'application/octet-stream' // fallback para arquivos sem tipo detectado
    ],
    
    // Configurações de polling para status
    POLLING_INTERVAL: 5000, // 5 segundos
    MAX_POLLING_ATTEMPTS: 120, // 10 minutos máximo
    
    // Configurações de produção
    DEBUG: true, // Ativado para debugging
    ENVIRONMENT: 'production',
    VERSION: '2.4.0',
    
    // URLs base para compatibility
    API_BASE_URL: 'https://api.wecando.click',
    FRONTEND_URL: 'https://fiapx.wecando.click'
};

// Mensagens de erro padrão
const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
    AUTH_FAILED: 'Falha na autenticação. Verifique suas credenciais.',
    FILE_TOO_LARGE: `Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    INVALID_FILE_TYPE: 'Tipo de arquivo não suportado.',
    UPLOAD_FAILED: 'Falha no upload do arquivo.',
    SERVER_ERROR: 'Erro interno do servidor.',
    SSL_ERROR: 'Erro de certificado SSL. Tente novamente.',
    CORS_ERROR: 'Erro de CORS. Contate o administrador.',
};

// Mensagens de sucesso
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login realizado com sucesso!',
    REGISTER_SUCCESS: 'Registro realizado com sucesso!',
    UPLOAD_SUCCESS: 'Upload realizado com sucesso!',
    LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
    PROCESSING_COMPLETE: 'Processamento concluído!',
};

// Debug logging (apenas em desenvolvimento)
function debugLog(message, data = null) {
    if (CONFIG.DEBUG) {
        console.log(`[FIAP-X DEBUG] ${message}`, data || '');
    }
}

// Log da configuração
debugLog('Configuração HTTPS carregada:', {
    auth: CONFIG.AUTH_SERVICE_URL,
    upload: CONFIG.UPLOAD_SERVICE_URL,
    processing: CONFIG.PROCESSING_SERVICE_URL,
    storage: CONFIG.STORAGE_SERVICE_URL,
    environment: CONFIG.ENVIRONMENT,
    version: CONFIG.VERSION
});

// Verificar se está rodando em HTTPS
if (typeof window !== 'undefined') {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('⚠️ Aplicação deve ser servida via HTTPS em produção');
    }
}

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES };
}
