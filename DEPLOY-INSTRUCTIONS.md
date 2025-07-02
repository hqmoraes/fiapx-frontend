# 🚀 Deploy Direto no Kubernetes - Frontend

## 📋 Pré-requisitos

### 1. **Chave SSH** 
- ✅ Chave `~/.ssh/keyPrincipal.pem` já está configurada
- ✅ Permissões corretas: `chmod 600 ~/.ssh/keyPrincipal.pem`

### 2. **Conectividade**
- ✅ Acesso SSH ao servidor `worker.wecando.click`
- ✅ Docker instalado no servidor remoto
- ✅ Kubectl configurado no servidor remoto

### 3. **Arquivos do Frontend**
- ✅ `index.html`, `app.js`, `config.js`, `auth.js`, `api.js`, `style.css`
- ✅ Todas as alterações já aplicadas (limites de upload, logs de debug)

## 🎯 Execução do Deploy

### **Comando Principal:**
```bash
cd /home/hqmoraes/Documents/fiap/projeto-fiapx/frontend
./deploy-k8s-direct.sh
```

## 🔄 O que o Script Faz

### **Fase 1: Preparação**
1. ✅ Verifica conectividade SSH com `worker.wecando.click`
2. ✅ Confirma que arquivos do frontend existem
3. ✅ Cria diretório temporário no servidor

### **Fase 2: Build da Imagem**
4. ✅ Envia arquivos do frontend para o servidor ARM64
5. ✅ Cria Dockerfile otimizado para nginx
6. ✅ Faz login no Docker Hub no servidor
7. ✅ Constrói imagem `hmoraes/fiapx-frontend` no ARM64
8. ✅ Faz push da imagem para Docker Hub

### **Fase 3: Deploy Kubernetes**
9. ✅ Verifica se kubectl está instalado no servidor
10. ✅ Atualiza deployment existente OU cria novo
11. ✅ Aguarda pods ficarem prontos
12. ✅ Verifica status do deployment

### **Fase 4: Limpeza**
13. ✅ Remove arquivos temporários do servidor
14. ✅ Faz logout do Docker Hub
15. ✅ Exibe informações de acesso

## 📊 Resultado Esperado

### **Sucesso:**
```
🎉 Deploy concluído com sucesso!

📊 Informações do deployment:
   Imagem: hmoraes/fiapx-frontend:direct-deploy-1720000000
   Namespace: fiapx
   Replicas: 2

🌐 URLs de acesso:
   HTTPS: https://fiapx.wecando.click
   HTTP: http://worker.wecando.click

✅ Script concluído com sucesso!
🚀 O frontend foi atualizado e está rodando no Kubernetes!
```

### **Verificação:**
- ✅ Frontend acessível em `https://fiapx.wecando.click`
- ✅ Novos limites de upload (10MB, 30 arquivos)
- ✅ Logs de debug funcionando
- ✅ Todos os endpoints funcionais

## 🔍 Comandos de Monitoramento

### **Status dos Pods:**
```bash
ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click 'kubectl get pods -l app=frontend -n fiapx'
```

### **Logs do Frontend:**
```bash
ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click 'kubectl logs -l app=frontend -n fiapx'
```

### **Restart se Necessário:**
```bash
ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click 'kubectl rollout restart deployment/frontend-deployment -n fiapx'
```

## 🚨 Troubleshooting

### **Erro de SSH:**
```bash
# Verificar conectividade
ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click "echo 'OK'"

# Verificar permissões da chave
chmod 600 ~/.ssh/keyPrincipal.pem
```

### **Erro de Docker Login:**
```bash
# Verificar login manual
ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click
echo "Ch@plinh45" | docker login -u hmoraes --password-stdin
```

### **Erro de Kubernetes:**
```bash
# Verificar cluster
ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click 'kubectl get nodes'
ssh -i ~/.ssh/keyPrincipal.pem ubuntu@worker.wecando.click 'kubectl get namespaces'
```

## ⚡ Vantagens desta Abordagem

- ✅ **Build ARM64 Nativo**: Compatibilidade perfeita
- ✅ **Deploy Direto**: Sem dependência do GitHub Actions
- ✅ **Imediato**: Pronto para entrega do trabalho
- ✅ **Confiável**: Usa processo já validado
- ✅ **Rollback Fácil**: Imagens taggeadas por timestamp

## 🎯 Para a Entrega

1. **Execute o script**
2. **Acesse https://fiapx.wecando.click**
3. **Teste as funcionalidades:**
   - Upload de múltiplos arquivos (até 30)
   - Arquivos de até 10MB
   - Campos de status da fila
   - Logs de debug no console

**🏆 Sistema 100% operacional para a entrega!**
