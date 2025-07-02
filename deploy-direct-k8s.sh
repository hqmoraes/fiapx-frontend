#!/bin/bash

# Script para deploy direto no Kubernetes via worker.wecando.click
# Este script deve ser executado localmente e fará o build no servidor ARM64

set -e

echo "🚀 Iniciando deploy direto do frontend no Kubernetes..."

# Configurações
SSH_KEY="~/.ssh/keyPrincipal.pem"
REMOTE_USER="ubuntu"
REMOTE_HOST="worker.wecando.click"
SSH_CMD="ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST}"
SCP_CMD="scp -i ${SSH_KEY}"

IMAGE_NAME="hmoraes/fiapx-frontend"
TAG="direct-deploy-$(date +%s)"
NAMESPACE="fiapx"

echo "📋 Configurações:"
echo "   Servidor: ${REMOTE_HOST}"
echo "   Usuário: ${REMOTE_USER}"
echo "   Imagem: ${IMAGE_NAME}:${TAG}"
echo "   Namespace: ${NAMESPACE}"

# 1. Verificar conectividade SSH
echo "🔐 Verificando conectividade SSH..."
if ! ${SSH_CMD} "echo 'Conexão SSH OK'"; then
    echo "❌ Erro na conexão SSH. Verifique:"
    echo "   - Chave SSH: ${SSH_KEY}"
    echo "   - Servidor: ${REMOTE_HOST}"
    echo "   - Usuário: ${REMOTE_USER}"
    exit 1
fi

# 2. Verificar se arquivos do frontend existem
echo "📂 Verificando arquivos do frontend..."
if [ ! -f "index.html" ] || [ ! -f "app.js" ] || [ ! -f "config.js" ]; then
    echo "❌ Arquivos do frontend não encontrados no diretório atual."
    echo "💡 Execute este script no diretório: /home/hqmoraes/Documents/fiap/projeto-fiapx/frontend"
    echo "📁 Diretório atual: $(pwd)"
    echo "📋 Arquivos necessários: index.html, app.js, config.js, auth.js, api.js, style.css"
    exit 1
fi

echo "✅ Arquivos do frontend encontrados"

# 3. Criar diretório temporário no servidor remoto
REMOTE_BUILD_DIR="~/frontend-build-$(date +%s)"
echo "📁 Criando diretório de build no servidor: ${REMOTE_BUILD_DIR}"
${SSH_CMD} "mkdir -p ${REMOTE_BUILD_DIR}"

# 4. Copiar arquivos do frontend para o servidor
echo "📤 Enviando arquivos do frontend para o servidor..."
${SCP_CMD} -r ./* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BUILD_DIR}/

# 5. Criar Dockerfile otimizado no servidor
echo "🐳 Criando Dockerfile no servidor..."
${SSH_CMD} "cat > ${REMOTE_BUILD_DIR}/Dockerfile << 'EOF'
# Multi-stage build para ARM64 - Frontend FIAPX
FROM nginx:alpine

# Remove conteúdo padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia arquivos do frontend
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY config.js /usr/share/nginx/html/
COPY auth.js /usr/share/nginx/html/
COPY api.js /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Configuração do nginx para SPA
RUN echo 'server { \\
    listen 80; \\
    server_name localhost; \\
    root /usr/share/nginx/html; \\
    index index.html; \\
    \\
    # Configuração para SPA \\
    location / { \\
        try_files \$uri \$uri/ /index.html; \\
    } \\
    \\
    # Headers de segurança \\
    add_header X-Frame-Options \"SAMEORIGIN\" always; \\
    add_header X-Content-Type-Options \"nosniff\" always; \\
    add_header X-XSS-Protection \"1; mode=block\" always; \\
    \\
    # Cache para arquivos estáticos \\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \\
        expires 1y; \\
        add_header Cache-Control \"public, immutable\"; \\
    } \\
    \\
    # Health check endpoint \\
    location /health { \\
        access_log off; \\
        return 200 \"healthy\\n\"; \\
        add_header Content-Type text/plain; \\
    } \\
}' > /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Comando de inicialização
CMD [\"nginx\", \"-g\", \"daemon off;\"]
EOF"

echo "✅ Dockerfile criado no servidor"

# 6. Login no Docker Hub no servidor
echo "🔑 Fazendo login no Docker Hub no servidor..."
${SSH_CMD} "echo 'Ch@plinh45' | docker login -u hmoraes --password-stdin"

# 7. Construir imagem no servidor ARM64
echo "🏗️ Construindo imagem Docker no servidor ARM64..."
${SSH_CMD} "cd ${REMOTE_BUILD_DIR} && docker build -t ${IMAGE_NAME}:${TAG} -t ${IMAGE_NAME}:latest ."

# 8. Push da imagem
echo "📤 Enviando imagem para Docker Hub..."
${SSH_CMD} "docker push ${IMAGE_NAME}:${TAG} && docker push ${IMAGE_NAME}:latest"

# 9. Verificar se kubectl está disponível no servidor
echo "🔧 Verificando kubectl no servidor..."
${SSH_CMD} "if ! command -v kubectl &> /dev/null; then
    echo 'Instalando kubectl...'
    curl -LO 'https://dl.k8s.io/release/\$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl'
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
fi"

# 10. Aplicar deploy no Kubernetes
echo "🚀 Fazendo deploy no Kubernetes..."

# Verificar se deployment existe
if ${SSH_CMD} "kubectl get deployment frontend-deployment -n ${NAMESPACE} &>/dev/null"; then
    echo "🔄 Atualizando deployment existente..."
    ${SSH_CMD} "kubectl set image deployment/frontend-deployment frontend=${IMAGE_NAME}:${TAG} -n ${NAMESPACE}"
    ${SSH_CMD} "kubectl rollout status deployment/frontend-deployment -n ${NAMESPACE} --timeout=300s"
else
    echo "🆕 Criando novo deployment..."
    
    # Criar manifesto Kubernetes no servidor
    ${SSH_CMD} "cat > ${REMOTE_BUILD_DIR}/frontend-k8s.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: ${NAMESPACE}
  labels:
    app: frontend
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        version: v1
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: frontend
              topologyKey: kubernetes.io/hostname
      containers:
      - name: frontend
        image: ${IMAGE_NAME}:${TAG}
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          protocol: TCP
        resources:
          requests:
            memory: \"64Mi\"
            cpu: \"50m\"
          limits:
            memory: \"128Mi\"
            cpu: \"100m\"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: ${NAMESPACE}
  labels:
    app: frontend
spec:
  selector:
    app: frontend
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP
EOF"
    
    # Aplicar manifesto
    ${SSH_CMD} "kubectl apply -f ${REMOTE_BUILD_DIR}/frontend-k8s.yaml"
    ${SSH_CMD} "kubectl rollout status deployment/frontend-deployment -n ${NAMESPACE} --timeout=300s"
fi

# 11. Verificar status
echo "🔍 Verificando status do deployment..."
${SSH_CMD} "kubectl get pods -l app=frontend -n ${NAMESPACE}"
${SSH_CMD} "kubectl get services -l app=frontend -n ${NAMESPACE}"

# 12. Aguardar pods ficarem prontos
echo "⏳ Aguardando pods ficarem prontos..."
${SSH_CMD} "kubectl wait --for=condition=ready pod -l app=frontend -n ${NAMESPACE} --timeout=300s"

# 13. Mostrar informações de acesso
echo ""
echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📊 Informações do deployment:"
echo "   Imagem: ${IMAGE_NAME}:${TAG}"
echo "   Namespace: ${NAMESPACE}"
echo "   Replicas: 2"
echo ""
echo "🌐 URLs de acesso:"
echo "   HTTPS: https://fiapx.wecando.click"
echo "   HTTP: http://worker.wecando.click (se ingress estiver configurado)"
echo ""
echo "🔍 Comandos úteis (executar no servidor):"
echo "   Logs: ${SSH_CMD} 'kubectl logs -l app=frontend -n ${NAMESPACE}'"
echo "   Status: ${SSH_CMD} 'kubectl get pods -l app=frontend -n ${NAMESPACE}'"
echo "   Restart: ${SSH_CMD} 'kubectl rollout restart deployment/frontend-deployment -n ${NAMESPACE}'"
echo "   Describe: ${SSH_CMD} 'kubectl describe deployment frontend-deployment -n ${NAMESPACE}'"

# 14. Limpeza
echo "🧹 Limpando arquivos temporários no servidor..."
${SSH_CMD} "rm -rf ${REMOTE_BUILD_DIR}"

# 15. Logout do Docker no servidor
echo "🔐 Fazendo logout do Docker no servidor..."
${SSH_CMD} "docker logout"

echo "✅ Script concluído com sucesso!"
echo ""
echo "🚀 O frontend foi atualizado e está rodando no Kubernetes!"
echo "📱 Acesse: https://fiapx.wecando.click"
