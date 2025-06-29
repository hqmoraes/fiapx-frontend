// Classe para gerenciar chamadas de API
class ApiClient {
    constructor() {
        this.baseHeaders = {
            'Content-Type': 'application/json'
        };
    }

    // Obter headers com autenticação
    getHeaders() {
        const headers = { ...this.baseHeaders };
        
        if (authManager.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${authManager.getAuthToken()}`;
        }
        
        return headers;
    }

    // Fazer upload de vídeo
    async uploadVideo(file, onProgress = null) {
        try {
            debugLog('Iniciando upload de vídeo', { fileName: file.name, fileSize: file.size });

            // Validar arquivo
            if (!this.validateVideoFile(file)) {
                throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
            }

            if (file.size > CONFIG.MAX_FILE_SIZE) {
                throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
            }

            // Criar FormData
            const formData = new FormData();
            formData.append('video', file);

            // Configurar requisição com progresso
            const xhr = new XMLHttpRequest();
            
            return new Promise((resolve, reject) => {
                // Monitorar progresso
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && onProgress) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        onProgress(percentComplete);
                    }
                });

                // Configurar resposta
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            debugLog('Upload bem-sucedido', response);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('Erro ao processar resposta do servidor'));
                        }
                    } else {
                        try {
                            const error = JSON.parse(xhr.responseText);
                            reject(new Error(error.message || ERROR_MESSAGES.UPLOAD_FAILED));
                        } catch {
                            reject(new Error(ERROR_MESSAGES.UPLOAD_FAILED));
                        }
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
                });

                // Enviar requisição
                xhr.open('POST', `${CONFIG.UPLOAD_SERVICE_URL}/upload`);
                
                // Adicionar headers de autenticação
                if (authManager.isAuthenticated()) {
                    xhr.setRequestHeader('Authorization', `Bearer ${authManager.getAuthToken()}`);
                }
                
                xhr.send(formData);
            });

        } catch (error) {
            debugLog('Erro no upload', error);
            throw error;
        }
    }

    // Validar arquivo de vídeo
    validateVideoFile(file) {
        const validTypes = CONFIG.ALLOWED_VIDEO_TYPES;
        debugLog('Validando arquivo:', { 
            name: file.name, 
            type: file.type, 
            size: file.size,
            validTypes: validTypes 
        });
        const isValid = validTypes.includes(file.type);
        if (!isValid) {
            debugLog('Arquivo rejeitado - tipo não suportado:', file.type);
        }
        return isValid;
    }

    // Obter status de processamento
    async getProcessingStatus(videoId) {
        try {
            const response = await fetch(`${CONFIG.PROCESSING_SERVICE_URL}/status/${videoId}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao obter status do processamento');
            }

            const data = await response.json();
            debugLog('Status do processamento', data);
            return data;

        } catch (error) {
            debugLog('Erro ao obter status', error);
            throw error;
        }
    }

    // Listar vídeos do usuário
    async getUserVideos() {
        try {
            debugLog('Obtendo lista de vídeos do usuário');
            
            const response = await fetch(`${CONFIG.STORAGE_SERVICE_URL}/videos`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao obter lista de vídeos');
            }

            const data = await response.json();
            debugLog('Lista de vídeos obtida', data);
            return data.videos || [];

        } catch (error) {
            debugLog('Erro ao obter vídeos', error);
            throw error;
        }
    }

    // Download de vídeo processado
    async downloadVideo(videoId) {
        try {
            debugLog('Iniciando download do vídeo', { videoId });
            
            const response = await fetch(`${CONFIG.STORAGE_SERVICE_URL}/download/${videoId}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao fazer download do vídeo');
            }

            // Criar blob e fazer download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-${videoId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            debugLog('Download concluído');

        } catch (error) {
            debugLog('Erro no download', error);
            throw error;
        }
    }

    // Deletar vídeo
    async deleteVideo(videoId) {
        try {
            debugLog('Deletando vídeo', { videoId });
            
            const response = await fetch(`${CONFIG.STORAGE_SERVICE_URL}/videos/${videoId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao deletar vídeo');
            }

            const data = await response.json();
            debugLog('Vídeo deletado', data);
            return data;

        } catch (error) {
            debugLog('Erro ao deletar vídeo', error);
            throw error;
        }
    }

    // Obter estatísticas do usuário
    async getUserStats() {
        try {
            debugLog('Obtendo estatísticas do usuário');
            
            const response = await fetch(`${CONFIG.STORAGE_SERVICE_URL}/stats`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                // Se não há endpoint de stats, simular dados
                return {
                    totalVideos: 0,
                    processingVideos: 0,
                    storageUsed: 0
                };
            }

            const data = await response.json();
            debugLog('Estatísticas obtidas', data);
            return data;

        } catch (error) {
            debugLog('Erro ao obter estatísticas', error);
            // Retornar dados padrão em caso de erro
            return {
                totalVideos: 0,
                processingVideos: 0,
                storageUsed: 0
            };
        }
    }

    // Testar conectividade com os serviços
    async testServices() {
        const services = [
            { name: 'Auth', url: CONFIG.AUTH_SERVICE_URL },
            { name: 'Upload', url: CONFIG.UPLOAD_SERVICE_URL },
            { name: 'Processing', url: CONFIG.PROCESSING_SERVICE_URL },
            { name: 'Storage', url: CONFIG.STORAGE_SERVICE_URL }
        ];

        const results = {};

        for (const service of services) {
            try {
                const response = await fetch(`${service.url}/health`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                results[service.name] = {
                    status: response.ok ? 'online' : 'offline',
                    responseTime: Date.now()
                };
                
            } catch (error) {
                results[service.name] = {
                    status: 'offline',
                    error: error.message
                };
            }
        }

        debugLog('Teste de conectividade dos serviços', results);
        return results;
    }
}

// Instância global do cliente de API
const apiClient = new ApiClient();

// Função utilitária para formatar tamanho de arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função utilitária para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
}

// Função utilitária para obter status legível
function getReadableStatus(status) {
    const statusMap = {
        'pending': 'Pendente',
        'processing': 'Processando',
        'completed': 'Concluído',
        'failed': 'Falhou',
        'uploaded': 'Enviado',
        'ready': 'Pronto'
    };
    
    return statusMap[status] || status;
}
