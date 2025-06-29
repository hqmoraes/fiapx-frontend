#!/bin/bash

echo "🧪 Testando integração do frontend com backend..."

# Teste de health checks
echo "1. Testando health checks dos serviços..."
echo -n "Frontend: "
curl -s http://localhost:30080/health

echo -n "Auth Service: "
curl -s http://10.96.183.248:8082/health

echo -n "Upload Service: "
curl -s http://10.108.62.236:8080/health

echo -n "Processing Service: "
curl -s http://10.111.116.134:8080/health

echo -n "Storage Service: "
curl -s http://10.98.28.49:8080/health

echo ""
echo "2. Testando registro de usuário via API..."

# Teste de registro direto via API
REGISTER_DATA='{"name":"Teste User","email":"teste@example.com","password":"teste123"}'
echo "Dados do registro: $REGISTER_DATA"

REGISTER_RESPONSE=$(curl -s -X POST \
  http://10.96.183.248:8082/register \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

echo "Resposta do registro: $REGISTER_RESPONSE"

echo ""
echo "3. Verificando se o frontend está carregando corretamente..."
curl -s http://localhost:30080/ | grep -q "FIAP X" && echo "✅ Frontend carregado corretamente" || echo "❌ Problema no frontend"

echo ""
echo "🎉 Teste concluído!"
