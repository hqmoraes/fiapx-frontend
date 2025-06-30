// Aplicação principal
class VideoProcessingApp {
    constructor() {
        this.videos = [];
        this.stats = {
            totalVideos: 0,
            processingVideos: 0,
            storageUsed: 0
        };
        this.pollingIntervals = new Map();
    }

    // Inicializar aplicação
    async init() {
        try {
            debugLog('Inicializando aplicação');
            
            this.setupUploadArea();
            this.setupEventListeners();
            
            await this.loadUserStats();
            await this.loadUserVideos();
            
            // Testar conectividade dos serviços
            await this.testServicesConnectivity();
            
            debugLog('Aplicação inicializada com sucesso');
            
        } catch (error) {
            debugLog('Erro na inicialização', error);
            showNotification('Erro ao inicializar aplicação', 'error');
        }
    }

    // Configurar área de upload
    setupUploadArea() {
        const uploadZone = document.getElementById('uploadZone');
        const videoFileInput = document.getElementById('videoFile');
        const uploadBtn = document.getElementById('uploadBtn');

        if (!uploadZone || !videoFileInput || !uploadBtn) return;

        // Click para selecionar arquivo
        uploadZone.addEventListener('click', () => {
            videoFileInput.click();
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        });

        // Seleção de arquivo
        videoFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files[0]);
            }
        });

        // Botão de upload
        uploadBtn.addEventListener('click', () => {
            this.startUpload();
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Refresh da lista de vídeos
        setInterval(() => {
            if (authManager.isAuthenticated()) {
                this.loadUserVideos();
                this.loadUserStats();
            }
        }, 30000); // A cada 30 segundos
    }

    // Lidar com seleção de arquivo
    handleFileSelection(file) {
        debugLog('Arquivo selecionado', { name: file.name, size: file.size, type: file.type });

        const uploadZone = document.getElementById('uploadZone');
        const uploadBtn = document.getElementById('uploadBtn');
        
        if (!apiClient.validateVideoFile(file)) {
            showNotification(ERROR_MESSAGES.INVALID_FILE_TYPE, 'error');
            return;
        }

        if (file.size > CONFIG.MAX_FILE_SIZE) {
            showNotification(ERROR_MESSAGES.FILE_TOO_LARGE, 'error');
            return;
        }

        // Atualizar UI
        uploadZone.innerHTML = `
            <div class="upload-icon">✅</div>
            <p><strong>${file.name}</strong></p>
            <p class="upload-hint">${formatFileSize(file.size)}</p>
        `;

        uploadBtn.style.display = 'block';
        this.selectedFile = file;
    }

    // Iniciar upload
    async startUpload() {
        if (!this.selectedFile) {
            showNotification('Nenhum arquivo selecionado', 'error');
            return;
        }

        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const uploadBtn = document.getElementById('uploadBtn');

        try {
            // Mostrar seção de progresso
            progressSection.style.display = 'block';
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Enviando...';

            // Fazer upload com callback de progresso
            const result = await apiClient.uploadVideo(this.selectedFile, (progress) => {
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Upload: ${progress}%`;
            });

            // Upload concluído
            progressText.textContent = 'Upload concluído! Iniciando processamento...';
            showNotification(SUCCESS_MESSAGES.UPLOAD_SUCCESS, 'success');

            // Iniciar polling do status de processamento
            if (result.video_id) {
                this.startProcessingPolling(result.video_id);
            }

            // Resetar form
            this.resetUploadForm();

            // Recarregar lista de vídeos
            await this.loadUserVideos();
            await this.loadUserStats();

        } catch (error) {
            debugLog('Erro no upload', error);
            showNotification(error.message, 'error');
            
            // Esconder progresso
            progressSection.style.display = 'none';
            uploadBtn.disabled = false;
            uploadBtn.textContent = '🚀 Processar Vídeo';
        }
    }

    // Resetar formulário de upload
    resetUploadForm() {
        const uploadZone = document.getElementById('uploadZone');
        const uploadBtn = document.getElementById('uploadBtn');
        const progressSection = document.getElementById('progressSection');
        const videoFileInput = document.getElementById('videoFile');

        uploadZone.innerHTML = `
            <div class="upload-icon">📹</div>
            <p>Clique ou arraste um vídeo aqui</p>
            <p class="upload-hint">Formatos suportados: MP4, AVI, MOV, MKV, WEBM</p>
        `;

        uploadBtn.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.textContent = '🚀 Processar Vídeo';
        
        progressSection.style.display = 'none';
        videoFileInput.value = '';
        
        this.selectedFile = null;
    }

    // Iniciar polling do status de processamento
    startProcessingPolling(videoId) {
        debugLog('Iniciando polling para vídeo', { videoId });

        let attempts = 0;
        const maxAttempts = CONFIG.MAX_POLLING_ATTEMPTS;

        const poll = async () => {
            try {
                attempts++;
                
                const status = await apiClient.getProcessingStatus(videoId);
                debugLog('Status do processamento', { videoId, status, attempts });

                // Atualizar progresso
                const progressText = document.getElementById('progressText');
                if (progressText) {
                    progressText.textContent = `Processando... (${getReadableStatus(status.status)})`;
                }

                // Verificar se concluído
                if (status.status === 'completed' || status.status === 'ready') {
                    debugLog('Processamento concluído', { videoId });
                    showNotification('Vídeo processado com sucesso!', 'success');
                    
                    // Parar polling
                    clearInterval(this.pollingIntervals.get(videoId));
                    this.pollingIntervals.delete(videoId);
                    
                    // Esconder progresso
                    const progressSection = document.getElementById('progressSection');
                    if (progressSection) {
                        progressSection.style.display = 'none';
                    }
                    
                    // Recarregar dados
                    await this.loadUserVideos();
                    await this.loadUserStats();
                    
                } else if (status.status === 'failed') {
                    debugLog('Processamento falhou', { videoId });
                    showNotification('Erro no processamento do vídeo', 'error');
                    
                    // Parar polling
                    clearInterval(this.pollingIntervals.get(videoId));
                    this.pollingIntervals.delete(videoId);
                    
                    // Esconder progresso
                    const progressSection = document.getElementById('progressSection');
                    if (progressSection) {
                        progressSection.style.display = 'none';
                    }
                    
                } else if (attempts >= maxAttempts) {
                    debugLog('Timeout do polling', { videoId, attempts });
                    showNotification('Timeout no processamento. Verifique a lista de vídeos.', 'info');
                    
                    // Parar polling
                    clearInterval(this.pollingIntervals.get(videoId));
                    this.pollingIntervals.delete(videoId);
                    
                    // Esconder progresso
                    const progressSection = document.getElementById('progressSection');
                    if (progressSection) {
                        progressSection.style.display = 'none';
                    }
                }

            } catch (error) {
                debugLog('Erro no polling', { videoId, error });
                
                if (attempts >= maxAttempts) {
                    clearInterval(this.pollingIntervals.get(videoId));
                    this.pollingIntervals.delete(videoId);
                }
            }
        };

        // Iniciar polling
        const intervalId = setInterval(poll, CONFIG.POLLING_INTERVAL);
        this.pollingIntervals.set(videoId, intervalId);

        // Primeira execução imediata
        poll();
    }

    // Carregar estatísticas do usuário
    async loadUserStats() {
        try {
            const stats = await apiClient.getUserStats();
            this.stats = stats;
            this.updateStatsDisplay();
            
        } catch (error) {
            debugLog('Erro ao carregar estatísticas', error);
        }
    }

    // Atualizar exibição das estatísticas
    updateStatsDisplay() {
        const totalVideosEl = document.getElementById('totalVideos');
        const processingVideosEl = document.getElementById('processingVideos');
        const storageUsedEl = document.getElementById('storageUsed');
        const totalFramesEl = document.getElementById('totalFrames');

        if (totalVideosEl) totalVideosEl.textContent = this.stats.total_videos || 0;
        if (processingVideosEl) processingVideosEl.textContent = this.stats.processing || 0;
        if (storageUsedEl) storageUsedEl.textContent = formatFileSize(this.stats.total_size || 0);
        if (totalFramesEl) totalFramesEl.textContent = this.stats.total_frames || 0;
    }

    // Carregar vídeos do usuário
    async loadUserVideos() {
        try {
            debugLog('Carregando vídeos do usuário');
            
            const videos = await apiClient.getUserVideos();
            this.videos = videos;
            this.renderVideos();
            
        } catch (error) {
            debugLog('Erro ao carregar vídeos', error);
            showNotification('Erro ao carregar lista de vídeos', 'error');
        }
    }

    // Renderizar lista de vídeos
    renderVideos() {
        const videosGrid = document.getElementById('videosGrid');
        
        if (!videosGrid) return;

        if (this.videos.length === 0) {
            videosGrid.innerHTML = `
                <div class="loading">
                    <p>Nenhum vídeo encontrado. Faça o upload do seu primeiro vídeo!</p>
                </div>
            `;
            return;
        }

        videosGrid.innerHTML = this.videos.map(video => this.renderVideoCard(video)).join('');
    }

    // Renderizar card de vídeo
    renderVideoCard(video) {
        const statusClass = this.getStatusClass(video.status);
        const readableStatus = getReadableStatus(video.status);
        
        return `
            <div class="video-card fade-in">
                <div class="video-header">
                    <span class="video-name">${video.filename || video.name || 'Sem nome'}</span>
                    <span class="video-status ${statusClass}">${readableStatus}</span>
                </div>
                <div class="video-info">
                    <p>Tamanho: ${formatFileSize(video.zip_size || 0)}</p>
                    <p>Enviado: ${formatDate(video.created_at || video.upload_time || new Date())}</p>
                    ${video.processed_at ? `<p>Processado: ${formatDate(video.processed_at)}</p>` : ''}
                </div>
                <div class="video-actions">
                    ${video.status === 'completed' || video.status === 'ready' ? 
                        `<button class="btn btn-small btn-download" onclick="app.downloadVideo('${video.video_id}')">
                            📥 Download
                        </button>` : ''
                    }
                    <button class="btn btn-small btn-delete" onclick="app.deleteVideo('${video.video_id}')">
                        🗑️ Deletar
                    </button>
                </div>
            </div>
        `;
    }

    // Obter classe CSS do status
    getStatusClass(status) {
        const statusClasses = {
            'completed': 'status-completed',
            'ready': 'status-completed',
            'processing': 'status-processing',
            'pending': 'status-processing',
            'uploaded': 'status-processing',
            'failed': 'status-failed',
            'error': 'status-failed'
        };
        
        return statusClasses[status] || 'status-processing';
    }

    // Download de vídeo
    async downloadVideo(videoId) {
        try {
            showNotification('Iniciando download...', 'info');
            await apiClient.downloadVideo(videoId);
            showNotification('Download concluído!', 'success');
            
        } catch (error) {
            debugLog('Erro no download', error);
            showNotification(error.message, 'error');
        }
    }

    // Deletar vídeo
    async deleteVideo(videoId) {
        debugLog('Deletando vídeo', { videoId });
        
        if (!confirm('Tem certeza que deseja deletar este vídeo?')) {
            return;
        }

        try {
            await apiClient.deleteVideo(videoId);
            showNotification('Vídeo deletado com sucesso!', 'success');
            
            // Recarregar dados
            await this.loadUserVideos();
            await this.loadUserStats();
            
        } catch (error) {
            debugLog('Erro ao deletar vídeo', error);
            showNotification(error.message, 'error');
        }
    }

    // Testar conectividade dos serviços
    async testServicesConnectivity() {
        try {
            const results = await apiClient.testServices();
            
            const offlineServices = Object.entries(results)
                .filter(([name, result]) => result.status === 'offline')
                .map(([name]) => name);

            if (offlineServices.length > 0) {
                showNotification(
                    `Alguns serviços estão offline: ${offlineServices.join(', ')}`, 
                    'error'
                );
            } else {
                debugLog('Todos os serviços estão online');
            }
            
        } catch (error) {
            debugLog('Erro no teste de conectividade', error);
        }
    }
}

// Instância global da aplicação
const app = new VideoProcessingApp();

// Função para inicializar a aplicação (chamada do auth.js)
function initializeApp() {
    app.init();
}

// Sistema de notificações
function showNotification(message, type = 'info', duration = 5000) {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">×</button>
        </div>
    `;

    notifications.appendChild(notification);

    // Auto-remover após duração especificada
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM carregado, iniciando aplicação');
    
    // Se já estiver autenticado, inicializar app
    if (authManager.isAuthenticated()) {
        setTimeout(() => {
            if (document.getElementById('appSection').style.display !== 'none') {
                initializeApp();
            }
        }, 100);
    }
});
