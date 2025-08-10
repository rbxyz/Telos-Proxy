# Redis - Variáveis de Ambiente e Integração

Este projeto utiliza Redis de forma opcional para cache de respostas e, futuramente, rate limiting. Caso `REDIS_URL` não esteja definida, a aplicação continua funcionando sem cache.

## Variáveis

- `REDIS_URL`: URL de conexão do Redis. Exemplos:
  - Upstash: `rediss://:<password>@<host>:<port>`
  - Local (docker): `redis://localhost:6379`

## Como a aplicação lê as variáveis

As variáveis são validadas em `src/env.js` e acessadas via `env.REDIS_URL`. O cliente Redis é criado em `src/server/redis/client.ts`.

- Se `REDIS_URL` estiver ausente, `getRedis()` retorna `null` e o cache é ignorado.
- Se presente, a conexão é criada com `ioredis`.

## Passos de configuração

1. Crie um Redis (Upstash, Railway, local, etc.).
2. Adicione `REDIS_URL` ao `.env` local e aos ambientes (Vercel) sem commitar segredos.
3. Reinicie o servidor.

## Boas práticas

- Não commitar `.env` (use `.env.local`).
- Em produção, use `rediss://` (TLS) sempre que possível.
- Defina TTLs de cache de acordo com o caso de uso (padrão atual: 5 minutos).