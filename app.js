// Aplicação principal
class VideoProcessingApp {
    constructor() {
        this.videos = [];
        this.selectedFiles = [];
        this.activeUploads = new Map();
        this.queueStatus = {
            queue_length: 0,
            processing_count: 0,
            videos_in_queue: []
        };
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
            await this.loadQueueStatus();
            
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
        const clearBtn = document.getElementById('clearBtn');

        if (!uploadZone || !videoFileInput || !uploadBtn || !clearBtn) return;

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
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.handleMultipleFileSelection(files);
            }
        });

        // Seleção de arquivo
        videoFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.handleMultipleFileSelection(files);
            }
        });

        // Botão de upload
        uploadBtn.addEventListener('click', () => {
            this.startMultipleUploads();
        });

        // Botão de limpar
        clearBtn.addEventListener('click', () => {
            this.clearSelectedFiles();
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Refresh da lista de vídeos e status da fila
        setInterval(() => {
            if (authManager.isAuthenticated()) {
                this.loadUserVideos();
                this.loadUserStats();
                this.loadQueueStatus();
            }
        }, 15000); // A cada 15 segundos para monitoramento mais frequente
    }

    // Lidar com seleção de múltiplos arquivos
    handleMultipleFileSelection(files) {
        debugLog('Arquivos selecionados', { count: files.length });

        const validFiles = [];
        const errors = [];

        // Validar cada arquivo
        files.forEach(file => {
            // Validar tipo de arquivo
            if (!apiClient.validateVideoFile(file)) {
                errors.push(`${file.name}: Tipo de arquivo não suportado`);
                return;
            }

            // Validar tamanho (2MB)
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                const maxSizeMB = (CONFIG.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                errors.push(`${file.name}: Arquivo muito grande (${fileSizeMB}MB). Máximo: ${maxSizeMB}MB`);
                return;
            }

            // Validar se arquivo está vazio
            if (file.size === 0) {
                errors.push(`${file.name}: Arquivo vazio`);
                return;
            }

            // Verificar se já foi selecionado
            if (!this.selectedFiles.find(sf => sf.name === file.name && sf.size === file.size)) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: Arquivo já selecionado`);
            }
        });

        // Verificar limite total de arquivos (máximo 5 para processamento paralelo)
        const totalFiles = this.selectedFiles.length + validFiles.length;
        if (totalFiles > 5) {
            const allowedCount = 5 - this.selectedFiles.length;
            if (allowedCount > 0) {
                validFiles.splice(allowedCount);
                errors.push(`Limite de 5 arquivos simultâneos. Apenas ${allowedCount} arquivo(s) adicionado(s).`);
            } else {
                errors.push('Limite de 5 arquivos simultâneos atingido. Remova alguns arquivos primeiro.');
                validFiles.length = 0;
            }
        }

        // Mostrar erros se houver
        if (errors.length > 0) {
            showNotification(errors.join('\n'), 'error');
        }

        // Adicionar arquivos válidos
        if (validFiles.length > 0) {
            this.selectedFiles.push(...validFiles);
            this.updateSelectedFilesUI();
            showNotification(`${validFiles.length} arquivo(s) adicionado(s) (Total: ${this.selectedFiles.length})`, 'success');
        }
    }

    // Atualizar UI dos arquivos selecionados
    updateSelectedFilesUI() {
        const selectedFilesDiv = document.getElementById('selectedFiles');
        const uploadBtn = document.getElementById('uploadBtn');
        const clearBtn = document.getElementById('clearBtn');
        const uploadZone = document.getElementById('uploadZone');

        if (this.selectedFiles.length === 0) {
            selectedFilesDiv.style.display = 'none';
            uploadBtn.style.display = 'none';
            clearBtn.style.display = 'none';
            
            uploadZone.innerHTML = `
                <div class="upload-icon">📹</div>
                <p>Clique ou arraste vídeos aqui</p>
                <p class="upload-hint">Formatos suportados: MP4, AVI, MOV, MKV, WEBM</p>
                <p class="upload-hint"><strong>Limite: 2MB por arquivo</strong> - Máximo 5 arquivos simultâneos</p>
                <p class="upload-hint">Processamento paralelo automático</p>
            `;
            return;
        }

        // Mostrar lista de arquivos selecionados
        selectedFilesDiv.style.display = 'block';
        uploadBtn.style.display = 'block';
        clearBtn.style.display = 'block';

        // Atualizar zona de upload
        uploadZone.innerHTML = `
            <div class="upload-icon">✅</div>
            <p><strong>${this.selectedFiles.length} arquivo(s) selecionado(s)</strong></p>
            <p class="upload-hint">Clique novamente para adicionar mais vídeos</p>
        `;

        // Criar lista de arquivos
        selectedFilesDiv.innerHTML = this.selectedFiles.map((file, index) => `
            <div class="selected-file">
                <div class="file-info">
                    <div class="file-icon">🎬</div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="remove-file" onclick="app.removeSelectedFile(${index})">×</button>
            </div>
        `).join('');

        // Atualizar texto do botão
        uploadBtn.textContent = `🚀 Processar ${this.selectedFiles.length} Vídeo(s)`;
    }

    // Remover arquivo selecionado
    removeSelectedFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateSelectedFilesUI();
        
        // Limpar input file
        const videoFileInput = document.getElementById('videoFile');
        videoFileInput.value = '';
    }

    // Limpar todos os arquivos selecionados
    clearSelectedFiles() {
        this.selectedFiles = [];
        this.updateSelectedFilesUI();
        
        // Limpar input file
        const videoFileInput = document.getElementById('videoFile');
        videoFileInput.value = '';
        
        showNotification('Arquivos removidos', 'info');
    }

    // Iniciar múltiplos uploads
    async startMultipleUploads() {
        if (this.selectedFiles.length === 0) {
            showNotification('Nenhum arquivo selecionado', 'error');
            return;
        }

        const progressSection = document.getElementById('progressSection');
        const uploadsProgress = document.getElementById('uploadsProgress');
        const uploadBtn = document.getElementById('uploadBtn');
        const clearBtn = document.getElementById('clearBtn');

        try {
            // Mostrar seção de progresso
            progressSection.style.display = 'block';
            uploadBtn.disabled = true;
            clearBtn.disabled = true;
            uploadBtn.textContent = 'Enviando...';

            // Criar elementos de progresso para cada arquivo
            uploadsProgress.innerHTML = this.selectedFiles.map((file, index) => `
                <div class="upload-progress-item" id="progress-${index}">
                    <div class="progress-header">
                        <div class="progress-filename">${file.name}</div>
                        <div class="progress-status uploading" id="status-${index}">Preparando...</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="fill-${index}"></div>
                    </div>
                </div>
            `).join('');

            // Iniciar uploads em paralelo (máximo 3 simultâneos para não sobrecarregar)
            const maxConcurrent = 3;
            const results = [];
            
            for (let i = 0; i < this.selectedFiles.length; i += maxConcurrent) {
                const batch = this.selectedFiles.slice(i, i + maxConcurrent);
                const batchPromises = batch.map((file, localIndex) => {
                    const globalIndex = i + localIndex;
                    return this.uploadSingleFile(file, globalIndex);
                });
                
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);
            }

            // Processar resultados
            let successCount = 0;
            let errorCount = 0;
            
            results.forEach((result, index) => {
                const statusElement = document.getElementById(`status-${index}`);
                
                if (result.status === 'fulfilled' && result.value.success) {
                    successCount++;
                    statusElement.textContent = 'Concluído';
                    statusElement.className = 'progress-status completed';
                    
                    // Iniciar polling se tiver video_id
                    if (result.value.video_id) {
                        this.startProcessingPolling(result.value.video_id);
                    }
                } else {
                    errorCount++;
                    statusElement.textContent = 'Erro';
                    statusElement.className = 'progress-status error';
                }
            });

            // Mostrar resultado final
            if (successCount > 0) {
                showNotification(`${successCount} vídeo(s) enviado(s) com sucesso!`, 'success');
            }
            if (errorCount > 0) {
                showNotification(`${errorCount} vídeo(s) falharam no upload`, 'error');
            }

            // Resetar form após 3 segundos
            setTimeout(() => {
                this.resetUploadForm();
            }, 3000);

            // Recarregar lista de vídeos
            await this.loadUserVideos();
            await this.loadUserStats();

        } catch (error) {
            debugLog('Erro nos uploads', error);
            showNotification('Erro durante o upload dos vídeos', 'error');
            
            // Resetar botões
            uploadBtn.disabled = false;
            clearBtn.disabled = false;
            uploadBtn.textContent = `🚀 Processar ${this.selectedFiles.length} Vídeo(s)`;
        }
    }

    // Upload de um único arquivo
    async uploadSingleFile(file, index) {
        return new Promise(async (resolve) => {
            try {
                const statusElement = document.getElementById(`status-${index}`);
                const fillElement = document.getElementById(`fill-${index}`);
                
                statusElement.textContent = 'Enviando...';
                
                const result = await apiClient.uploadVideo(file, (progress) => {
                    fillElement.style.width = `${progress}%`;
                    statusElement.textContent = `Enviando... ${progress}%`;
                });

                fillElement.style.width = '100%';
                statusElement.textContent = 'Processando...';
                statusElement.className = 'progress-status processing';
                
                resolve({ success: true, video_id: result.video_id });
                
            } catch (error) {
                debugLog(`Erro no upload do arquivo ${file.name}`, error);
                
                const statusElement = document.getElementById(`status-${index}`);
                if (statusElement) {
                    statusElement.textContent = `Erro: ${error.message}`;
                    statusElement.className = 'progress-status error';
                }
                
                resolve({ success: false, error: error.message });
            }
        });
    }

    // Resetar formulário de upload
    resetUploadForm() {
        const uploadZone = document.getElementById('uploadZone');
        const uploadBtn = document.getElementById('uploadBtn');
        const clearBtn = document.getElementById('clearBtn');
        const progressSection = document.getElementById('progressSection');
        const videoFileInput = document.getElementById('videoFile');
        const selectedFilesDiv = document.getElementById('selectedFiles');

        // Limpar arquivos selecionados
        this.selectedFiles = [];

        // Resetar UI
        uploadZone.innerHTML = `
            <div class="upload-icon">📹</div>
            <p>Clique ou arraste vídeos aqui</p>
            <p class="upload-hint">Formatos suportados: MP4, AVI, MOV, MKV, WEBM</p>
            <p class="upload-hint"><strong>Limite: 2MB por arquivo</strong> - Máximo 5 arquivos simultâneos</p>
            <p class="upload-hint">Processamento paralelo automático</p>
        `;

        uploadBtn.style.display = 'none';
        clearBtn.style.display = 'none';
        selectedFilesDiv.style.display = 'none';
        
        uploadBtn.disabled = false;
        clearBtn.disabled = false;
        uploadBtn.textContent = '🚀 Processar Vídeos';
        
        progressSection.style.display = 'none';
        videoFileInput.value = '';
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
    async renderVideoCard(video) {
        const statusClass = this.getStatusClass(video.status);
        const readableStatus = getReadableStatus(video.status);
        
        // Obter posição na fila se estiver em fila
        let queueInfo = '';
        if (video.status === 'pending' || video.status === 'uploaded') {
            try {
                const position = await this.getVideoPosition(video.video_id);
                if (position.position > 0) {
                    const waitTime = Math.ceil(position.estimated_wait_time / 60) || Math.ceil(position.position * 1.5);
                    queueInfo = `
                        <div class="queue-position">
                            <span class="queue-icon">🕐</span>
                            <span>Posição ${position.position} na fila (~${waitTime} min)</span>
                        </div>
                    `;
                }
            } catch (error) {
                debugLog('Erro ao obter posição na fila', error);
            }
        }
        
        return `
            <div class="video-card fade-in">
                <div class="video-header">
                    <span class="video-name">${video.filename || video.name || 'Sem nome'}</span>
                    <span class="video-status ${statusClass}">${readableStatus}</span>
                </div>
                ${queueInfo}
                <div class="video-info">
                    <p>Tamanho: ${formatFileSize(video.zip_size || video.file_size || 0)}</p>
                    <p>Enviado: ${formatDate(video.created_at || video.upload_time || new Date())}</p>
                    ${video.processed_at ? `<p>Processado: ${formatDate(video.processed_at)}</p>` : ''}
                    ${video.processing_time ? `<p>Tempo de processamento: ${video.processing_time}s</p>` : ''}
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

    // Carregar status da fila
    async loadQueueStatus() {
        try {
            debugLog('Carregando status da fila');
            
            this.queueStatus = await apiClient.getQueueStatus();
            this.updateQueueDisplay();
            
        } catch (error) {
            debugLog('Erro ao carregar status da fila', error);
        }
    }

    // Atualizar exibição do status da fila
    updateQueueDisplay() {
        const activeProcessingEl = document.getElementById('activeProcessing');
        const waitingInQueueEl = document.getElementById('waitingInQueue');
        const estimatedWaitEl = document.getElementById('estimatedWait');
        const queueLengthEl = document.getElementById('queueLength');

        if (activeProcessingEl) activeProcessingEl.textContent = this.queueStatus.processing_count || 0;
        if (waitingInQueueEl) waitingInQueueEl.textContent = this.queueStatus.queue_length || 0;
        if (queueLengthEl) queueLengthEl.textContent = this.queueStatus.queue_length || 0;
        
        // Calcular tempo estimado (assumindo 1 minuto por vídeo)
        const estimatedMinutes = Math.ceil((this.queueStatus.queue_length || 0) * 1.5);
        if (estimatedWaitEl) {
            estimatedWaitEl.textContent = estimatedMinutes > 0 ? `${estimatedMinutes} min` : '0 min';
        }
    }

    // Obter posição de um vídeo na fila
    async getVideoPosition(videoId) {
        try {
            const position = await apiClient.getVideoQueuePosition(videoId);
            return position;
        } catch (error) {
            debugLog('Erro ao obter posição do vídeo na fila', error);
            return { position: 0, estimated_wait_time: 0 };
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
