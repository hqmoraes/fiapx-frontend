# Configuração de Secrets GitHub - Frontend

## Secrets Necessários para CI/CD

Para que o workflow de CI/CD funcione corretamente, os seguintes secrets devem ser configurados no repositório GitHub:

### 1. AWS Credentials (Obrigatórios)

```
AWS_ACCESS_KEY_ID=<sua-access-key>
AWS_SECRET_ACCESS_KEY=<sua-secret-key>
AWS_REGION=us-east-1
```

### 2. Como Configurar os Secrets

#### Via GitHub Web Interface:
1. Acesse o repositório: `https://github.com/hmoraes/fiapx-frontend`
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret com seu respectivo valor

#### Via GitHub CLI:
```bash
# Configurar AWS credentials
gh secret set AWS_ACCESS_KEY_ID --body "AKIA..."
gh secret set AWS_SECRET_ACCESS_KEY --body "..."
gh secret set AWS_REGION --body "us-east-1"
```

### 3. Criação do Repositório ECR

Se o repositório ECR não existir, crie-o:

```bash
# Via AWS CLI
aws ecr create-repository \
    --repository-name fiapx-frontend \
    --region us-east-1

# Via Terraform (recomendado)
resource "aws_ecr_repository" "fiapx_frontend" {
  name                 = "fiapx-frontend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}
```

### 4. Políticas IAM Necessárias

O usuário AWS associado às credenciais deve ter as seguintes permissões:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ],
            "Resource": "*"
        }
    ]
}
```

### 5. Verificação da Configuração

Após configurar os secrets, você pode verificar se estão funcionando:

1. Faça um push para a branch `main`
2. Vá em **Actions** no GitHub
3. Verifique se o workflow executa sem erros

### 6. Troubleshooting

#### Erro: "Username and password required"
- Verifique se `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` estão configurados
- Confirme se as credenciais são válidas

#### Erro: "Repository does not exist"
- Crie o repositório ECR conforme instrução acima
- Verifique se o nome do repositório está correto

#### Erro: "Access denied"
- Verifique se o usuário AWS tem as permissões ECR necessárias
- Confirme se a região está correta

## Alteração Realizada

O workflow foi atualizado para usar **Amazon ECR** ao invés do Docker Hub, eliminando a necessidade dos secrets `DOCKER_USERNAME` e `DOCKER_PASSWORD`.

### Benefícios:
- ✅ Integração nativa com AWS
- ✅ Melhor segurança
- ✅ Controle de acesso via IAM
- ✅ Suporte a multi-arquitetura (amd64/arm64)
- ✅ Tags automáticos (latest + commit SHA)

### Imagens Geradas:
- `<account-id>.dkr.ecr.us-east-1.amazonaws.com/fiapx-frontend:latest`
- `<account-id>.dkr.ecr.us-east-1.amazonaws.com/fiapx-frontend:<commit-sha>`
