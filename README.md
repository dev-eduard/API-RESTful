# API RESTful com JWT

Este projeto é uma API RESTful em Node.js usando MongoDB, com autenticação JWT para proteger as rotas de usuário.

## Como funciona a autenticação JWT
- Ao criar um usuário (`POST /register`), um token JWT único é gerado e retornado na resposta.
- Para acessar rotas protegidas (listar, buscar, atualizar ou deletar usuários), envie o token JWT no header `Authorization` no formato:
  ```
  Authorization: Bearer SEU_TOKEN_AQUI
  ```

## Rotas da API

| Método | Endpoint              | Proteção         | Descrição                                                        |
|--------|-----------------------|------------------|------------------------------------------------------------------|
| GET    | /api/users            | Token JWT        | Lista todos os usuários                                          |
| GET    | /api/users/:id        | Token JWT        | Busca usuário por ID                                             |
| POST   | /api/users            | Token admin      | Cria usuário (só admin pode criar admin)                        |
| POST   | /api/users/register   | Pública          | Cria usuário comum                                              |
| POST   | /api/users/login      | Pública/limite   | Login de usuário, retorna token JWT (5 tentativas por hora/IP)   |
| PUT    | /api/users/:id        | Token JWT        | Atualiza usuário (só o próprio usuário ou admin)                |
| DELETE | /api/users/:id        | Token JWT        | Remove usuário (só o próprio usuário ou admin)                  |

> **Observação:**
> - "Token JWT" = precisa estar autenticado.
> - "Token admin" = precisa ser admin autenticado.
> - "Pública/limite" = qualquer um pode acessar, mas há limite de tentativas.

## Permissões
- Usuário comum só pode editar/excluir o próprio cadastro.
- Apenas admin pode criar outro admin.
- O campo `role` define o tipo de usuário (`user` ou `admin`).

## Exemplo de uso com curl

### Criar usuário comum e obter token
```sh
curl -X POST http://localhost:3000/api/users/register \
  -H 'Content-Type: application/json' \
  -d '{'name':'João','email':'joao@email.com','password':'123456'}'
```

### Criar admin (precisa de token de admin)
```sh
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_TOKEN_ADMIN' \
  -d '{'name':'Admin2','email':'admin2@email.com','password':'admin123','role':'admin'}'
```

### Usar o token para acessar rotas protegidas
```sh
curl http://localhost:3000/api/users \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI'
```

## Login do usuário (obter token)

Para obter o token JWT de qualquer usuário (incluindo admin), faça login:

```sh
curl -X POST http://localhost:3000/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{'email':'admin@admin.com','password':'admin123'}'
```

A resposta trará o token JWT para usar nas rotas protegidas.

## Script Seed para criar Admin

Para criar rapidamente um usuário admin padrão:

1. Certifique-se de que o arquivo `.env` está configurado corretamente com `MONGO_URI`.
2. No terminal, execute:
   ```powershell
   node Seeds/Admin.js
   ```
3. Será criado um admin com:

   - E-mail: admin@admin.com
   - Senha: admin123

> **Obs:** Altere a senha e email do admin!

## Configuração

- Crie um arquivo `.env` na raiz do projeto e adicione:
  ```
  MONGO_URI=SEU_MONGO_URI
  PORT=7777
  JWT_SECRET=sua_chave_secreta
  ```
- Instale as dependências:
  ```
  npm i
  ```
- Inicie o servidor:
  ```
  npm start
  ```

## Sobre o Token JWT

- Um novo token JWT é gerado a cada login, mesmo para o mesmo usuário.
- Isso é esperado e seguro, pois o token inclui informações como data/hora de emissão (`iat`), tornando cada token único.
- Todos os tokens gerados permanecem válidos até expirarem (por padrão, 1 dia).
- O token nunca é salvo no banco, apenas enviado ao cliente e validado pelo backend.

> **Importante:**
> Não se preocupe se o token mudar a cada login — isso é o funcionamento correto do JWT!

---

Dúvidas? Abra uma issue ou peça ajuda!
