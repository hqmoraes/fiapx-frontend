# Frontend - FIAP X Video Processing Platform

## Descrição

Interface web moderna e responsiva para a plataforma FIAP X de processamento de vídeos. Desenvolvida com HTML5, CSS3 e JavaScript vanilla, oferece uma experiência intuitiva para upload, processamento e gerenciamento de vídeos através de uma arquitetura de microsserviços.

## Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Autenticação**: JWT Tokens
- **API**: REST/HTTP
- **Deploy**: AWS Amplify + Kubernetes
- **Containerização**: Docker + Nginx
- **CI/CD**: GitHub Actions

## Funcionalidades

### 🔐 Autenticação
- Login e cadastro de usuários
- Gerenciamento de sessão JWT
- Logout seguro
- Proteção de rotas

### 📹 Upload de Vídeos
- Upload múltiplo de arquivos
- Drag & drop interface
- Barra de progresso em tempo real
- Validação de formatos e tamanhos
- Preview de arquivos selecionados

### 🎬 Gerenciamento de Vídeos
- Lista de vídeos do usuário
- Visualização de status de processamento
- Download de vídeos originais
- Download de frames processados (ZIP)
- Exclusão de vídeos

### 📊 Monitoramento
- Status da fila de processamento
- Estatísticas do usuário
- Métricas em tempo real
- Histórico de uploads

### 🔄 Funcionalidades Avançadas
- Atualização automática de status
- Notificações em tempo real
- Interface responsiva (mobile-first)
- Modo offline básico
- Retry automático em falhas

## Estrutura do Projeto

```
frontend/
├── index.html                  # Página principal
├── app.js                     # Lógica principal da aplicação
├── auth.js                    # Autenticação e gerenciamento JWT
├── api.js                     # Cliente HTTP para APIs
├── config.js                  # Configurações da aplicação
├── style.css                  # Estilos CSS
├── package.json              # Configuração do projeto
├── nginx.conf                # Configuração Nginx (K8s)
├── Dockerfile                # Imagem Docker
├── Dockerfile.k8s            # Imagem otimizada para K8s
├── amplify.yml               # Configuração AWS Amplify
└── deploy-scripts/           # Scripts de deploy
    ├── deploy-k8s.sh
    ├── deploy-to-amplify.sh
    └── setup-amplify.sh
```

## Configuração

### Variáveis de Ambiente

O frontend usa diferentes arquivos de configuração baseados no ambiente:

#### Desenvolvimento Local (`config-dev.js`)
```javascript
const API_CONFIG = {
    API_GATEWAY_URL: 'http://localhost:8000',
    AUTH_SERVICE_URL: 'http://localhost:8001',
    UPLOAD_SERVICE_URL: 'http://localhost:8002',
    PROCESSING_SERVICE_URL: 'http://localhost:8003',
    STORAGE_SERVICE_URL: 'http://localhost:8004'
};
```

#### Kubernetes (`config-k8s.js`)
```javascript
const API_CONFIG = {
    API_GATEWAY_URL: 'https://api.fiapx.com',
    AUTH_SERVICE_URL: 'https://auth.fiapx.com',
    UPLOAD_SERVICE_URL: 'https://upload.fiapx.com',
    PROCESSING_SERVICE_URL: 'https://processing.fiapx.com',
    STORAGE_SERVICE_URL: 'https://storage.fiapx.com'
};
```

#### Produção AWS Amplify (`config.prod.js`)
```javascript
const API_CONFIG = {
    API_GATEWAY_URL: 'https://api-gateway-alb-123456789.us-east-1.elb.amazonaws.com',
    // URLs dos serviços via Load Balancer
};
```

### Configuração Automática

O sistema detecta automaticamente o ambiente e carrega a configuração apropriada:

```javascript
// Detecção de ambiente
if (window.location.hostname === 'localhost') {
    // Desenvolvimento local
} else if (window.location.hostname.includes('amplifyapp.com')) {
    // AWS Amplify
} else {
    // Kubernetes
}
```

## Instalação e Execução

### Desenvolvimento Local

1. **Clonar o repositório**:
```bash
git clone <repository-url>
cd frontend
```

2. **Instalar dependências** (opcional, para scripts):
```bash
npm install
```

3. **Configurar ambiente**:
- Editar `config-dev.js` com URLs dos serviços locais
- Verificar se todos os microsserviços estão rodando

4. **Executar servidor local**:
```bash
# Python (recomendado)
python3 -m http.server 8080

# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

5. **Acessar aplicação**:
```
http://localhost:8080
```

### Docker

1. **Build da imagem**:
```bash
docker build -t fiapx-frontend .
```

2. **Executar container**:
```bash
docker run -p 8080:80 fiapx-frontend
```

### Kubernetes

1. **Deploy no cluster**:
```bash
# Aplicar manifestos
kubectl apply -f infrastructure/k8s/frontend/

# Verificar status
kubectl get pods -l app=frontend
kubectl get service frontend-service
```

2. **Acessar via port-forward** (desenvolvimento):
```bash
kubectl port-forward service/frontend-service 8080:80
```

### AWS Amplify

1. **Deploy automático**:
```bash
# Configurar Amplify (primeira vez)
./setup-amplify.sh

# Deploy manual
./deploy-to-amplify.sh
```

2. **Configurar domínio customizado**:
- Acesse AWS Amplify Console
- Configure domínio personalizado
- Adicione certificado SSL

## Funcionalidades Detalhadas

### Autenticação (`auth.js`)

#### Login
```javascript
const token = await authManager.login(email, password);
// Armazena token no localStorage
// Redireciona para dashboard
```

#### Cadastro
```javascript
await authManager.register(name, email, password);
// Auto-login após cadastro
```

#### Gerenciamento de Sessão
```javascript
// Verificar se está autenticado
if (authManager.isAuthenticated()) {
    // Usuário logado
}

// Logout
authManager.logout();
```

### Upload de Vídeos (`app.js`)

#### Upload Múltiplo
```javascript
// Selecionar múltiplos arquivos
const files = Array.from(fileInput.files);

// Upload paralelo com progresso
await videoApp.startMultipleUploads();
```

#### Drag & Drop
```javascript
// Área de drop configurada
uploadZone.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files);
    videoApp.handleMultipleFileSelection(files);
});
```

#### Validação de Arquivos
```javascript
// Formatos aceitos
const allowedTypes = ['video/mp4', 'video/avi', 'video/mov'];

// Tamanho máximo
const maxSize = 500 * 1024 * 1024; // 500MB
```

### Gerenciamento de Vídeos

#### Lista de Vídeos
```javascript
// Carregar vídeos do usuário
const videos = await videoApp.loadUserVideos();

// Atualização automática
setInterval(async () => {
    await videoApp.refreshVideoList();
}, 5000);
```

#### Status de Processamento
```javascript
// Status possíveis
const statusTypes = {
    'pending': 'Aguardando processamento',
    'processing': 'Processando...',
    'completed': 'Concluído',
    'failed': 'Falhou'
};
```

### Monitoramento de Fila

#### Status da Fila
```javascript
// Verificar fila de processamento
const queueStatus = await videoApp.loadQueueStatus();

// Exibir estatísticas
updateQueueDisplay(queueStatus);
```

#### Métricas em Tempo Real
```javascript
// Polling de métricas
setInterval(async () => {
    await videoApp.updateMetrics();
}, 10000);
```

## APIs Integradas

### Auth Service
- `POST /register` - Cadastro de usuário
- `POST /login` - Login
- `POST /logout` - Logout

### Upload Service
- `POST /upload` - Upload de vídeo
- `GET /upload/status/{id}` - Status do upload

### Processing Service
- `GET /queue/status` - Status da fila
- `GET /videos/{id}/status` - Status do processamento

### Storage Service
- `GET /videos` - Lista de vídeos
- `GET /download/{id}` - Download de vídeo
- `DELETE /videos/{id}` - Deletar vídeo

## Tratamento de Erros

### Tipos de Erro

#### Erro de Rede
```javascript
// Retry automático
const maxRetries = 3;
await apiClient.request(url, options, maxRetries);
```

#### Erro de Autenticação
```javascript
// Redirecionar para login
if (error.status === 401) {
    authManager.logout();
    window.location.href = '/login';
}
```

#### Erro de Upload
```javascript
// Mostrar erro específico
showNotification(`Erro no upload: ${error.message}`, 'error');
```

### Notificações

```javascript
// Tipos de notificação
showNotification('Sucesso!', 'success');
showNotification('Atenção!', 'warning');
showNotification('Erro!', 'error');
showNotification('Info', 'info');
```

## Estilos e UI (`style.css`)

### Design System

#### Cores
```css
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
    --info-color: #17a2b8;
}
```

#### Tipografia
```css
.h1, .h2, .h3 { font-family: 'Roboto', sans-serif; }
.body-text { font-family: 'Open Sans', sans-serif; }
```

#### Responsividade
```css
/* Mobile first */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### Componentes

#### Botões
```css
.btn-primary { /* Botão principal */ }
.btn-secondary { /* Botão secundário */ }
.btn-success { /* Botão de sucesso */ }
.btn-danger { /* Botão de perigo */ }
```

#### Cards
```css
.video-card { /* Card de vídeo */ }
.stats-card { /* Card de estatísticas */ }
.upload-card { /* Card de upload */ }
```

#### Modais
```css
.modal { /* Container do modal */ }
.modal-content { /* Conteúdo do modal */ }
.modal-backdrop { /* Fundo do modal */ }
```

## Testes

### Testes Manuais

#### Fluxo de Login
1. Acessar `/`
2. Clicar em "Entrar"
3. Inserir credenciais válidas
4. Verificar redirecionamento

#### Fluxo de Upload
1. Fazer login
2. Selecionar arquivo de vídeo
3. Clicar em "Upload"
4. Verificar progresso
5. Confirmar na lista

### Testes de Integração

#### Script de Teste
```bash
# Testar conectividade
./test-integration.sh

# Testar no Kubernetes
./test-integration-k8s.sh
```

#### Casos de Teste
- ✅ Login com credenciais válidas
- ✅ Upload de vídeo pequeno
- ✅ Lista de vídeos atualizada
- ✅ Download de vídeo
- ✅ Logout seguro

## Performance

### Otimizações Implementadas

#### Carregamento
- Lazy loading de recursos
- Minificação de arquivos
- Compressão gzip
- Cache de assets

#### Rede
- Retry automático em falhas
- Debounce em buscas
- Pooling otimizado
- Timeout configurável

#### UX
- Loading states
- Progress bars
- Offline handling
- Error boundaries

### Métricas de Performance

#### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

#### Monitoramento
```javascript
// Performance tracking
performance.mark('app-start');
performance.mark('app-ready');
performance.measure('app-load', 'app-start', 'app-ready');
```

## Deployment

### AWS Amplify (Produção)

#### Configuração Automática
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    build:
      commands:
        - echo "Building frontend..."
        - cp config.prod.js config.js
  artifacts:
    baseDirectory: /
    files:
      - '**/*'
```

#### Deploy Manual
```bash
# Configurar Amplify CLI
amplify configure

# Deploy
amplify publish
```

### Kubernetes

#### Manifestos
```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    spec:
      containers:
      - name: frontend
        image: fiapx-frontend:latest
        ports:
        - containerPort: 80
```

#### Ingress
```yaml
# frontend-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
spec:
  rules:
  - host: fiapx.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de CORS
```
Access to fetch at 'API_URL' from origin 'FRONTEND_URL' has been blocked by CORS policy
```
**Solução**: Configurar CORS nos microsserviços backend.

#### 2. Token JWT expirado
```
Error: Token expired
```
**Solução**: Implementar refresh token ou re-login automático.

#### 3. Upload falha
```
Error: Upload failed
```
**Solução**: Verificar tamanho do arquivo e conectividade.

#### 4. Página não carrega
```
Error: Failed to load resource
```
**Solução**: Verificar configuração de URLs dos serviços.

### Debug

#### Console do Browser
```javascript
// Habilitar debug
localStorage.setItem('debug', 'true');

// Verificar logs
console.log('Debug info:', debugInfo);
```

#### Network Tab
- Verificar requests HTTP
- Analisar responses de erro
- Monitorar tempo de resposta

#### Logs do Servidor
```bash
# Nginx logs (Kubernetes)
kubectl logs -f deployment/frontend

# Amplify logs
amplify console
```

## Segurança

### Implementações

#### Autenticação
- ✅ JWT tokens seguros
- ✅ Logout limpa tokens
- ✅ Tokens armazenados em localStorage
- ✅ Verificação de expiração

#### Validação
- ✅ Sanitização de inputs
- ✅ Validação de tipos de arquivo
- ✅ Limite de tamanho de upload
- ✅ Proteção contra XSS

#### Comunicação
- ✅ HTTPS em produção
- ✅ Headers de segurança
- ✅ CSP (Content Security Policy)
- ✅ Certificados SSL

### Recomendações

1. **Implementar refresh tokens**
2. **Adicionar 2FA**
3. **Logs de auditoria**
4. **Rate limiting no frontend**
5. **Criptografia de dados sensíveis**

## Monitoramento

### Métricas Coletadas

#### Uso
- Número de logins por dia
- Uploads realizados
- Tempo de sessão médio
- Páginas mais acessadas

#### Performance
- Tempo de carregamento
- Tamanho de bundles
- Erros JavaScript
- Falhas de rede

#### Negócio
- Taxa de conversão
- Engagement de usuários
- Funcionalidades mais usadas
- Feedback dos usuários

### Ferramentas

#### Google Analytics
```javascript
// Tracking de eventos
gtag('event', 'upload_started', {
    'event_category': 'videos',
    'event_label': 'user_upload'
});
```

#### Custom Metrics
```javascript
// Métricas customizadas
const metrics = {
    uploadSuccess: 0,
    uploadFailure: 0,
    sessionDuration: 0
};
```

## Roadmap

### Próximas Funcionalidades

#### Q1 2024
- [ ] PWA (Progressive Web App)
- [ ] Modo offline avançado
- [ ] Notifications push
- [ ] Compartilhamento social

#### Q2 2024
- [ ] Editor de vídeo básico
- [ ] Filtros e efeitos
- [ ] Colaboração em tempo real
- [ ] API WebRTC

#### Q3 2024
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Extensões browser
- [ ] Integração com clouds

### Melhorias Técnicas

#### Performance
- [ ] Service Workers
- [ ] Bundle splitting
- [ ] Tree shaking
- [ ] Image optimization

#### UX/UI
- [ ] Design system completo
- [ ] Animações avançadas
- [ ] Acessibilidade (WCAG)
- [ ] Tema escuro

## Contribuição

### Processo

1. **Fork** o repositório
2. **Branch** para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Pull Request** para revisão

### Padrões de Código

#### JavaScript
- ES6+ features
- Async/await para promises
- Destructuring quando apropriado
- Arrow functions para callbacks

#### CSS
- Mobile-first approach
- BEM naming convention
- CSS custom properties
- Flexbox/Grid layouts

#### HTML
- Semantic HTML5
- Accessibility attributes
- Performance optimizations
- SEO best practices

---

## Contato

- **Projeto**: FIAP X - Video Processing Platform
- **Deploy**: https://fiapx.amplifyapp.com
- **Documentação**: Ver `DOCUMENTACAO-ARQUITETURA.md` na raiz do projeto
- **Suporte**: Abrir issue no repositório