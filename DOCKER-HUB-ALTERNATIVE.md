# Alternativa: Workflow com Docker Hub

Se preferir usar Docker Hub ao invés de ECR, aqui está a configuração:

## 1. Configurar Secrets Docker Hub

```
DOCKER_USERNAME=<seu-usuario-docker>
DOCKER_PASSWORD=<seu-password-ou-token>
```

## 2. Workflow Alternativo

```yaml
  build-and-push:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          hqmoraes/fiapx-frontend:latest
          hqmoraes/fiapx-frontend:${{ github.sha }}
        platforms: linux/amd64,linux/arm64
```

## 3. Como Configurar

1. Acesse [Docker Hub](https://hub.docker.com)
2. Crie um token de acesso em **Account Settings** → **Security**
3. Configure os secrets no GitHub conforme documentado

**Nota**: A solução ECR é recomendada para projetos AWS por questões de segurança e integração.
