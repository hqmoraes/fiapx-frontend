// Configuração dos endpoints dos microsserviços
const CONFIG = {
    // URLs via NodePort (funcionando para o frontend atual)
    AUTH_SERVICE_URL: 'http://worker.wecando.click:31404',
    UPLOAD_SERVICE_URL: 'http://worker.wecando.click:32159', 
    PROCESSING_SERVICE_URL: 'http://worker.wecando.click:32382',
    STORAGE_SERVICE_URL: 'http://worker.wecando.click:31627',
    
    // URLs NodePort (backup, mas portas filtradas)
    // AUTH_SERVICE_URL: 'https://auth.wecando.click:31573',
    // UPLOAD_SERVICE_URL: 'http://107.23.149.199:32159', 
    // PROCESSING_SERVICE_URL: 'http://107.23.149.199:32382',
    // STORAGE_SERVICE_URL: 'http://107.23.149.199:31627',
    
    // Configurações da aplicação
    APP_NAME: 'FIAP X - Video Processing Platform',
    MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB - Limite reduzido para teste de paralelismo
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

// Debug mode
const DEBUG = true;

// Função de log para debug
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[FIAP-X DEBUG] ${message}`, data || '');
    }
}

// Log da configuração
debugLog('Configuração HTTPS carregada:', {
    auth: CONFIG.AUTH_SERVICE_URL,
    upload: CONFIG.UPLOAD_SERVICE_URL,
    processing: CONFIG.PROCESSING_SERVICE_URL,
    storage: CONFIG.STORAGE_SERVICE_URL
});
