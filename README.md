# Frontend

A aplicação `frontend` é a interface com o usuário da plataforma FIAP-X. Desenvolvida com HTML, CSS e JavaScript, ela permite que os usuários interajam com o sistema, façam upload de vídeos e acompanhem o status do processamento.

## Funcionalidades

- **Upload de Vídeos**: Interface para selecionar e enviar arquivos de vídeo.
- **Acompanhamento em Tempo Real**: Exibe o status atualizado do processamento de cada vídeo.
- **Autenticação de Usuário**: Integração com o `auth-service` para login e registro.
- **Design Responsivo**: Adaptável a diferentes tamanhos de tela.

## Deploy

O frontend é hospedado na AWS Amplify, com deploy contínuo configurado a partir da branch `main`. O acesso é feito através da URL principal da aplicação, com HTTPS garantido pelo CloudFront.

- **URL**: [https://fiapx.wecando.click](https://fiapx.wecando.click)