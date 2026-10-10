# 📋 Amanda Task Board (To-Do List Full Stack)

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Serverless-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

Aplicação moderna e completa de gerenciamento de tarefas desenvolvida com **React + TypeScript** no frontend, **FastAPI (Python 3.12)** no backend e **SQLite com SQLModel**, totalmente implantada na nuvem **AWS (Amazon Web Services)** através de uma arquitetura **100% Serverless**.

---

## 🌐 Demonstração Online (Links do Projeto no Ar)

| Serviço | Descrição | Link de Acesso |
| :--- | :--- | :--- |
| 🔒 **Aplicação Web (Produção)** | Frontend React servido via CDN global com HTTPS | [https://dvm8tyz2ogf1b.cloudfront.net](https://dvm8tyz2ogf1b.cloudfront.net) |
| ⚡ **API Backend (FastAPI)** | API REST Serverless na AWS Lambda | [https://kg02wdtsx4.execute-api.us-east-1.amazonaws.com](https://kg02wdtsx4.execute-api.us-east-1.amazonaws.com) |
| 📖 **Documentação Swagger** | Documentação interativa e testes de rotas OpenAPI | [https://kg02wdtsx4.execute-api.us-east-1.amazonaws.com/docs](https://kg02wdtsx4.execute-api.us-east-1.amazonaws.com/docs) |
| 🪣 **Bucket S3 Website** | Endpoint direto do bucket estático no S3 | [http://todolist-app-003107248488.s3-website-us-east-1.amazonaws.com](http://todolist-app-003107248488.s3-website-us-east-1.amazonaws.com) |

---

## 🛠️ Stacks e Tecnologias Utilizadas

### 🎨 Frontend
* **[React 19](https://react.dev/):** Biblioteca para interfaces reativas, declarativas e modulares baseadas em componentes funcionais e React Hooks (`useState`, `useEffect`, `useRef`).
* **[TypeScript](https://www.typescriptlang.org/):** Tipagem estática rigorosa para garantir segurança e consistência de dados no cliente.
* **[Vite](https://vite.dev/):** Bundler moderno e servidor de desenvolvimento ultra-rápido com Hot Module Replacement (HMR).
* **[Lucide React](https://lucide.dev/):** Biblioteca moderna de ícones vetoriais.
* **CSS3 Puro:** Estilização modular com CSS Grid, Flexbox, variáveis personalizadas e tipografia Montserrat (sem frameworks pesados).
* **HTML5 Drag & Drop API:** Reordenação manual e fluida de tarefas arrastando e soltando.

### ⚙️ Backend
* **[Python 3.12](https://www.python.org/):** Versão moderna da linguagem Python.
* **[FastAPI](https://fastapi.tiangolo.com/):** Framework web assíncrono de alta performance para construção de APIs RESTful.
* **[Mangum](https://mangum.io/):** Adaptador ASGI que permite executar a aplicação FastAPI dentro do ambiente **AWS Lambda**.
* **[Uvicorn](https://www.uvicorn.org/):** Servidor ASGI com recarregamento automático (WatchFiles) para desenvolvimento local.
* **[Pydantic v2](https://docs.pydantic.dev/):** Validação de schemas, serialização e tratamento rigoroso de payloads HTTP.
* **CORS:** Middleware configurado para integração segura entre origens cruzadas.

### 🗄️ Banco de Dados & ORM
* **[SQLite](https://www.sqlite.org/):** Banco de dados relacional embutido e veloz.
* **[SQLModel](https://sqlmodel.tiangolo.com/):** ORM que unifica SQLAlchemy e Pydantic para modelagem e consultas tipadas.
* **Sincronização Serverless S3:** Persistência automática do arquivo `tarefas.db` no Amazon S3 a cada modificação na AWS Lambda.

### ☁️ Nuvem & Infraestrutura (AWS Serverless)
* **[Amazon CloudFront](https://aws.amazon.com/cloudfront/):** Rede de distribuição de conteúdo (CDN) global com certificado SSL/TLS (HTTPS).
* **[Amazon S3 (Simple Storage Service)](https://aws.amazon.com/s3/):** Hospedagem estática dos artefatos do frontend e armazenamento persistente do banco.
* **[AWS Lambda](https://aws.amazon.com/lambda/):** Execução serverless da API Python (FastAPI) sem provisionamento de servidores.
* **[Amazon API Gateway (HTTP API)](https://aws.amazon.com/api-gateway/):** Roteamento HTTP, proxy reverso e gerenciamento de políticas CORS.
* **[AWS IAM](https://aws.amazon.com/iam/):** Funções e políticas de segurança com privilégios mínimos de execução.

---

## 🏗️ Diagrama de Arquitetura em Nuvem

```text
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     CLIENTE / NAVEGADOR         │       │          AMAZON CLOUDFRONT      │
│   (Acesso via HTTPS / Web)      ├──────►│      (CDN Global + SSL/TLS)     │
└─────────────────────────────────┘       └───────────────┬─────────────────┘
                                                          │
                                                          ▼
                                          ┌─────────────────────────────────┐
                                          │            AMAZON S3            │
                                          │ (Bucket de Hospedagem Estática) │
                                          └─────────────────────────────────┘
                 │
                 │ Requisições REST (JSON)
                 ▼
┌─────────────────────────────────┐
│       AMAZON API GATEWAY        │
│   (HTTP API com CORS liberado)  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│         AWS LAMBDA              │
│  FastAPI + Python 3.12 (Mangum) │
└────────────────┬────────────────┘
                 │
                 ▼ Sincronização automática
┌─────────────────────────────────┐
│            AMAZON S3            │
│   (Bucket com banco tarefas.db) │
└─────────────────────────────────┘
```

---

## ✨ Funcionalidades Principais

* ✅ **CRUD Completo de Tarefas:** Criação, leitura, atualização e exclusão com feedback instantâneo.
* 🏷️ **Categorias Dinâmicas e Editáveis:**
  * Criação de novas categorias sob demanda.
  * Modo de edição para renomear e excluir categorias existentes.
  * Seletor de categoria em tempo real diretamente em cada tarefa da lista.
* ↕️ **Reordenação Inteligente:** Arraste e solte tarefas (Drag & Drop) ou utilize as setas de ordenação com persistência em lote (`PUT /tarefas/ordem`).
* 📊 **Histórico e Métricas:** Aba de histórico com visualização de tarefas concluídas nos últimos 12 meses, filtros por categoria e barra de distribuição percentual de dedicação.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
* **Node.js** (v18+)
* **Python** (3.10+)

### Execução com 1 Comando
Na raiz do projeto:

```bash
npm run dev
```

* **Frontend:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
* **Backend:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📁 Estrutura de Pastas

```text
├── backend/
│   ├── database.py       # Conexão SQLite e sincronização com S3
│   ├── main.py           # Endpoints FastAPI, regras de negócio e handler Mangum
│   ├── models.py         # Modelos de dados com SQLModel
│   ├── schemas.py        # Schemas de validação com Pydantic
│   ├── requirements.txt  # Dependências Python
│   └── test_ordem.py     # Testes automatizados de reordenação
├── src/
│   ├── services/
│   │   └── tasksApi.ts   # Cliente HTTP configurado para ambiente local e nuvem
│   ├── App.tsx           # Interface interativa React
│   ├── main.tsx          # Ponto de entrada da aplicação
│   ├── style.css         # Estilos da interface
│   └── vite-env.d.ts     # Declaração de tipos de ambiente Vite
├── package.json          # Scripts e dependências Node.js
└── README.md             # Documentação do projeto
```

---

Desenvolvido por **Amanda Reis**
