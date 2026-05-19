# Supabase setup

Este projeto agora usa Supabase como armazenamento principal em producao para:

- produtos
- pedidos
- anotacoes da loja
- assinaturas de notificacao push

## 1. Criar as tabelas

No painel do Supabase, abra o SQL Editor e rode o conteudo de [schema.sql](./schema.sql).

## 2. Configurar as variaveis

Adicione estas variaveis na Vercel e no ambiente local quando quiser testar com Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
```

Use a `service_role` apenas no servidor. Ela e lida pelas rotas da API.

## 3. Publicar de novo

Depois de salvar as variaveis na Vercel, faca um novo deploy para a API passar a gravar e ler do Supabase.

## 4. Recriar o catalogo

Os produtos que falharam durante o periodo em que o Blob atingiu limite nao ficaram persistidos. Depois da configuracao, cadastre os produtos novamente no admin.

## Observacoes

- O Blob da Vercel deixa de ser necessario para catalogo, pedidos, anotacoes e push.
- O upload de imagem atual continua retornando `data:` URL, entao essa parte nao depende do Blob.
