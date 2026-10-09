# Amanda Task Board (To-Do List Full Stack)

Aplicação completa de lista de tarefas (To-do list) desenvolvida com **React + TypeScript** no frontend, **FastAPI (Python)** no backend e **SQLite com SQLModel** para persistência no banco de dados.

---

## 🏗️ Visão Geral da Arquitetura

```text
┌────────────────────────────────────────────────────────┐
│                      FRONTEND                          │
│   React + TypeScript + Vite (Porta 5173)               │
│   (Interface, Botões, Drag & Drop, Consumo de API)     │
└───────────────────────────┬────────────────────────────┘
                            │ Requisições HTTP (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│                      BACKEND                           │
│   FastAPI + Python + Uvicorn (Porta 8000)              │
│   (Rotas de API, Regras de negócio, Validação, CORS)   │
└───────────────────────────┬────────────────────────────┘
                            │ ORM (SQLModel)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   BANCO DE DADOS                       │
│   SQLite (tarefas.db)                                  │
│   (Tabela de tarefas: id, titulo, ordem, concluida...) │
└───────────────────────────┴────────────────────────────┘
```

---

## 🧠 Conhecimentos Técnicos e Stacks Utilizadas

### 1. Frontend: React + TypeScript + Vite
* **React:** Construção de interface reativa e modular com componentes funcionais e Hooks:
  * `useState`: gerenciamento de estados locais (lista de tarefas, novos títulos, erros e status de carregamento).
  * `useEffect`: busca inicial de dados ao carregar a página.
  * `useRef`: controle de foco de inputs e prevenção de chamadas simultâneas.
* **TypeScript:** Tipagem estática garantindo segurança e integridade de dados na comunicação com a API.
* **Vite:** Ferramenta de build e servidor de desenvolvimento ultra veloz.
* **Drag & Drop e Acessibilidade:** Reordenação manual de tarefas usando a API nativa de arrastar e soltar do HTML5, com suporte a setas e leitores de tela.

### 2. Backend: FastAPI (Python)
* **FastAPI:** Framework moderno e assíncrono para construção de APIs RESTful em Python.
* **Uvicorn:** Servidor ASGI de alta performance para rodar a aplicação Python.
* **CORS (Cross-Origin Resource Sharing):** Configuração de segurança que permite a comunicação entre origens diferentes (porta 5173 do React falando com porta 8000 do FastAPI).
* **Endpoints REST:**
  * `GET /tarefas`: listagem das tarefas ordenadas.
  * `POST /tarefas`: criação de nova tarefa.
  * `PATCH /tarefas/{id}`: atualização parcial (conclusão, título, prioridade).
  * `PUT /tarefas/ordem`: reordenação em lote com persistência.
  * `DELETE /tarefas/{id}`: exclusão definitiva.

### 3. Banco de Dados: SQLite + SQLModel
* **SQLite (`tarefas.db`):** Banco de dados relacional baseado em arquivo, leve e sem necessidade de instalação de servidor externo.
* **SQLModel (ORM):** Biblioteca que combina **Pydantic** e **SQLAlchemy**, permitindo criar modelos de dados e tabelas relacionais em código Python com tipagem.
* **CRUD Completo:**
  * **C**reate: inserção de novos registros com autoincremento de ordem.
  * **R**ead: consultas filtradas e ordenadas via `select()`.
  * **U**pdate: atualização atômica de campos e ordem em transações.
  * **D**elete: remoção de registros por chave primária (`id`).

---

## 🚀 Como Rodar a Aplicação

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

### Comandos Individuais (Opcional)

Se preferir rodar cada parte em terminais separados:

* **Apenas o Frontend:**
  ```bash
  npm run dev:frontend
  ```
  

* **Apenas o Backend:**
  ```bash
  npm run dev:backend
  ```
  *(Ou diretamente via Python: `.\.venv\Scripts\python.exe -m uvicorn main:app --reload --app-dir backend --host 127.0.0.1 --port 8000`)*

---

## 📁 Estrutura de Pastas

```text
├── backend/
│   ├── database.py       # Configuração da conexão com o SQLite
│   ├── main.py           # Rotas da API, regras de negócio e CORS
│   ├── models.py         # Modelo da tabela de Tarefa (SQLModel)
│   ├── schemas.py        # Validação de dados de entrada/saída (Pydantic)
│   └── test_ordem.py     # Testes automatizados de reordenação
├── src/
│   ├── services/
│   │   └── tasksApi.ts   # Funções de comunicação HTTP (fetch) com o backend
│   ├── App.tsx           # Componente principal da interface To-do
│   └── main.tsx          # Ponto de entrada do React
├── package.json          # Scripts e dependências do projeto
├── tarefas.db            # Arquivo do banco de dados SQLite local
└── README.md             # Documentação do projeto
```
