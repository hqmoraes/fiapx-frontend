#!/bin/bash

echo "🧪 Testando integração Frontend <-> Backend no Kubernetes"
echo "============================================================"

# Configurações
FRONTEND_URL="http://localhost:30080"
SSH_CMD="ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click"

echo "1. ✅ Testando Health Check do Frontend..."
HEALTH_RESPONSE=$($SSH_CMD "curl -s -m 5 $FRONTEND_URL/health")
if [ "$HEALTH_RESPONSE" = "healthy" ]; then
    echo "   ✅ Frontend está rodando: $HEALTH_RESPONSE"
else
    echo "   ❌ Frontend não está respondendo"
    exit 1
fi

echo ""
echo "2. ✅ Testando se o frontend carrega corretamente..."
HTML_CHECK=$($SSH_CMD "curl -s -m 5 $FRONTEND_URL/ | grep -c 'FIAP X'")
if [ "$HTML_CHECK" -gt 0 ]; then
    echo "   ✅ Frontend carregou a página principal"
else
    echo "   ❌ Frontend não carregou corretamente"
fi

echo ""
echo "3. ✅ Testando conectividade Backend (Auth Service)..."
AUTH_HEALTH=$($SSH_CMD "kubectl exec -n fiapx deployment/frontend-deployment -- curl -s -m 5 http://10.96.183.248:8082/health")
if [ "$AUTH_HEALTH" = "OK" ]; then
    echo "   ✅ Auth Service está respondendo: $AUTH_HEALTH"
else
    echo "   ❌ Auth Service não está respondendo"
fi

echo ""
echo "4. ✅ Testando registro de usuário via API..."
REGISTER_TEST=$($SSH_CMD 'kubectl exec -n fiapx deployment/frontend-deployment -- curl -s -m 10 -X POST -H "Content-Type: application/json" -d "{\"username\":\"TestUser$(date +%s)\",\"email\":\"test$(date +%s)@example.com\",\"password\":\"test123\"}" http://10.96.183.248:8082/register')

if [[ $REGISTER_TEST == *"token"* ]]; then
    echo "   ✅ Registro de usuário funcionando"
    echo "   📊 Resposta: $(echo $REGISTER_TEST | jq -r '.user.username + " (" + .user.email + ")"' 2>/dev/null || echo "Token recebido")"
else
    echo "   ❌ Registro de usuário falhou"
    echo "   📊 Resposta: $REGISTER_TEST"
fi

echo ""
echo "5. ✅ Verificando se config.js tem as URLs corretas..."
CONFIG_CHECK=$($SSH_CMD "curl -s $FRONTEND_URL/config.js | grep -c 'AUTH_SERVICE_URL.*10.96.183.248'")
if [ "$CONFIG_CHECK" -gt 0 ]; then
    echo "   ✅ Config.js tem URLs corretas dos serviços internos"
else
    echo "   ⚠️  Config.js pode não ter URLs corretas"
fi

echo ""
echo "============================================================"
echo "🎉 Teste de integração concluído!"
echo ""
echo "📋 Para testar manualmente:"
echo "   - Acesse: http://worker.wecando.click:30080 (se porta estiver aberta)"
echo "   - Ou use port-forward: kubectl port-forward -n fiapx service/frontend-service-external 8080:80"
echo "   - Em seguida acesse: http://localhost:8080"
echo ""
echo "🔍 Para verificar logs:"
echo "   kubectl logs -n fiapx deployment/frontend-deployment"
echo "   kubectl logs -n fiapx deployment/auth-service"
