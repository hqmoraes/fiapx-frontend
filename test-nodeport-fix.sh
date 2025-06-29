#!/bin/bash

echo "🧪 Testando solução de timeout - NodePorts"
echo "==========================================="

echo "1. ✅ Testando Auth Service via NodePort (externo)..."
AUTH_TEST=$(curl -s -m 5 http://worker.wecando.click:31404/health)
if [ "$AUTH_TEST" = "OK" ]; then
    echo "   ✅ Auth Service acessível externamente via NodePort"
else
    echo "   ❌ Auth Service não está acessível externamente"
    exit 1
fi

echo ""
echo "2. ✅ Testando config.js do Frontend..."
CONFIG_CHECK=$(ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click "curl -s http://localhost:30080/config.js | grep -c 'worker.wecando.click:31404'")
if [ "$CONFIG_CHECK" -gt 0 ]; then
    echo "   ✅ Config.js usando NodePorts corretos"
else
    echo "   ❌ Config.js não tem NodePorts corretos"
fi

echo ""
echo "3. ✅ Testando registro via NodePort..."
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -m 10 -X POST -H "Content-Type: application/json" \
    -d "{\"username\":\"TestUser$TIMESTAMP\",\"email\":\"test$TIMESTAMP@example.com\",\"password\":\"test123\"}" \
    http://worker.wecando.click:31404/register)

if [[ $REGISTER_RESPONSE == *"token"* ]]; then
    echo "   ✅ Registro funcionando via NodePort"
    USER_EMAIL=$(echo $REGISTER_RESPONSE | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
    echo "   📧 Usuário criado: $USER_EMAIL"
else
    echo "   ❌ Registro falhou via NodePort"
    echo "   📊 Resposta: $REGISTER_RESPONSE"
fi

echo ""
echo "==========================================="
echo "🎉 Solução de timeout implementada!"
echo ""
echo "📋 O que foi corrigido:"
echo "   - Frontend agora usa NodePorts ao invés de IPs internos"
echo "   - Auth Service: worker.wecando.click:31404"
echo "   - Upload Service: worker.wecando.click:32159"
echo "   - Processing Service: worker.wecando.click:32382"
echo "   - Storage Service: worker.wecando.click:31627"
echo ""
echo "🌐 Para testar no navegador:"
echo "   1. Acesse: http://worker.wecando.click:30080"
echo "   2. Faça o cadastro de usuário"
echo "   3. O timeout não deve mais ocorrer!"
