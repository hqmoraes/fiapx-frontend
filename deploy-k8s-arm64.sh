#!/bin/bash

# Script para build e deploy do frontend no servidor ARM64
set -e

echo "🚀 Iniciando build e deploy do frontend no servidor ARM64..."

# Configurações
REMOTE_HOST="worker.wecando.click"
REMOTE_USER="ubuntu"
SSH_KEY="~/.ssh/keyPrincipal.pem"
DOCKER_IMAGE="hqmoraes/fiapx-frontend:latest"
NAMESPACE="fiapx"

# Criar diretório temporário no servidor remoto
echo "📁 Preparando ambiente no servidor remoto..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST "mkdir -p ~/fiapx-frontend-build"

# Copiar arquivos do frontend para o servidor
echo "📤 Copiando arquivos do frontend..."
scp -i $SSH_KEY -r \
    index.html \
    style.css \
    config-k8s.js \
    auth.js \
    api.js \
    app.js \
    package.json \
    Dockerfile \
    $REMOTE_USER@$REMOTE_HOST:~/fiapx-frontend-build/

# Renomear config-k8s.js para config.js no servidor remoto
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST "cd ~/fiapx-frontend-build && mv config-k8s.js config.js"

# Fazer build da imagem Docker no servidor ARM64
echo "🐳 Fazendo build da imagem Docker no servidor ARM64..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST << 'EOF'
cd ~/fiapx-frontend-build
echo "Building Docker image..."
docker build --platform linux/arm64 -t hqmoraes/fiapx-frontend:latest .
echo "Docker build completed successfully!"
EOF

# Push da imagem para Docker Hub
echo "📤 Fazendo push da imagem para Docker Hub..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST << 'EOF'
echo "Pushing to Docker Hub..."
docker push hqmoraes/fiapx-frontend:latest
echo "Docker push completed successfully!"
EOF

# Deploy no Kubernetes
echo "☸️ Fazendo deploy no Kubernetes..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST << 'EOF'
echo "Applying Kubernetes manifests..."
kubectl apply -f ~/infrastructure/kubernetes/frontend/frontend.yaml
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/frontend-deployment -n fiapx --timeout=300s
echo "Getting service information..."
kubectl get services -n fiapx | grep frontend
EOF

echo "✅ Deploy do frontend concluído com sucesso!"
echo "🌐 Frontend acessível via NodePort 30080"
echo "🔍 Para verificar status: kubectl get pods -n fiapx | grep frontend"

# Limpar arquivos temporários no servidor remoto
echo "🧹 Limpando arquivos temporários..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST "rm -rf ~/fiapx-frontend-build"

echo "🎉 Script concluído!"
