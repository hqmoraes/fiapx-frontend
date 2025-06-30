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

    // Obter status da fila de processamento
    async getQueueStatus() {
        try {
            const response = await fetch(`${CONFIG.PROCESSING_SERVICE_URL}/queue/status`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                debugLog('Status da fila', data);
                return data;
            } else {
                // Se API não existir, retornar dados mock baseados em estatísticas reais
                debugLog('API de fila não disponível, usando dados mock');
                return this.getMockQueueStatus();
            }

        } catch (error) {
            debugLog('Erro ao obter status da fila', error);
            // Retornar dados mock se não conseguir obter da API
            return this.getMockQueueStatus();
        }
    }

    // Dados mock para status da fila baseados em estatísticas reais
    async getMockQueueStatus() {
        try {
            // Obter estatísticas reais para estimar fila
            const stats = await this.getUserStats();
            const videos = await this.getUserVideos();
            
            const processingCount = stats.processing || 0;
            const pendingVideos = videos.videos ? videos.videos.filter(v => 
                v.status === 'pending' || v.status === 'uploaded' || v.status === 'processing'
            ).length : 0;
            
            return {
                queue_length: Math.max(0, pendingVideos - processingCount),
                processing_count: processingCount,
                videos_in_queue: pendingVideos,
                estimated_wait_time: Math.max(0, pendingVideos - processingCount) * 90 // 90s por vídeo
            };
        } catch (error) {
            debugLog('Erro ao obter dados mock da fila', error);
            return {
                queue_length: 0,
                processing_count: 0,
                videos_in_queue: 0,
                estimated_wait_time: 0
            };
        }
    }

    // Obter posição de um vídeo na fila
    async getVideoQueuePosition(videoId) {
        try {
            const response = await fetch(`${CONFIG.PROCESSING_SERVICE_URL}/queue/position/${videoId}`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                debugLog('Posição na fila', data);
                return data;
            } else {
                // Se API não existir, calcular posição mock
                return this.getMockVideoPosition(videoId);
            }

        } catch (error) {
            debugLog('Erro ao obter posição na fila', error);
            // Retornar dados mock se não conseguir obter da API
            return this.getMockVideoPosition(videoId);
        }
    }

    // Calcular posição mock na fila baseada em dados reais
    async getMockVideoPosition(videoId) {
        try {
            const videos = await this.getUserVideos();
            const pendingVideos = videos.videos ? videos.videos.filter(v => 
                v.status === 'pending' || v.status === 'uploaded'
            ).sort((a, b) => new Date(a.created_at || a.upload_time) - new Date(b.created_at || b.upload_time)) : [];
            
            const videoIndex = pendingVideos.findIndex(v => v.video_id === videoId);
            const position = videoIndex >= 0 ? videoIndex + 1 : 0;
            
            return {
                position: position,
                estimated_wait_time: position * 90 // 90 segundos por vídeo
            };
        } catch (error) {
            debugLog('Erro ao calcular posição mock', error);
            return {
                position: 0,
                estimated_wait_time: 0
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
