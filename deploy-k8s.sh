#!/bin/bash

# Script para build e deploy do frontend no Kubernetes
set -e

echo "🚀 Iniciando build e deploy do Frontend no Kubernetes..."

# Variáveis
DOCKER_IMAGE="hqmoraes/fiapx-frontend"
TAG="latest"
FRONTEND_DIR="/home/hqmoraes/Documents/fiap/projeto-fiapx/frontend"
K8S_MANIFEST="/home/hqmoraes/Documents/fiap/projeto-fiapx/infrastructure/kubernetes/frontend/frontend.yaml"

# Mudar para o diretório do frontend
cd "$FRONTEND_DIR"

echo "📦 Building Docker image..."

# Build da imagem ARM64 para o cluster
docker buildx build \
    --platform linux/arm64 \
    -f Dockerfile.k8s \
    -t "${DOCKER_IMAGE}:${TAG}" \
    --push \
    .

echo "✅ Docker image built and pushed: ${DOCKER_IMAGE}:${TAG}"

echo "🔧 Deploying to Kubernetes..."

# Deploy no Kubernetes via SSH
ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click << 'REMOTE_EOF'
    # Aplicar namespace se não existir
    kubectl create namespace fiapx --dry-run=client -o yaml | kubectl apply -f -
    
    # Aplicar o manifest
    kubectl apply -f - << 'MANIFEST_EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: fiapx
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
      containers:
      - name: frontend
        image: hqmoraes/fiapx-frontend:latest
        ports:
        - containerPort: 80
          protocol: TCP
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
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
          failureThreshold: 3
        env:
        - name: NGINX_HOST
          value: "localhost"
        - name: NGINX_PORT
          value: "80"
      restartPolicy: Always
      imagePullPolicy: Always

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: fiapx
  labels:
    app: frontend
spec:
  selector:
    app: frontend
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service-external
  namespace: fiapx
  labels:
    app: frontend
spec:
  selector:
    app: frontend
  ports:
  - name: http
    port: 80
    targetPort: 80
    nodePort: 30080
    protocol: TCP
  type: NodePort
MANIFEST_EOF

    echo "📋 Checking deployment status..."
    kubectl get deployments -n fiapx
    kubectl get services -n fiapx
    kubectl get pods -n fiapx -l app=frontend

REMOTE_EOF

echo "✅ Frontend deployed successfully!"
echo "🌐 Access URLs:"
echo "   - Internal: http://frontend-service.fiapx.svc.cluster.local"
echo "   - External: http://worker.wecando.click:30080"

echo "🔍 To check logs:"
echo "   ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click 'kubectl logs -f -n fiapx deployment/frontend-deployment'"
