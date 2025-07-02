# Configuração dos Secrets do GitHub para Docker Hub

## 📋 Secrets Necessários

Para que o workflow do GitHub Actions funcione corretamente, você precisa configurar os seguintes secrets no repositório do GitHub:

### **Secrets do Docker Hub:**
- `DOCKER_USERNAME`: `hmoraes`
- `DOCKER_PASSWORD`: `Ch@plinh45`

## 🔧 Como Configurar os Secrets

### **Passo 1: Acessar as Configurações do Repositório**
1. Vá para o repositório do frontend no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

### **Passo 2: Adicionar os Secrets**
1. Clique em **New repository secret**
2. Configure os seguintes secrets:

#### **Secret 1: DOCKER_USERNAME**
- **Name**: `DOCKER_USERNAME`
- **Secret**: `hmoraes`
- Clique em **Add secret**

#### **Secret 2: DOCKER_PASSWORD**
- **Name**: `DOCKER_PASSWORD`
- **Secret**: `Ch@plinh45`
- Clique em **Add secret**

## ✅ Verificação

Após configurar os secrets, o workflow deve funcionar corretamente e fazer o push das imagens para:
- `hmoraes/fiapx-frontend:latest`
- `hmoraes/fiapx-frontend:SHA_DO_COMMIT`

## 🐳 Imagens Docker Geradas

O workflow irá gerar imagens Docker com as seguintes tags:
- **Latest**: `docker pull hmoraes/fiapx-frontend:latest`
- **Specific Commit**: `docker pull hmoraes/fiapx-frontend:abc123...` (SHA do commit)

## 📝 Observações

- ⚠️ **Segurança**: Os secrets são criptografados e não são visíveis após serem salvos
- 🔄 **Trigger**: O build e push só acontece quando há merge/push na branch `main`
- 🏗️ **Plataformas**: As imagens são construídas para `linux/amd64` e `linux/arm64`
- ✅ **Testes**: O workflow roda testes antes de fazer o build da imagem

## 🚨 Troubleshooting

### Se ainda houver erro de autenticação:
1. Verifique se os secrets foram salvos corretamente
2. Confirme que o nome dos secrets está exatamente como especificado:
   - `DOCKER_USERNAME` (exato)
   - `DOCKER_PASSWORD` (exato)
3. Aguarde alguns minutos e tente novamente o workflow

### Se o push falhar:
1. Verifique se o usuário `hmoraes` tem permissão para criar repositórios no Docker Hub
2. Confirme que o repositório `hmoraes/fiapx-frontend` existe ou pode ser criado automaticamente
