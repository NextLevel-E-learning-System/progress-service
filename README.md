# Progress Service

## 📋 Visão Geral

O **Progress Service** é um microserviço do sistema NextLevel E-learning responsável por gerenciar o progresso dos alunos em cursos, incluindo inscrições, acompanhamento de módulos e emissão de certificados. Este serviço faz parte de uma arquitetura de microserviços orientada a eventos.

## 🎯 Funcionalidades Principais

### Gerenciamento de Inscrições
- Criação de inscrições em cursos com verificação de pré-requisitos
- Listagem de inscrições por usuário e por curso
- Validação de duplicidade de inscrições ativas
- Controle de status de inscrição (ATIVO, CONCLUÍDO)

### Acompanhamento de Progresso
- Inicialização de módulos de curso
- Conclusão de módulos com atualização automática de progresso
- Visualização de progresso composto (módulos com status)
- Cálculo automático de conclusão de curso

### Sistema de Certificados
- Emissão automática de certificados ao concluir cursos
- Geração de PDF com QR Code de validação
- Armazenamento em S3 ou sistema de arquivos local
- Consulta de certificados por usuário
- Hash de validação para autenticidade

## 🏗️ Arquitetura

### Stack Tecnológica
- **Runtime**: Node.js 22 (Alpine)
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **Mensageria**: RabbitMQ (AMQP)
- **Storage**: AWS S3 ou Local Storage
- **Logging**: Pino
- **Validação**: Zod
- **Documentação**: OpenAPI/Swagger

### Estrutura do Projeto

```
src/
├── config/           # Configurações (RabbitMQ, OpenAPI, Logger)
├── controllers/      # Handlers de requisições HTTP
├── repositories/     # Camada de acesso a dados
├── services/         # Lógica de negócio
├── routes/           # Definição de rotas da API
├── types/            # Tipos TypeScript
├── utils/            # Utilitários (PDF, Storage, Service Clients)
├── validation/       # Schemas de validação Zod
├── db.ts            # Configuração do pool PostgreSQL
├── server.ts        # Configuração do servidor Express
└── index.ts         # Ponto de entrada da aplicação
```

## 🔌 API Endpoints

### Inscrições
- `POST /progress/v1/inscricoes` - Criar nova inscrição
- `GET /progress/v1/inscricoes` - Listar inscrições de um curso
- `GET /progress/v1/inscricoes/usuario/:userId` - Listar inscrições de um usuário
- `GET /progress/v1/inscricoes/:id/modulos-progresso` - Ver progresso detalhado

### Progresso de Módulos
- `POST /progress/v1/inscricoes/:inscricaoId/modulos/:moduloId/iniciar` - Iniciar módulo
- `PATCH /progress/v1/inscricoes/:inscricaoId/modulos/:moduloId/concluir` - Concluir módulo

### Certificados
- `GET /progress/v1/certificates/user/:userId` - Listar certificados do usuário
- `POST /progress/v1/certificates/enrollment/:enrollmentId` - Emitir certificado
- `GET /progress/v1/certificates/enrollment/:enrollmentId/pdf` - Baixar PDF do certificado

### Documentação
- `GET /openapi.json` - Especificação OpenAPI

## ⚙️ Configuração

### Variáveis de Ambiente

#### Servidor
- `PORT` - Porta do servidor (padrão: 3333)
- `CORS_ORIGINS` - Origens permitidas (separadas por vírgula)
- `ALLOW_ALL_ORIGINS` - Permitir todas as origens (true/false)
- `LOG_LEVEL` - Nível de log do Pino

#### Banco de Dados
- `DATABASE_URL` - String de conexão PostgreSQL
- `PG_SCHEMA` - Schema do PostgreSQL (opcional)

#### Mensageria
- `RABBITMQ_URL` - URL de conexão RabbitMQ (padrão: amqp://localhost)
- `EXCHANGE_PROGRESS` - Nome do exchange (padrão: progress.events)

#### Serviços Externos
- `USER_SERVICE_BASE_URL` - URL base do serviço de usuários
- `COURSE_SERVICE_BASE_URL` - URL base do serviço de cursos

#### Storage (S3 ou Local)
- `STORAGE_TYPE` - Tipo de storage: 's3' ou 'local'
- `STORAGE_ENDPOINT` - Endpoint do S3
- `STORAGE_REGION` - Região do S3
- `STORAGE_ACCESS_KEY` - Access Key do S3
- `STORAGE_SECRET_KEY` - Secret Key do S3
- `STORAGE_BUCKET_CERTIFICADOS` - Bucket para certificados
- `STORAGE_ENV_PREFIX` - Prefixo para arquivos
- `LOCAL_STORAGE_PATH` - Caminho para storage local
- `PUBLIC_URL_BASE` - URL base pública para arquivos

## 🚀 Desenvolvimento

### Pré-requisitos
- Node.js 22+
- PostgreSQL
- RabbitMQ

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env  # Criar arquivo .env com as variáveis necessárias
```

### Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build do TypeScript
npm run build

# Executar em produção
npm start

# Linting
npm run lint
npm run lint:fix

# Formatação de código
npm run format
```

## 🐳 Docker

O serviço pode ser executado em container Docker:

```bash
# Build da imagem
docker build -t progress-service .

# Executar container
docker run -p 3333:3333 --env-file .env progress-service
```

## 📊 Integração com Outros Serviços

### Eventos Publicados (RabbitMQ)
- `course.completed` - Quando um curso é concluído
- `module.completed` - Quando um módulo é concluído

### Serviços Consumidos
- **User Service**: Busca informações de usuários e instrutores
- **Course Service**: Busca informações de cursos, módulos e pré-requisitos

## 🔐 Segurança

- Validação de entrada com Zod
- Hash de validação SHA-256 para certificados
- QR Code para verificação de autenticidade
- Configuração de CORS
- Timezone configurado para America/Sao_Paulo

## 📝 Observações

- O serviço utiliza timezone `America/Sao_Paulo` para todas as operações de data/hora
- Certificados são gerados automaticamente ao concluir um curso
- O sistema valida pré-requisitos antes de permitir inscrições
- Suporta paginação e filtros nas listagens