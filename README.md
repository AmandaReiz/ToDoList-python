# Amanda Task Board (To-Do List Full Stack)

Aplicação completa de lista de tarefas (To-do list) desenvolvida com **React + TypeScript** no frontend, **FastAPI (Python)** no backend e **SQLite com SQLModel** para persistência no banco de dados.

---

## 🌐 Demonstração Online (Deploy na AWS)

A aplicação está hospedada e em produção na nuvem **AWS (Amazon Web Services)** através de uma arquitetura **100% Serverless**:

* 🚀 **Aplicação Web (Frontend):** [Acessar To-do List na AWS](http://todolist-app-003107248488.s3-website-us-east-1.amazonaws.com)  
  *(Ou via CloudFront HTTPS: [https://dvm8tyz2ogf1b.cloudfront.net](https://dvm8tyz2ogf1b.cloudfront.net))*
* ⚡ **API REST (Backend):** [https://kg02wdtsx4.execute-api.us-east-1.amazonaws.com](https://kg02wdtsx4.execute-api.us-east-1.amazonaws.com)
* 📖 **Documentação Swagger Interativa:** [https://kg02wdtsx4.execute-api.us-east-1.amazonaws.com/docs](https://kg02wdtsx4.execute-api.us-east-1.amazonaws.com/docs)

---

## 🏗️ Arquitetura do Projeto

### Arquitetura em Nuvem (AWS Serverless)
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

## 🧠 Conhecimentos Técnicos e Stacks Utilizadas

### 1. Frontend: React + TypeScript + Vite
* **React:** Construção de interface reativa e modular com componentes funcionais e Hooks:
  * `useState`: gerenciamento de estados locais (lista de tarefas, novos títulos, categorias e status de carregamento).
  * `useEffect`: busca inicial de dados ao carregar a página e sincronização de categorias.
  * `useRef`: controle de foco de inputs e prevenção de chamadas simultâneas.
* **Categorias Dinâmicas & Customizáveis:**
  * Criação de novas categorias com botão dedicado.
  * Modo de edição para renomear e excluir categorias existentes.
  * Seletor interativo em cada tarefa para alterar sua categoria a qualquer momento com persistência no banco.
* **TypeScript:** Tipagem estática garantindo segurança e integridade de dados na comunicação com a API.
* **Vite:** Ferramenta de build e servidor de desenvolvimento ultra veloz.
* **Drag & Drop e Acessibilidade:** Reordenação manual de tarefas usando a API nativa de arrastar e soltar do HTML5, com suporte a setas e botões acessíveis.

### 2. Backend: FastAPI (Python 3.12)
* **FastAPI:** Framework moderno e assíncrono para construção de APIs RESTful em Python.
* **Mangum:** Adaptador ASGI para rodar aplicações FastAPI diretamente em funções **AWS Lambda**.
* **Uvicorn:** Servidor ASGI de alta performance para o ambiente de desenvolvimento local.
* **CORS (Cross-Origin Resource Sharing):** Configuração de segurança que permite a comunicação entre origens diferentes.
* **Endpoints REST:**
  * `GET /tarefas`: listagem das tarefas ordenadas.
  * `POST /tarefas`: criação de nova tarefa.
  * `PATCH /tarefas/{id}`: atualização parcial (conclusão, título, categoria, prioridade).
  * `PUT /tarefas/ordem`: reordenação em lote com persistência.
  * `DELETE /tarefas/{id}`: exclusão definitiva.

### 3. Banco de Dados: SQLite + SQLModel + Nuvem
* **SQLite (`tarefas.db`):** Banco de dados relacional baseado em arquivo, leve e sem necessidade de servidor externo.
* **SQLModel (ORM):** Biblioteca que combina **Pydantic** e **SQLAlchemy**, permitindo criar modelos de dados e tabelas relacionais em código Python com tipagem.
* **Persistência Serverless no S3:** Sincronização automática com bucket AWS S3 quando executado na AWS Lambda, preservando os dados entre execuções.

---

## 🚀 Como Rodar a Aplicação Localmente

### Pré-requisitos
* **Node.js** (v18 ou superior) instalado
* **Python** (3.10 ou superior) instalado com o ambiente virtual `.venv` configurado

---

### Executando Frontend e Backend juntos (1 único comando)

Na pasta raiz do projeto, execute no seu terminal:

```bash
npm run dev
```

Este comando utiliza o **`concurrently`** para iniciar ambos os serviços ao mesmo tempo:
* **Frontend:** acessível em [http://127.0.0.1:5173](http://127.0.0.1:5173)
* **Backend (API):** rodando em [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Documentação interativa Swagger (FastAPI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📁 Estrutura de Pastas

```text
├── backend/
│   ├── database.py       # Configuração da conexão SQLite e sync com AWS S3
│   ├── main.py           # Rotas da API, regras de negócio, CORS e handler Mangum
│   ├── models.py         # Modelo da tabela de Tarefa (SQLModel)
│   ├── schemas.py        # Validação de dados de entrada/saída (Pydantic)
│   ├── requirements.txt  # Dependências Python do backend
│   └── test_ordem.py     # Testes automatizados de reordenação
├── src/
│   ├── services/
│   │   └── tasksApi.ts   # Funções de comunicação HTTP (fetch) com suporte a VITE_API_URL
│   ├── App.tsx           # Componente principal da interface To-do com categorias editáveis
│   ├── main.tsx          # Ponto de entrada do React
│   ├── style.css         # Folha de estilos moderna
│   └── vite-env.d.ts     # Tipagem de variáveis de ambiente do Vite
├── package.json          # Scripts e dependências do projeto
├── tarefas.db            # Arquivo do banco de dados SQLite local
└── README.md             # Documentação do projeto
```
